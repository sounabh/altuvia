"use client";

import React, { useState, createContext, useContext, useEffect } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { CVBuilder } from "./components/CVBuilder";
import { PreviewPanel } from "./components/PreviewPanel";
import { AIAssistant } from "./components/AIssitant";
import { SmartTipsPanel } from "./components/SmartTipsPanel";
import { VersionManager } from "./components/VersionManager";
import { VersionSaveDialog } from "./components/VersionSavedDialog";
import { toast } from "sonner";

// Context for CV Data
export const CVDataContext = createContext();

export const useCVData = () => {
  const context = useContext(CVDataContext);
  if (!context) throw new Error("useCVData must be used within CVDataProvider");
  return context;
};

// Utility function to generate unique CV number
const generateUniqueCVNumber = (userId) => {
  const userIdPart = userId.slice(-6);
  const randomPart = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  const timestamp = Date.now().toString().slice(-4);
  return `${userIdPart}${timestamp}${randomPart}`;
};

const Index = () => {
  const [cvNumber, setCvNumber] = useState("");
  const [currentCVId, setCurrentCVId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  
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
    projects: [
      {
        id: "1",
        name: "",
        description: "",
        technologies: "",
        startDate: "",
        endDate: "",
        githubUrl: "",
        liveUrl: "",
        achievements: "",
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
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showVersionManager, setShowVersionManager] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const authData = getAuthData();
      if (authData?.userId) {
        setUserId(authData.userId);
        setUserEmail(authData.email);
        
        const savedCVId = localStorage.getItem("currentCVId");
        const savedCVNumber = localStorage.getItem("currentCVNumber");
        
        if (savedCVId && savedCVNumber) {
          setCurrentCVId(savedCVId);
          setCvNumber(savedCVNumber);
          loadCVData(savedCVId);
        } else {
          const uniqueNumber = generateUniqueCVNumber(authData.userId);
          setCvNumber(uniqueNumber);
          localStorage.setItem("currentCVNumber", uniqueNumber);
        }
      }
    } catch (error) {
      console.error("Error initializing:", error);
    }
  }, []);

  const getAuthData = () => {
    try {
      const authData = localStorage.getItem("authData");
      if (authData) return JSON.parse(authData);
      
      const sessionAuth = sessionStorage.getItem("authData");
      if (sessionAuth) return JSON.parse(sessionAuth);
      
      return null;
    } catch (error) {
      console.error("Error parsing auth data:", error);
      return null;
    }
  };

  const getAuthEmail = () => {
    const authData = getAuthData();
    return authData?.email || null;
  };

  const loadCVData = async (cvId) => {
    try {
      const userEmail = getAuthEmail();
      if (!userEmail) return;

      const response = await fetch(`/api/cv/save?cvId=${cvId}&userEmail=${userEmail}`);
      const result = await response.json();

      if (result.success && result.cv) {
        setCvData({
          personal: result.cv.personalInfo || cvData.personal,
          education: result.cv.educations?.map(edu => ({
            id: edu.id,
            institution: edu.institution,
            degree: edu.degree,
            field: edu.fieldOfStudy,
            startDate: edu.startDate,
            endDate: edu.endDate,
            gpa: edu.gpa,
            description: edu.description,
          })) || cvData.education,
          experience: result.cv.experiences?.map(exp => ({
            id: exp.id,
            company: exp.company,
            position: exp.position,
            location: exp.location,
            startDate: exp.startDate,
            endDate: exp.endDate,
            isCurrentRole: exp.isCurrent,
            description: exp.description,
          })) || cvData.experience,
          projects: result.cv.projects?.map(proj => ({
            id: proj.id,
            name: proj.name,
            description: proj.description,
            technologies: proj.technologies?.join(", "),
            startDate: proj.startDate,
            endDate: proj.endDate,
            githubUrl: proj.githubUrl,
            liveUrl: proj.liveUrl,
            achievements: proj.achievements?.join(", "),
          })) || cvData.projects,
          skills: result.cv.skills?.map(skill => ({
            id: skill.id,
            name: skill.categoryName,
            skills: skill.skills,
          })) || cvData.skills,
          achievements: result.cv.achievements?.map(ach => ({
            id: ach.id,
            title: ach.title,
            organization: ach.organization,
            date: ach.date,
            type: ach.type,
            description: ach.description,
          })) || cvData.achievements,
          volunteer: result.cv.volunteers?.map(vol => ({
            id: vol.id,
            organization: vol.organization,
            role: vol.role,
            location: vol.location,
            startDate: vol.startDate,
            endDate: vol.endDate,
            description: vol.description,
            impact: vol.impact,
          })) || cvData.volunteer,
        });

        if (result.cv.templateId) {
          setSelectedTemplate(result.cv.templateId);
        }
      }
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

  const handleSaveClick = () => {
    setShowVersionDialog(true);
  };

  const handleSaveWithVersion = async (versionInfo) => {
    try {
      setIsSaving(true);
      setShowVersionDialog(false);

      const userEmail = getAuthEmail();
      if (!userEmail) {
        toast.error("Authentication required. Please log in.");
        return;
      }

      const payload = {
        cvData,
        selectedTemplate,
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
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        if (result.cv.id && !currentCVId) {
          setCurrentCVId(result.cv.id);
          localStorage.setItem("currentCVId", result.cv.id);
        }

        const action = currentCVId ? "updated" : "created";
        toast.success(`CV ${action} successfully as version: ${versionInfo.versionName}`);
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
      education: [{
        id: Date.now().toString(),
        institution: "",
        degree: "",
        field: "",
        startDate: "",
        endDate: "",
        gpa: "",
        description: "",
      }],
      experience: [{
        id: Date.now().toString(),
        company: "",
        position: "",
        location: "",
        startDate: "",
        endDate: "",
        isCurrentRole: false,
        description: "",
      }],
      projects: [{
        id: Date.now().toString(),
        name: "",
        description: "",
        technologies: "",
        startDate: "",
        endDate: "",
        githubUrl: "",
        liveUrl: "",
        achievements: "",
      }],
      skills: [{
        id: Date.now().toString(),
        name: "Programming Languages",
        skills: [],
      }],
      achievements: [{
        id: Date.now().toString(),
        title: "",
        organization: "",
        date: "",
        type: "",
        description: "",
      }],
      volunteer: [{
        id: Date.now().toString(),
        organization: "",
        role: "",
        location: "",
        startDate: "",
        endDate: "",
        description: "",
        impact: "",
      }],
    });

    setActiveSection("personal");
    toast.success(`New CV #${uniqueNumber} created!`);
  };

  const handleExportPDF = async () => {
    if (!currentCVId) {
      toast.error("Please save your CV first before exporting");
      return;
    }

    try {
      toast.info("Generating PDF...");
      const response = await fetch(`/api/cv/export-pdf?cvId=${currentCVId}`);
      
      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
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
        personal: version.personalInfoSnapshot ? JSON.parse(version.personalInfoSnapshot) : cvData.personal,
        education: version.educationSnapshot ? JSON.parse(version.educationSnapshot) : cvData.education,
        experience: version.experienceSnapshot ? JSON.parse(version.experienceSnapshot) : cvData.experience,
        projects: version.projectsSnapshot ? JSON.parse(version.projectsSnapshot) : cvData.projects,
        skills: version.skillsSnapshot ? JSON.parse(version.skillsSnapshot) : cvData.skills,
        achievements: version.achievementsSnapshot ? JSON.parse(version.achievementsSnapshot) : cvData.achievements,
        volunteer: version.volunteerSnapshot ? JSON.parse(version.volunteerSnapshot) : cvData.volunteer,
      };

      setCvData(newCvData);
      
      if (version.templateId) {
        setSelectedTemplate(version.templateId);
      }

      // If loading a version from a different CV, switch to that CV
      if (version.cvId !== currentCVId) {
        setCurrentCVId(version.cvId);
        setCvNumber(version.cvSlug);
        localStorage.setItem("currentCVId", version.cvId);
        localStorage.setItem("currentCVNumber", version.cvSlug);
        toast.success(`Switched to CV #${version.cvSlug} and loaded version: ${version.versionLabel}`);
      } else {
        toast.success(`Loaded version: ${version.versionLabel}`);
      }

      setShowVersionManager(false);
    } catch (error) {
      console.error("Failed to load version:", error);
      toast.error("Failed to load version");
    }
  };

  return (
    <CVDataContext.Provider value={{ cvData, updateCVData }}>
      <div className="min-h-screen bg-cvLightBg">
        <Header
          onPreviewToggle={() => setIsPreviewMode(!isPreviewMode)}
          isPreviewMode={isPreviewMode}
          onAIToggle={() => setShowAIAssistant(!showAIAssistant)}
          onVersionToggle={() => setShowVersionManager(!showVersionManager)}
          onSave={handleSaveClick}
          onNewCV={handleNewCV}
          onExportPDF={handleExportPDF}
          cvNumber={cvNumber}
          cvData={cvData}
          selectedTemplate={selectedTemplate}
          isSaving={isSaving}
        />

        <div className="flex h-[calc(100vh-80px)]">
          <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

          <div className="flex-1 flex">
            <div className={`transition-all duration-300 ${isPreviewMode ? "w-1/2" : "flex-1"}`}>
              <CVBuilder activeSection={activeSection} onSectionChange={setActiveSection} />
            </div>

            {isPreviewMode && (
              <div className="w-1/2 border-l border-cvBorder">
                <PreviewPanel selectedTemplate={selectedTemplate} onTemplateChange={setSelectedTemplate} />
              </div>
            )}
          </div>

          {showAIAssistant && <AIAssistant onClose={() => setShowAIAssistant(false)} />}
          {showVersionManager && (
            <VersionManager 
              onClose={() => setShowVersionManager(false)}
              cvId={currentCVId}
              onLoadVersion={handleLoadVersion}
              userEmail={userEmail}
            />
          )}

          <SmartTipsPanel activeSection={activeSection} isVisible={!isPreviewMode} />
        </div>

        <VersionSaveDialog
          isOpen={showVersionDialog}
          onClose={() => setShowVersionDialog(false)}
          onSave={handleSaveWithVersion}
          currentVersionName=""
        />
      </div>
    </CVDataContext.Provider>
  );
};

export default Index;