"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { clearVersionsCache } from "@/app/dashboard/cv-builder/components/VersionManager";
import {
  generateUniqueCVNumber,
  DEFAULT_CV_DATA,
  DEFAULT_THEME_COLOR,
  DEFAULT_TEMPLATE,
  createFreshCVData,
} from "../constants/CVDataContext";

/**
 * useCVBuilder - Custom hook that manages all CV builder state and operations
 * Handles authentication, CV loading/saving, AI analysis, and UI state
 * @returns {Object} All state values and handler functions for the CV builder
 */
export const useCVBuilder = () => {
  // NextAuth session and routing
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // CV identification states
  const [cvNumber, setCvNumber] = useState("");
  const [currentCVId, setCurrentCVId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  // UI and operation states
  const [isSaving, setIsSaving] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // AI Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [atsScore, setAtsScore] = useState(null);
  const [showAIChat, setShowAIChat] = useState(false);

  // CV data state
  const [cvData, setCvData] = useState(DEFAULT_CV_DATA);

  // UI and preview states
  const [activeSection, setActiveSection] = useState("personal");
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULT_TEMPLATE);
  const [themeColor, setThemeColor] = useState(DEFAULT_THEME_COLOR);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showVersionManager, setShowVersionManager] = useState(false);

  /**
   * Effect: Redirect to login if user is not authenticated
   */
  useEffect(() => {
    if (status === "unauthenticated") {
      toast.error("Please login to access CV Builder");
      router.push("/");
    }
  }, [status, router]);

  /**
   * Effect: Initialize user data from session
   */
  useEffect(() => {
    if (status === "authenticated" && session?.userId && session?.user?.email) {
      setUserId(session.userId);
      setUserEmail(session.user.email);
    }
  }, [status, session]);

  /**
   * Loads CV data from API based on CV ID and user email
   */
  const loadCVData = useCallback(
    async (cvId, email) => {
      try {
        if (!email) {
          console.log("No user email found - skipping CV load");
          return;
        }

        const response = await fetch(
          `/api/cv/save?cvId=${cvId}&userEmail=${encodeURIComponent(email)}`
        );

        if (response.status === 404) {
          console.log("CV not found - clearing invalid ID");
          setCurrentCVId(null);
          localStorage.removeItem("currentCVId");
          toast.info("Previous CV not found. Starting fresh.");
          return;
        }

        if (!response.ok) {
          console.warn(`Failed to load CV: ${response.status}`);
          if (response.status === 401 || response.status === 403) {
            toast.error("Authentication error. Please log in again.");
          }
          return;
        }

        const text = await response.text();
        if (!text || text.trim() === "") {
          console.log("Empty response - no CV data available");
          return;
        }

        let result;
        try {
          result = JSON.parse(text);
        } catch (parseError) {
          console.error("Failed to parse CV data:", parseError);
          return;
        }

        if (!result.success || !result.cv) {
          console.log("Invalid CV data structure received");
          if (result.code === "CV_NOT_FOUND") {
            setCurrentCVId(null);
            localStorage.removeItem("currentCVId");
            toast.info("CV not found. Starting fresh.");
          }
          return;
        }

        if (result.cv.slug) {
          setCvNumber(result.cv.slug);
          localStorage.setItem("currentCVNumber", result.cv.slug);
        }

        setCvData({
          personal: result.cv.personalInfo || DEFAULT_CV_DATA.personal,
          education:
            result.cv.educations?.map((edu) => ({
              id: edu.id,
              institution: edu.institution || "",
              degree: edu.degree || "",
              field: edu.fieldOfStudy || "",
              startDate: edu.startDate || "",
              endDate: edu.endDate || "",
              gpa: edu.gpa || "",
              description: edu.description || "",
            })) || DEFAULT_CV_DATA.education,
          experience:
            result.cv.experiences?.map((exp) => ({
              id: exp.id,
              company: exp.company || "",
              position: exp.position || "",
              location: exp.location || "",
              startDate: exp.startDate || "",
              endDate: exp.endDate || "",
              isCurrentRole: exp.isCurrent || false,
              description: exp.description || "",
            })) || DEFAULT_CV_DATA.experience,
          projects:
            result.cv.projects?.map((proj) => ({
              id: proj.id,
              name: proj.name || "",
              description: proj.description || "",
              technologies: proj.technologies?.join(", ") || "",
              startDate: proj.startDate || "",
              endDate: proj.endDate || "",
              githubUrl: proj.githubUrl || "",
              liveUrl: proj.liveUrl || "",
              achievements: proj.achievements?.[0] || "",
            })) || [],
          skills:
            result.cv.skills?.map((skill) => ({
              id: skill.id,
              name: skill.categoryName || "",
              skills: skill.skills || [],
            })) || DEFAULT_CV_DATA.skills,
          achievements:
            result.cv.achievements?.map((ach) => ({
              id: ach.id,
              title: ach.title || "",
              organization: ach.organization || "",
              date: ach.date || "",
              type: ach.type || "",
              description: ach.description || "",
            })) || DEFAULT_CV_DATA.achievements,
          volunteer:
            result.cv.volunteers?.map((vol) => ({
              id: vol.id,
              organization: vol.organization || "",
              role: vol.role || "",
              location: vol.location || "",
              startDate: vol.startDate || "",
              endDate: vol.endDate || "",
              description: vol.description || "",
              impact: vol.impact || "",
            })) || DEFAULT_CV_DATA.volunteer,
        });

        if (result.cv.templateId) {
          setSelectedTemplate(result.cv.templateId);
        }
        if (result.cv.colorScheme) {
          setThemeColor(result.cv.colorScheme);
        }

        console.log("CV data loaded successfully");
        if (result.cv.slug) {
          toast.success(`CV #${result.cv.slug} loaded successfully!`);
        } else {
          toast.success("CV loaded successfully!");
        }
      } catch (error) {
        console.error("Error loading CV data:", error);
        if (
          error.message?.includes("Failed to fetch") ||
          error.message?.includes("NetworkError")
        ) {
          toast.error("Network error. Please check your connection.");
        }
      }
    },
    []
  );

  /**
   * Helper function to safely parse JSON snapshots
   */
  const safeJsonParse = useCallback((data) => {
    if (!data) return null;
    if (typeof data === 'object') return data;
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse snapshot:", e);
      return null;
    }
  }, []);

  /**
   * Loads a specific version's data
   */
  const loadVersionData = useCallback(
    async (versionId, email) => {
      try {
        console.log("Loading specific version:", versionId);

        const versionResponse = await fetch(
          `/api/cv/versions/${versionId}?userEmail=${encodeURIComponent(email)}`
        );

        if (!versionResponse.ok) {
          throw new Error("Failed to load version");
        }

        const versionData = await versionResponse.json();

        if (versionData.success && versionData.version) {
          const version = versionData.version;

          const personalSnapshot = safeJsonParse(version.personalInfoSnapshot);
          const educationSnapshot = safeJsonParse(version.educationSnapshot);
          const experienceSnapshot = safeJsonParse(version.experienceSnapshot);
          const projectsSnapshot = safeJsonParse(version.projectsSnapshot);
          const skillsSnapshot = safeJsonParse(version.skillsSnapshot);
          const achievementsSnapshot = safeJsonParse(version.achievementsSnapshot);
          const volunteerSnapshot = safeJsonParse(version.volunteerSnapshot);

          const versionCvData = {
            personal: personalSnapshot || DEFAULT_CV_DATA.personal,

            education: educationSnapshot && Array.isArray(educationSnapshot)
              ? educationSnapshot.map((edu) => ({
                  id: edu.id,
                  institution: edu.institution || "",
                  degree: edu.degree || "",
                  field: edu.fieldOfStudy || edu.field || "",
                  startDate: edu.startDate || "",
                  endDate: edu.endDate || "",
                  gpa: edu.gpa || "",
                  description: edu.description || "",
                }))
              : DEFAULT_CV_DATA.education,

            experience: experienceSnapshot && Array.isArray(experienceSnapshot)
              ? experienceSnapshot.map((exp) => ({
                  id: exp.id,
                  company: exp.company || "",
                  position: exp.position || "",
                  location: exp.location || "",
                  startDate: exp.startDate || "",
                  endDate: exp.endDate || "",
                  isCurrentRole: exp.isCurrent || exp.isCurrentRole || false,
                  description: exp.description || "",
                }))
              : DEFAULT_CV_DATA.experience,

            projects: projectsSnapshot && Array.isArray(projectsSnapshot)
              ? projectsSnapshot.map((proj) => ({
                  id: proj.id,
                  name: proj.name || "",
                  description: proj.description || "",
                  technologies: Array.isArray(proj.technologies) 
                    ? proj.technologies.join(", ") 
                    : (proj.technologies || ""),
                  startDate: proj.startDate || "",
                  endDate: proj.endDate || "",
                  githubUrl: proj.githubUrl || "",
                  liveUrl: proj.liveUrl || "",
                  achievements: Array.isArray(proj.achievements) 
                    ? proj.achievements[0] 
                    : (proj.achievements || ""),
                }))
              : [],

            skills: skillsSnapshot && Array.isArray(skillsSnapshot)
              ? skillsSnapshot.map((skill) => ({
                  id: skill.id,
                  name: skill.categoryName || skill.name || "",
                  skills: skill.skills || [],
                }))
              : DEFAULT_CV_DATA.skills,

            achievements: achievementsSnapshot && Array.isArray(achievementsSnapshot)
              ? achievementsSnapshot.map((ach) => ({
                  id: ach.id,
                  title: ach.title || "",
                  organization: ach.organization || "",
                  date: ach.date || "",
                  type: ach.type || "",
                  description: ach.description || "",
                }))
              : DEFAULT_CV_DATA.achievements,

            volunteer: volunteerSnapshot && Array.isArray(volunteerSnapshot)
              ? volunteerSnapshot.map((vol) => ({
                  id: vol.id,
                  organization: vol.organization || "",
                  role: vol.role || "",
                  location: vol.location || "",
                  startDate: vol.startDate || "",
                  endDate: vol.endDate || "",
                  description: vol.description || "",
                  impact: vol.impact || "",
                }))
              : DEFAULT_CV_DATA.volunteer,
          };

          setCvData(versionCvData);

          if (version.templateId) {
            setSelectedTemplate(version.templateId);
          }
          if (version.colorScheme) {
            setThemeColor(version.colorScheme);
          }
          if (version.cvSlug) {
            setCvNumber(version.cvSlug);
            localStorage.setItem("currentCVNumber", version.cvSlug);
          }

          console.log("Version loaded successfully");
          toast.success(`Loaded version: ${version.versionLabel}`);
          return true;
        } else {
          throw new Error("Invalid version data");
        }
      } catch (error) {
        console.error("Failed to load version:", error);
        toast.error("Failed to load version");
        return false;
      }
    },
    [safeJsonParse]
  );

  /**
   * Effect: Load CV based on URL parameters or localStorage
   */
  useEffect(() => {
    const initializeCV = async () => {
      if (status !== "authenticated" || !userEmail || !userId) {
        return;
      }

      try {
        const isNewCV = searchParams.get("new") === "true";
        const cvName = searchParams.get("cvName"); // GET NAME

        if (isNewCV) {
          console.log("Creating new CV from dashboard");

          setCurrentCVId(null);
          localStorage.removeItem("currentCVId");

          const uniqueNumber = generateUniqueCVNumber(userId);
          setCvNumber(uniqueNumber);
          localStorage.setItem("currentCVNumber", uniqueNumber);

          // STORE CV NAME
          if (cvName) {
            localStorage.setItem("currentCVTitle", cvName);
          }

          setCvData(createFreshCVData());
          setAiAnalysis(null);
          setAtsScore(null);
          setThemeColor(DEFAULT_THEME_COLOR);
          setSelectedTemplate(DEFAULT_TEMPLATE);

          toast.success(cvName ? `New CV "${cvName}" created!` : `New CV #${uniqueNumber} created!`);
          setIsInitialLoading(false);
          return;
        }

        const urlCVId = searchParams.get("cvId");
        const urlVersionId = searchParams.get("versionId");

        if (urlCVId) {
          console.log("Loading CV from URL parameter:", urlCVId);
          setCurrentCVId(urlCVId);
          localStorage.setItem("currentCVId", urlCVId);

          if (urlVersionId) {
            const versionLoaded = await loadVersionData(urlVersionId, userEmail);
            if (!versionLoaded) {
              console.log("Version load failed, falling back to CV");
              await loadCVData(urlCVId, userEmail);
            }
          } else {
            await loadCVData(urlCVId, userEmail);
          }
        } else {
          const savedCVId = localStorage.getItem("currentCVId");
          const savedCVNumber = localStorage.getItem("currentCVNumber");

          if (savedCVId && savedCVNumber) {
            setCurrentCVId(savedCVId);
            setCvNumber(savedCVNumber);
            await loadCVData(savedCVId, userEmail);
          } else {
            const uniqueNumber = generateUniqueCVNumber(userId);
            setCvNumber(uniqueNumber);
            localStorage.setItem("currentCVNumber", uniqueNumber);
          }
        }
      } catch (error) {
        console.error("Error initializing CV:", error);
        const uniqueNumber = generateUniqueCVNumber(userId);
        setCvNumber(uniqueNumber);
        localStorage.setItem("currentCVNumber", uniqueNumber);
      } finally {
        setIsInitialLoading(false);
      }
    };

    initializeCV();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, userEmail, userId]);

  /**
   * Updates CV data for a specific section
   */
  const updateCVData = useCallback((section, data) => {
    setCvData((prev) => ({
      ...prev,
      [section]: data,
    }));
  }, []);

  /**
   * Triggers AI analysis of the CV
   */
  const handleAnalyzeCV = useCallback(async () => {
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/cv/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvData,
          analysisType: "comprehensive",
        }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();

      setAiAnalysis(data);
      setAtsScore(data.atsScore);

      toast.success("CV analysis completed!", {
        description: `Overall Score: ${data.overallAnalysis.overallScore}% | ATS Score: ${data.atsScore}%`,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze CV. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [cvData]);

  /**
   * Opens the AI chat popup
   */
  const handleOpenAIChat = useCallback(() => {
    setShowAIChat(true);
  }, []);

  /**
   * Closes the AI chat popup
   */
  const handleCloseAIChat = useCallback(() => {
    setShowAIChat(false);
  }, []);

  /**
   * Shows version save dialog
   */
  const handleSaveClick = useCallback(() => {
    setShowVersionDialog(true);
  }, []);

  /**
   * Closes version save dialog
   */
  const handleCloseVersionDialog = useCallback(() => {
    setShowVersionDialog(false);
  }, []);

  /**
   * Toggles preview mode
   */
  const handlePreviewToggle = useCallback(() => {
    setIsPreviewMode((prev) => !prev);
  }, []);

  /**
   * Toggles version manager visibility
   */
  const handleVersionToggle = useCallback(() => {
    setShowVersionManager((prev) => !prev);
  }, []);

  /**
   * Closes version manager
   */
  const handleCloseVersionManager = useCallback(() => {
    setShowVersionManager(false);
  }, []);

  /**
   * Saves CV with version information
   */
  const handleSaveWithVersion = useCallback(
    async (versionInfo) => {
      try {
        setIsSaving(true);
        setShowVersionDialog(false);

        if (!userEmail) {
          toast.error("Authentication required. Please log in.");
          return;
        }

        // GET CV TITLE FROM LOCALSTORAGE
        const cvTitle = localStorage.getItem("currentCVTitle") || `CV #${cvNumber}`;

        const payload = {
          cvData,
          selectedTemplate,
          themeColor,
          cvTitle, // THIS IS THE CV NAME
          userEmail,
          cvId: currentCVId,
          cvNumber: cvNumber,
          versionInfo,
        };

        const response = await fetch("/api/cv/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }

        const result = await response.json();

        if (result.success) {
          if (result.cv.id) {
            setCurrentCVId(result.cv.id);
            localStorage.setItem("currentCVId", result.cv.id);

            if (result.cv.cvNumber) {
              setCvNumber(result.cv.cvNumber);
              localStorage.setItem("currentCVNumber", result.cv.cvNumber);
            }
          }

          clearVersionsCache(userEmail);

          const action = result.isNewCV ? "created" : "updated";
          toast.success(
            `CV ${action} successfully as version: ${versionInfo.versionName}`
          );

          if (result.isNewCV && currentCVId) {
            toast.info(
              "A new CV was created. Previous CV may have been deleted.",
              { duration: 5000 }
            );
          }
        } else {
          throw new Error(result.error || "Failed to save CV");
        }
      } catch (error) {
        console.error("CV Save Error:", error);

        if (
          error.message?.includes("not found") ||
          error.message?.includes("CV_NOT_FOUND")
        ) {
          console.log("Clearing invalid CV ID from localStorage");
          setCurrentCVId(null);
          localStorage.removeItem("currentCVId");

          toast.error(
            "Previous CV not found. Please save again to create a new CV."
          );
        } else {
          toast.error(error.message || "Failed to save CV");
        }
      } finally {
        setIsSaving(false);
      }
    },
    [cvData, selectedTemplate, themeColor, cvNumber, userEmail, currentCVId]
  );

  /**
   * Creates a new CV with default empty data
   */
  const handleNewCV = useCallback(() => {
    if (!userId) {
      toast.error("User ID not found. Please log in again.");
      return;
    }

    const uniqueNumber = generateUniqueCVNumber(userId);

    setCurrentCVId(null);
    localStorage.removeItem("currentCVId");
    setCvNumber(uniqueNumber);
    localStorage.setItem("currentCVNumber", uniqueNumber);

    // Optionally clear stored title if desired, but we keep it for new CVs?
    // If you want to start fresh without a title, uncomment next line:
    // localStorage.removeItem("currentCVTitle");

    setAiAnalysis(null);
    setAtsScore(null);
    setThemeColor(DEFAULT_THEME_COLOR);
    setCvData(createFreshCVData());
    setActiveSection("personal");
    toast.success(`New CV #${uniqueNumber} created!`);
  }, [userId]);

  /**
   * Exports current CV as PDF
   */
  const handleExportPDF = useCallback(async () => {
    try {
      toast.info("Generating PDF...");

      const response = await fetch("/api/cv/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvData,
          templateId: selectedTemplate,
          themeColor,
          cvNumber,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CV-${cvNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export PDF");
    }
  }, [cvData, selectedTemplate, themeColor, cvNumber]);

  /**
   * Loads a specific saved version into the editor
   */
  const handleLoadVersion = useCallback(
    (version) => {
      try {
        const personalSnapshot = safeJsonParse(version.personalInfoSnapshot);
        const educationSnapshot = safeJsonParse(version.educationSnapshot);
        const experienceSnapshot = safeJsonParse(version.experienceSnapshot);
        const projectsSnapshot = safeJsonParse(version.projectsSnapshot);
        const skillsSnapshot = safeJsonParse(version.skillsSnapshot);
        const achievementsSnapshot = safeJsonParse(version.achievementsSnapshot);
        const volunteerSnapshot = safeJsonParse(version.volunteerSnapshot);

        const newCvData = {
          personal: personalSnapshot || DEFAULT_CV_DATA.personal,

          education: educationSnapshot && Array.isArray(educationSnapshot)
            ? educationSnapshot.map((edu) => ({
                id: edu.id,
                institution: edu.institution || "",
                degree: edu.degree || "",
                field: edu.fieldOfStudy || edu.field || "",
                startDate: edu.startDate || "",
                endDate: edu.endDate || "",
                gpa: edu.gpa || "",
                description: edu.description || "",
              }))
            : DEFAULT_CV_DATA.education,

          experience: experienceSnapshot && Array.isArray(experienceSnapshot)
            ? experienceSnapshot.map((exp) => ({
                id: exp.id,
                company: exp.company || "",
                position: exp.position || "",
                location: exp.location || "",
                startDate: exp.startDate || "",
                endDate: exp.endDate || "",
                isCurrentRole: exp.isCurrent || exp.isCurrentRole || false,
                description: exp.description || "",
              }))
            : DEFAULT_CV_DATA.experience,

          projects: projectsSnapshot && Array.isArray(projectsSnapshot)
            ? projectsSnapshot.map((proj) => ({
                id: proj.id,
                name: proj.name || "",
                description: proj.description || "",
                technologies: Array.isArray(proj.technologies) 
                  ? proj.technologies.join(", ") 
                  : (proj.technologies || ""),
                startDate: proj.startDate || "",
                endDate: proj.endDate || "",
                githubUrl: proj.githubUrl || "",
                liveUrl: proj.liveUrl || "",
                achievements: Array.isArray(proj.achievements) 
                  ? proj.achievements[0] 
                  : (proj.achievements || ""),
              }))
            : [],

          skills: skillsSnapshot && Array.isArray(skillsSnapshot)
            ? skillsSnapshot.map((skill) => ({
                id: skill.id,
                name: skill.categoryName || skill.name || "",
                skills: skill.skills || [],
              }))
            : DEFAULT_CV_DATA.skills,

          achievements: achievementsSnapshot && Array.isArray(achievementsSnapshot)
            ? achievementsSnapshot.map((ach) => ({
                id: ach.id,
                title: ach.title || "",
                organization: ach.organization || "",
                date: ach.date || "",
                type: ach.type || "",
                description: ach.description || "",
              }))
            : DEFAULT_CV_DATA.achievements,

          volunteer: volunteerSnapshot && Array.isArray(volunteerSnapshot)
            ? volunteerSnapshot.map((vol) => ({
                id: vol.id,
                organization: vol.organization || "",
                role: vol.role || "",
                location: vol.location || "",
                startDate: vol.startDate || "",
                endDate: vol.endDate || "",
                description: vol.description || "",
                impact: vol.impact || "",
              }))
            : DEFAULT_CV_DATA.volunteer,
        };

        setCvData(newCvData);

        if (version.templateId) {
          setSelectedTemplate(version.templateId);
        }
        if (version.colorScheme) {
          setThemeColor(version.colorScheme);
        }

        setAiAnalysis(null);
        setAtsScore(null);

        setCurrentCVId(version.cvId);
        setCvNumber(version.cvSlug);
        localStorage.setItem("currentCVId", version.cvId);
        localStorage.setItem("currentCVNumber", version.cvSlug);

        toast.success(
          `Loaded CV #${version.cvSlug} - version: ${version.versionLabel}`
        );

        setShowVersionManager(false);
      } catch (error) {
        console.error("Failed to load version:", error);
        toast.error("Failed to load version");
      }
    },
    [safeJsonParse]
  );

  return {
    // Authentication state
    status,
    session,
    userEmail,
    userId,

    // CV identification
    cvNumber,
    currentCVId,

    // CV data
    cvData,
    updateCVData,

    // UI state
    activeSection,
    setActiveSection,
    selectedTemplate,
    setSelectedTemplate,
    themeColor,
    setThemeColor,
    isPreviewMode,
    showVersionManager,
    showVersionDialog,
    showAIChat,
    isInitialLoading,

    // Operation states
    isSaving,
    isAnalyzing,
    aiAnalysis,
    atsScore,

    // Handlers
    handlePreviewToggle,
    handleVersionToggle,
    handleCloseVersionManager,
    handleSaveClick,
    handleCloseVersionDialog,
    handleSaveWithVersion,
    handleNewCV,
    handleExportPDF,
    handleAnalyzeCV,
    handleOpenAIChat,
    handleCloseAIChat,
    handleLoadVersion,
  };
};

export default useCVBuilder;