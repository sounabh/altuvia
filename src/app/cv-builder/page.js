
"use client";

import React, { useState, createContext, useContext, useEffect, Suspense } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { CVBuilder } from "./components/CVBuilder";
import { PreviewPanel } from "./components/PreviewPanel";
import SmartTipsPanel from "./components/SmartTipsPanel";
import { VersionSaveDialog } from "./components/VersionSavedDialog";
import { toast } from "sonner";
import AIAnalysisChatPopup from "./components/AiAnalysisChatPopup";
import {
  VersionManager,
  clearVersionsCache,
} from "./components/VersionManager";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * CVDataContext - React context for sharing CV data across components
 * Provides cvData and updateCVData function to child components
 */
export const CVDataContext = createContext();

/**
 * useCVData - Custom hook to access CV data context
 * @returns {Object} CV data context containing cvData and updateCVData
 * @throws {Error} If used outside CVDataProvider
 */
export const useCVData = () => {
  const context = useContext(CVDataContext);
  if (!context) throw new Error("useCVData must be used within CVDataProvider");
  return context;
};

/**
 * Generates a unique CV number based on user ID
 * Format: cv-{userIdLast4}-{timestamp}-{random3Digits}
 * @param {string} userId - User's unique identifier
 * @returns {string} Unique CV number
 */
const generateUniqueCVNumber = (userId) => {
  const userIdPart = userId.slice(-4);
  const timestamp = Date.now().toString();
  const randomPart = Math.floor(Math.random() * 999).toString().padStart(3, "0");
  return `cv-${userIdPart}-${timestamp}-${randomPart}`;
};

/**
 * CVBuilderContent - Main content component that uses search params
 * Handles authentication, CV loading, and state management
 */
