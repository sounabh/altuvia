"use client";

import React, { useState, createContext, useContext, useEffect } from "react";
import dynamic from "next/dynamic";
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
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export const CVDataContext = createContext();

export const useCVData = () => {
  const context = useContext(CVDataContext);
  if (!context) throw new Error("useCVData must be used within CVDataProvider");
  return context;
};

const generateUniqueCVNumber = (userId) => {
  const userIdPart = userId.slice(-6);
  const randomPart = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, "0");
  const timestamp = Date.now().toString().slice(-4);
  return `${userIdPart}${timestamp}${randomPart}`;
};

const Index = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [cvNumber, setCvNumber] = useState("");
  const [currentCVId, setCurrentCVId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [atsScore, setAtsScore] = useState(null);
  const [showAIChat, setShowAIChat] = useState(false);

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

  const [activeSection, setActiveSection] = useState("personal");
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [themeColor, setThemeColor] = useState("#1e40af");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showVersionManager, setShowVersionManager] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      toast.error("Please login to access CV Builder");
      router.push('/');
    }
  }, [status, router]);

  // Initialize user data from session - ONLY userId and email from session
  useEffect(() => {
    if (status === "authenticated" && session?.userId && session?.user?.email) {
      setUserId(session.userId);
      setUserEmail(session.user.email);

      // CV ID and CV Number still come from localStorage
      try {
        const savedCVId = localStorage.getItem("currentCVId");
        const savedCVNumber = localStorage.getItem("currentCVNumber");

        if (savedCVId && savedCVNumber) {
          setCurrentCVId(savedCVId);
          setCvNumber(savedCVNumber);
          loadCVData(savedCVId, session.user.email);
        } else {
          const uniqueNumber = generateUniqueCVNumber(session.userId);
          setCvNumber(uniqueNumber);
          localStorage.setItem("currentCVNumber", uniqueNumber);
        }
      } catch (error) {
        console.error("Error initializing CV:", error);
        const uniqueNumber = generateUniqueCVNumber(session.userId);
        setCvNumber(uniqueNumber);
        localStorage.setItem("currentCVNumber", uniqueNumber);
      }
    }
  }, [status, session]);

  // Load CV data using email from session
  const loadCVData = async (cvId, email) => {
    try {
      if (!email) {
        console.log("No user email found - skipping CV load");
        return;
      }

      const response = await fetch(
        `/api/cv/save?cvId=${cvId}&userEmail=${encodeURIComponent(email)}`
      );

      if (response.status === 404) {
        console.log("No existing CV found - this is normal for new CVs");
        return;
      }

      if (!response.ok) {
        console.warn(`Failed to load CV: ${response.status}`);
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
        return;
      }

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

      if (result.cv.templateId) {
        setSelectedTemplate(result.cv.templateId);
      }

      if (result.cv.colorScheme) {
        setThemeColor(result.cv.colorScheme);
      }

      console.log("CV data loaded successfully");
    } catch (error) {
      console.error("Error loading CV data:", error);
    }
  };

  const updateCVData = (section, data) => {
    setCvData((prev) => ({
      ...prev,
      [section]: data,
    }));
  };

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

  const handleOpenAIChat = () => {
    setShowAIChat(true);
  };

  const handleSaveClick = () => {
    setShowVersionDialog(true);
  };

  const handleSaveWithVersion = async (versionInfo) => {
    try {
      setIsSaving(true);
      setShowVersionDialog(false);

      // Use email from session instead of localStorage
      if (!userEmail) {
        toast.error("Authentication required. Please log in.");
        return;
      }

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
        if (result.cv.id && !currentCVId) {
          setCurrentCVId(result.cv.id);
          localStorage.setItem("currentCVId", result.cv.id);
        }

        clearVersionsCache(userEmail);

        const action = currentCVId ? "updated" : "created";
        toast.success(
          `CV ${action} successfully as version: ${versionInfo.versionName}`
        );
      } else {
        throw new Error(result.error || "Failed to save CV");
      }
    } catch (error) {
      console.error("CV Save Error:", error);
      toast.error(error.message || "Failed to save CV");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewCV = () => {
    if (!userId) {
      toast.error("User ID not found. Please log in again.");
      return;
    }

    const uniqueNumber = generateUniqueCVNumber(userId);
    setCurrentCVId(null);
    localStorage.removeItem("currentCVId");
    setCvNumber(uniqueNumber);
    localStorage.setItem("currentCVNumber", uniqueNumber);

    setAiAnalysis(null);
    setAtsScore(null);
    setThemeColor("#1e40af");

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

    setActiveSection("personal");
    toast.success(`New CV #${uniqueNumber} created!`);
  };

  const handleExportPDF = async () => {
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
  };

  const handleLoadVersion = (version) => {
    try {
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
  };

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-cvLightBg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#002147] mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading CV Builder...</p>
        </div>
      </div>
    );
  }

  // Will redirect if unauthenticated
  if (status === "unauthenticated") {
    return null;
  }

  return (
    <CVDataContext.Provider value={{ cvData, updateCVData }}>
      <div className="min-h-screen bg-cvLightBg">
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

        <div className="flex h-[calc(100vh-80px)]">
          <Sidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />

          <div className="flex-1 flex">
            <div
              className={`transition-all duration-300 ${
                isPreviewMode ? "w-1/2" : "flex-1"
              }`}
            >
              <CVBuilder
                activeSection={activeSection}
                onSectionChange={setActiveSection}
              />
            </div>

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

          {showAIChat && (
            <AIAnalysisChatPopup
              onClose={() => setShowAIChat(false)}
              cvData={cvData}
              activeSection={activeSection}
            />
          )}

          {showVersionManager && (
            <VersionManager
              onClose={() => setShowVersionManager(false)}
              cvId={currentCVId}
              onLoadVersion={handleLoadVersion}
              userEmail={userEmail}
            />
          )}

          <SmartTipsPanel
            activeSection={activeSection}
            isVisible={!isPreviewMode}
            cvData={cvData}
            aiAnalysis={aiAnalysis}
            isAnalyzing={isAnalyzing}
            onRequestAnalysis={handleAnalyzeCV}
          />
        </div>

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

export default Index;