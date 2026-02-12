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
   * Runs when authentication status changes
   */
  useEffect(() => {
    if (status === "unauthenticated") {
      toast.error("Please login to access CV Builder");
      router.push("/");
    }
  }, [status, router]);

  /**
   * Effect: Initialize user data from session
   * Sets userId and userEmail when session is available
   */
  useEffect(() => {
    if (status === "authenticated" && session?.userId && session?.user?.email) {
      setUserId(session.userId);
      setUserEmail(session.user.email);
    }
  }, [status, session]);

  /**
   * Loads CV data from API based on CV ID and user email
   * @param {string} cvId - CV identifier
   * @param {string} email - User's email for authentication
   */
  const loadCVData = useCallback(
    async (cvId, email) => {
      try {
        if (!email) {
          console.log("No user email found - skipping CV load");
          return;
        }

        // Fetch CV data from API
        const response = await fetch(
          `/api/cv/save?cvId=${cvId}&userEmail=${encodeURIComponent(email)}`
        );

        // Handle 404 - CV not found
        if (response.status === 404) {
          console.log("CV not found - clearing invalid ID");
          setCurrentCVId(null);
          localStorage.removeItem("currentCVId");
          toast.info("Previous CV not found. Starting fresh.");
          return;
        }

        // Handle other response errors
        if (!response.ok) {
          console.warn(`Failed to load CV: ${response.status}`);

          if (response.status === 401 || response.status === 403) {
            toast.error("Authentication error. Please log in again.");
            return;
          }
          return;
        }

        const text = await response.text();

        // Handle empty response
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

        // Validate response structure
        if (!result.success || !result.cv) {
          console.log("Invalid CV data structure received");

          if (result.code === "CV_NOT_FOUND") {
            setCurrentCVId(null);
            localStorage.removeItem("currentCVId");
            toast.info("CV not found. Starting fresh.");
          }
          return;
        }

        // Update CV number from loaded data
        if (result.cv.slug) {
          setCvNumber(result.cv.slug);
          localStorage.setItem("currentCVNumber", result.cv.slug);
        }

        // Successfully loaded - update state with transformed data
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

        // Load template and theme preferences
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

        // Handle network errors
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
   * @param {string} versionId - Version identifier
   * @param {string} email - User's email for authentication
   */
  const loadVersionData = useCallback(
    async (versionId, email) => {
      try {
        console.log("Loading specific version:", versionId);
        
        // Fetch the specific version data
        const versionResponse = await fetch(
          `/api/cv/versions/${versionId}?userEmail=${encodeURIComponent(email)}`
        );

        if (!versionResponse.ok) {
          throw new Error("Failed to load version");
        }

        const versionData = await versionResponse.json();

        if (versionData.success && versionData.version) {
          const version = versionData.version;
          
          // Parse snapshots
          const personalSnapshot = safeJsonParse(version.personalInfoSnapshot);
          const educationSnapshot = safeJsonParse(version.educationSnapshot);
          const experienceSnapshot = safeJsonParse(version.experienceSnapshot);
          const projectsSnapshot = safeJsonParse(version.projectsSnapshot);
          const skillsSnapshot = safeJsonParse(version.skillsSnapshot);
          const achievementsSnapshot = safeJsonParse(version.achievementsSnapshot);
          const volunteerSnapshot = safeJsonParse(version.volunteerSnapshot);

          // Transform data to match expected format
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

          // Update CV data state with version data
          setCvData(versionCvData);

          // Restore template and theme preferences
          if (version.templateId) {
            setSelectedTemplate(version.templateId);
          }

          if (version.colorScheme) {
            setThemeColor(version.colorScheme);
          }

          // Update CV identification
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
   * Handles CV initialization from URL params, localStorage, or creating new CV
   */
  useEffect(() => {
    const initializeCV = async () => {
      // Wait for authentication and user data
      if (status !== "authenticated" || !userEmail || !userId) {
        return;
      }

      try {
        // Check for 'new' parameter first (highest priority)
        const isNewCV = searchParams.get("new") === "true";
        
        if (isNewCV) {
          console.log("Creating new CV from dashboard");
          
          // Clear old CV data
          setCurrentCVId(null);
          localStorage.removeItem("currentCVId");
          
          // Generate new unique CV number
          const uniqueNumber = generateUniqueCVNumber(userId);
          setCvNumber(uniqueNumber);
          localStorage.setItem("currentCVNumber", uniqueNumber);
          
          // Reset CV data to fresh state
          setCvData(createFreshCVData());
          
          // Reset analysis and theme
          setAiAnalysis(null);
          setAtsScore(null);
          setThemeColor(DEFAULT_THEME_COLOR);
          setSelectedTemplate(DEFAULT_TEMPLATE);
          
          toast.success(`New CV #${uniqueNumber} created!`);
          setIsInitialLoading(false);
          return;
        }

        // Check for cvId in URL parameters (from dashboard edit)
        const urlCVId = searchParams.get("cvId");
        const urlVersionId = searchParams.get("versionId");

        if (urlCVId) {
          console.log("Loading CV from URL parameter:", urlCVId);
          setCurrentCVId(urlCVId);
          localStorage.setItem("currentCVId", urlCVId);

          // If versionId is present, load that specific version instead of the CV
          if (urlVersionId) {
            const versionLoaded = await loadVersionData(urlVersionId, userEmail);
            
            if (!versionLoaded) {
              // Fallback to loading the CV normally if version load fails
              console.log("Version load failed, falling back to CV");
              await loadCVData(urlCVId, userEmail);
            }
          } else {
            // No version specified, load the latest CV data
            await loadCVData(urlCVId, userEmail);
          }
        } else {
          // Fallback to localStorage for existing CV
          const savedCVId = localStorage.getItem("currentCVId");
          const savedCVNumber = localStorage.getItem("currentCVNumber");

          if (savedCVId && savedCVNumber) {
            setCurrentCVId(savedCVId);
            setCvNumber(savedCVNumber);
            await loadCVData(savedCVId, userEmail);
          } else {
            // Create new CV number for new user
            const uniqueNumber = generateUniqueCVNumber(userId);
            setCvNumber(uniqueNumber);
            localStorage.setItem("currentCVNumber", uniqueNumber);
          }
        }
      } catch (error) {
        console.error("Error initializing CV:", error);
        // Fallback to new CV on error
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
   * @param {string} section - Section name (personal, education, etc.)
   * @param {Object} data - New data for the section
   */
  const updateCVData = useCallback((section, data) => {
    setCvData((prev) => ({
      ...prev,
      [section]: data,
    }));
  }, []);

  /**
   * Triggers AI analysis of the CV
   * Sends CV data to analysis API and updates state with results
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

      // Update analysis state
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
   * @param {Object} versionInfo - Version metadata (name, description, bookmark)
   */
  const handleSaveWithVersion = useCallback(
    async (versionInfo) => {
      try {
        setIsSaving(true);
        setShowVersionDialog(false);

        // Authentication check
        if (!userEmail) {
          toast.error("Authentication required. Please log in.");
          return;
        }

        // Prepare save payload
        const payload = {
          cvData,
          selectedTemplate,
          themeColor,
          cvTitle: `CV #${cvNumber}`,
          userEmail,
          cvId: currentCVId,
          cvNumber: cvNumber,
          versionInfo,
        };

        // Send save request to API
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
          // Update current CV ID and number
          if (result.cv.id) {
            setCurrentCVId(result.cv.id);
            localStorage.setItem("currentCVId", result.cv.id);

            if (result.cv.cvNumber) {
              setCvNumber(result.cv.cvNumber);
              localStorage.setItem("currentCVNumber", result.cv.cvNumber);
            }
          }

          // Clear versions cache for this user
          clearVersionsCache(userEmail);

          // Show appropriate success message
          const action = result.isNewCV ? "created" : "updated";
          toast.success(
            `CV ${action} successfully as version: ${versionInfo.versionName}`
          );

          // Additional info for new CV creation
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

        // Handle CV not found errors
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
   * Resets all CV-related state and localStorage
   */
  const handleNewCV = useCallback(() => {
    // User authentication check
    if (!userId) {
      toast.error("User ID not found. Please log in again.");
      return;
    }

    // Generate new unique CV number
    const uniqueNumber = generateUniqueCVNumber(userId);

    // Reset CV identification
    setCurrentCVId(null);
    localStorage.removeItem("currentCVId");
    setCvNumber(uniqueNumber);
    localStorage.setItem("currentCVNumber", uniqueNumber);

    // Reset analysis and theme
    setAiAnalysis(null);
    setAtsScore(null);
    setThemeColor(DEFAULT_THEME_COLOR);

    // Reset CV data to default empty state
    setCvData(createFreshCVData());

    // Reset UI state
    setActiveSection("personal");
    toast.success(`New CV #${uniqueNumber} created!`);
  }, [userId]);

  /**
   * Exports current CV as PDF
   * Generates PDF using API and triggers browser download
   */
  const handleExportPDF = useCallback(async () => {
    try {
      toast.info("Generating PDF...");

      // Request PDF generation from API
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

      // Create download link for PDF blob
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
   * @param {Object} version - Version object containing CV data snapshots
   */
  const handleLoadVersion = useCallback(
    (version) => {
      try {
        // Parse snapshots
        const personalSnapshot = safeJsonParse(version.personalInfoSnapshot);
        const educationSnapshot = safeJsonParse(version.educationSnapshot);
        const experienceSnapshot = safeJsonParse(version.experienceSnapshot);
        const projectsSnapshot = safeJsonParse(version.projectsSnapshot);
        const skillsSnapshot = safeJsonParse(version.skillsSnapshot);
        const achievementsSnapshot = safeJsonParse(version.achievementsSnapshot);
        const volunteerSnapshot = safeJsonParse(version.volunteerSnapshot);

        // Transform data to match expected format (same as loadCVData)
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

        // Update CV data state
        setCvData(newCvData);

        // Restore template and theme preferences
        if (version.templateId) {
          setSelectedTemplate(version.templateId);
        }

        if (version.colorScheme) {
          setThemeColor(version.colorScheme);
        }

        // Reset analysis for loaded version
        setAiAnalysis(null);
        setAtsScore(null);

        // Update CV identification
        setCurrentCVId(version.cvId);
        setCvNumber(version.cvSlug);
        localStorage.setItem("currentCVId", version.cvId);
        localStorage.setItem("currentCVNumber", version.cvSlug);

        toast.success(
          `Loaded CV #${version.cvSlug} - version: ${version.versionLabel}`
        );

        // Close version manager after loading
        setShowVersionManager(false);
      } catch (error) {
        console.error("Failed to load version:", error);
        toast.error("Failed to load version");
      }
    },
    [safeJsonParse]
  );

  // Return all state and handlers
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