const CVBuilderContent = () => {
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

  /**
   * Main CV data structure with default empty values
   * Organized by sections: personal, education, experience, projects, skills, achievements, volunteer
   */
  const [cvData, setCvData] = useState({
    personal: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      website: "",
      linkedin: "",
      summary: "",
    },
    education: [
      {
        id: "1",
        institution: "",
        degree: "",
        field: "",
        startDate: "",
        endDate: "",
        gpa: "",
        description: "",
      },
    ],
    experience: [
      {
        id: "1",
        company: "",
        position: "",
        location: "",
        startDate: "",
        endDate: "",
        isCurrentRole: false,
        description: "",
      },
    ],
    projects: [],
    skills: [
      {
        id: "1",
        name: "Programming Languages",
        skills: [],
      },
    ],
    achievements: [
      {
        id: "1",
        title: "",
        organization: "",
        date: "",
        type: "",
        description: "",
      },
    ],
    volunteer: [
      {
        id: "1",
        organization: "",
        role: "",
        location: "",
        startDate: "",
        endDate: "",
        description: "",
        impact: "",
      },
    ],
  });

  // UI and preview states
  const [activeSection, setActiveSection] = useState("personal");
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [themeColor, setThemeColor] = useState("#1e40af");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showVersionManager, setShowVersionManager] = useState(false);

  /**
   * Effect: Redirect to login if user is not authenticated
   * Runs when authentication status changes
   */
  useEffect(() => {
    if (status === "unauthenticated") {
      toast.error("Please login to access CV Builder");
      router.push('/');
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
        // Check for cvId in URL parameters (from dashboard)
        const urlCVId = searchParams.get('cvId');
        
        if (urlCVId) {
          // Load CV from URL parameter
          console.log("Loading CV from URL parameter:", urlCVId);
          setCurrentCVId(urlCVId);
          
          // Store in localStorage for future sessions
          localStorage.setItem("currentCVId", urlCVId);
          
          // Load CV data (this will update cvNumber internally)
          await loadCVData(urlCVId, userEmail);
          
          // Clean URL (remove query parameter)
          router.replace('/cv-builder', { scroll: false });
          
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
   * Loads CV data from API based on CV ID and user email
   * @param {string} cvId - CV identifier
   * @param {string} email - User's email for authentication
   */
  const loadCVData = async (cvId, email) => {
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
        personal: result.cv.personalInfo || cvData.personal,
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
          })) || cvData.education,
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
          })) || cvData.experience,
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
          })) || cvData.skills,
        achievements:
          result.cv.achievements?.map((ach) => ({
            id: ach.id,
            title: ach.title || "",
            organization: ach.organization || "",
            date: ach.date || "",
            type: ach.type || "",
            description: ach.description || "",
          })) || cvData.achievements,
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
          })) || cvData.volunteer,
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
      if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError")) {
        toast.error("Network error. Please check your connection.");
      }
    }
  };

  /**
   * Updates CV data for a specific section
   * @param {string} section - Section name (personal, education, etc.)
   * @param {Object} data - New data for the section
   */
  const updateCVData = (section, data) => {
    setCvData((prev) => ({
      ...prev,
      [section]: data,
    }));
  };

  /**
   * Triggers AI analysis of the CV
   * Sends CV data to analysis API and updates state with results
   */
  const handleAnalyzeCV = async () => {
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
  };

  /**
   * Opens the AI chat popup
   */
  const handleOpenAIChat = () => {
    setShowAIChat(true);
  };

  /**
   * Shows version save dialog
   */
  const handleSaveClick = () => {
    setShowVersionDialog(true);
  };

  /**
   * Saves CV with version information
   * @param {Object} versionInfo - Version metadata (name, description, bookmark)
   */
  const handleSaveWithVersion = async (versionInfo) => {
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
      if (error.message?.includes("not found") || error.message?.includes("CV_NOT_FOUND")) {
        console.log("Clearing invalid CV ID from localStorage");
        setCurrentCVId(null);
        localStorage.removeItem("currentCVId");
        
        toast.error("Previous CV not found. Please save again to create a new CV.");
      } else {
        toast.error(error.message || "Failed to save CV");
      }
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Creates a new CV with default empty data
   * Resets all CV-related state and localStorage
   */
  const handleNewCV = () => {
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
    setThemeColor("#1e40af");

    // Reset CV data to default empty state
    setCvData({
      personal: {
        fullName: "",
        email: "",
        phone: "",
        location: "",
        website: "",
        linkedin: "",
        summary: "",
      },
      education: [
        {
          id: Date.now().toString(),
          institution: "",
          degree: "",
          field: "",
          startDate: "",
          endDate: "",
          gpa: "",
          description: "",
        },
      ],
      experience: [
        {
          id: Date.now().toString(),
          company: "",
          position: "",
          location: "",
          startDate: "",
          endDate: "",
          isCurrentRole: false,
          description: "",
        },
      ],
      projects: [],
      skills: [
        {
          id: Date.now().toString(),
          name: "Programming Languages",
          skills: [],
        },
      ],
      achievements: [
        {
          id: Date.now().toString(),
          title: "",
          organization: "",
          date: "",
          type: "",
          description: "",
        },
      ],
      volunteer: [
        {
          id: Date.now().toString(),
          organization: "",
          role: "",
          location: "",
          startDate: "",
          endDate: "",
          description: "",
          impact: "",
        },
      ],
    });

    // Reset UI state
    setActiveSection("personal");
    toast.success(`New CV #${uniqueNumber} created!`);
  };

  /**
   * Exports current CV as PDF
   * Generates PDF using API and triggers browser download
   */
  const handleExportPDF = async () => {
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
  };

  /**
   * Loads a specific saved version into the editor
   * @param {Object} version - Version object containing CV data snapshots
   */
  const handleLoadVersion = (version) => {
    try {
      // Parse and update CV data from version snapshots
      const newCvData = {
        personal: version.personalInfoSnapshot
          ? JSON.parse(version.personalInfoSnapshot)
          : cvData.personal,
        education: version.educationSnapshot
          ? JSON.parse(version.educationSnapshot)
          : cvData.education,
        experience: version.experienceSnapshot
          ? JSON.parse(version.experienceSnapshot)
          : cvData.experience,
        projects: version.projectsSnapshot
          ? JSON.parse(version.projectsSnapshot)
          : cvData.projects,
        skills: version.skillsSnapshot
          ? JSON.parse(version.skillsSnapshot)
          : cvData.skills,
        achievements: version.achievementsSnapshot
          ? JSON.parse(version.achievementsSnapshot)
          : cvData.achievements,
        volunteer: version.volunteerSnapshot
          ? JSON.parse(version.volunteerSnapshot)
          : cvData.volunteer,
      };

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
  };

  /**
   * Loading state while checking authentication or initializing CV
   * Shows spinner with appropriate message
   */
  if (status === "loading" || isInitialLoading) {
    return (
      <div className="min-h-screen bg-cvLightBg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#002147] mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            {status === "loading" ? "Loading CV Builder..." : "Loading your CV..."}
          </p>
        </div>
      </div>
    );
  }

  /**
   * Return null if unauthenticated (will redirect via useEffect)
   */
  if (status === "unauthenticated") {
    return null;
  }

  return (
    /* CV Data Context Provider for sharing data across components */
    <CVDataContext.Provider value={{ cvData, updateCVData }}>
      
      {/* Main container with background */}
      <div className="min-h-screen bg-cvLightBg mb-10">
        
        {/* Header component with all action buttons */}
        <Header
          onPreviewToggle={() => setIsPreviewMode(!isPreviewMode)}
          isPreviewMode={isPreviewMode}
          onAIToggle={() => {}}
          onVersionToggle={() => setShowVersionManager(!showVersionManager)}
          onSave={handleSaveClick}
          onNewCV={handleNewCV}
          cvNumber={cvNumber}
          cvData={cvData}
          selectedTemplate={selectedTemplate}
          isSaving={isSaving}
          isAnalyzing={isAnalyzing}
          atsScore={atsScore}
          onOpenAIChat={handleOpenAIChat}
          cvId={currentCVId}
          onExportPDF={handleExportPDF}
        />

        {/* Main content area with sidebar and builder */}
        <div className="flex h-[calc(100vh-80px)]">
          
          {/* Sidebar navigation for CV sections */}
          <Sidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />

          {/* Builder area with dynamic width based on preview mode */}
          <div className="flex-1 flex">
            <div
              className={`transition-all duration-300 ${
                isPreviewMode ? "w-1/2" : "flex-1"
              }`}
            >
              {/* Main CV builder form */}
              <CVBuilder
                activeSection={activeSection}
                onSectionChange={setActiveSection}
              />
            </div>

            {/* Preview panel (only shown in preview mode) */}
            {isPreviewMode && (
              <div className="w-1/2 border-l border-cvBorder">
                <PreviewPanel
                  selectedTemplate={selectedTemplate}
                  onTemplateChange={setSelectedTemplate}
                  cvData={cvData}
                  themeColor={themeColor}
                  onThemeColorChange={setThemeColor}
                />
              </div>
            )}
          </div>

          {/* AI Chat Popup (conditionally rendered) */}
          {showAIChat && (
            <AIAnalysisChatPopup
              onClose={() => setShowAIChat(false)}
              cvData={cvData}
              activeSection={activeSection}
            />
          )}

          {/* Version Manager Modal (conditionally rendered) */}
          {showVersionManager && (
            <VersionManager
              onClose={() => setShowVersionManager(false)}
              cvId={currentCVId}
              onLoadVersion={handleLoadVersion}
              userEmail={userEmail}
            />
          )}

          {/* Smart Tips Panel (shown when not in preview mode) */}
          <SmartTipsPanel
            activeSection={activeSection}
            isVisible={!isPreviewMode}
            cvData={cvData}
            aiAnalysis={aiAnalysis}
            isAnalyzing={isAnalyzing}
            onRequestAnalysis={handleAnalyzeCV}
          />
        </div>

        {/* Version Save Dialog (conditionally rendered) */}
        {showVersionDialog && (
          <VersionSaveDialog
            isOpen={showVersionDialog}
            onClose={() => setShowVersionDialog(false)}
            onSave={handleSaveWithVersion}
            currentVersionName=""
          />
        )}
      </div>
    </CVDataContext.Provider>
  );
};

/**
 * Index - Main component wrapped with Suspense for loading states
 * Provides fallback UI while components are loading
 */
const Index = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cvLightBg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#002147] mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading CV Builder...</p>
        </div>
      </div>
    }>
      <CVBuilderContent />
    </Suspense>
  );
};

export default Index;
