"use client";

import React, { memo } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { CVBuilder } from "./CVBuilder";
import { PreviewPanel } from "./PreviewPanel";
import SmartTipsPanel from "./SmartTipsPanel";
import { VersionSaveDialog } from "./VersionSavedDialog";
import AIAnalysisChatPopup from "./AiAnalysisChatPopup";
import { VersionManager } from "./VersionManager";
import { Loader2, ArrowLeft } from "lucide-react";
import { CVDataContext } from "@/lib/constants/CVDataContext";
import useCVBuilder from "@/lib/hooks/useCVBuilder";
import { useRouter } from "next/navigation";

/**
 * LoadingSpinner - Reusable loading component
 * @param {string} message - Loading message to display
 */
const LoadingSpinner = memo(({ message = "Loading CV Builder..." }) => (
  <div className="min-h-screen bg-cvLightBg flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#002147] mx-auto mb-2" />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  </div>
));

LoadingSpinner.displayName = "LoadingSpinner";

/**
 * MainContent - Renders the main builder content area
 * Memoized for performance optimization
 */
const MainContent = memo(({
  activeSection,
  setActiveSection,
  isPreviewMode,
  selectedTemplate,
  setSelectedTemplate,
  cvData,
  themeColor,
  setThemeColor,
}) => (
  <div className="flex-1 flex">
    {/* Builder area with dynamic width based on preview mode */}
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
));

MainContent.displayName = "MainContent";

/**
 * CVBuilderEditor - The actual CV editor component
 * Handles authentication, CV loading, and state management
 */
const CVBuilderEditor = () => {
  const router = useRouter();
  
  // Use custom hook for all state and handlers
  const {
    // Authentication state
    status,
    userEmail,

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
  } = useCVBuilder();

  /**
   * Handle back to dashboard
   */
  const handleBackToDashboard = () => {
    router.push('/cv-builder');
  };

  /**
   * Loading state while checking authentication or initializing CV
   * Shows spinner with appropriate message
   */
  if (status === "loading" || isInitialLoading) {
    return (
      <LoadingSpinner
        message={
          status === "loading" ? "Loading CV Builder..." : "Loading your CV..."
        }
      />
    );
  }

  /**
   * Return null if unauthenticated (will redirect via useEffect in hook)
   */
  if (status === "unauthenticated") {
    return null;
  }

  return (
    /* CV Data Context Provider for sharing data across components */
    <CVDataContext.Provider value={{ cvData, updateCVData }}>
      {/* Main container with background */}
      <div className="min-h-screen bg-cvLightBg mb-10">
        
        {/* Back to Dashboard Button <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#002147] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </div>*/}
        

        {/* Header component with all action buttons */}
        <Header
          onPreviewToggle={handlePreviewToggle}
          isPreviewMode={isPreviewMode}
          onAIToggle={() => {}}
          onVersionToggle={handleVersionToggle}
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
        <div className="flex h-[calc(100vh-140px)]">
          {/* Sidebar navigation for CV sections */}
          <Sidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />

          {/* Main content area */}
          <MainContent
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            isPreviewMode={isPreviewMode}
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
            cvData={cvData}
            themeColor={themeColor}
            setThemeColor={setThemeColor}
          />

          {/* AI Chat Popup (conditionally rendered) */}
          {showAIChat && (
            <AIAnalysisChatPopup
              onClose={handleCloseAIChat}
              cvData={cvData}
              activeSection={activeSection}
            />
          )}

          {/* Version Manager Modal (conditionally rendered) */}
          {showVersionManager && (
            <VersionManager
              onClose={handleCloseVersionManager}
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
            onClose={handleCloseVersionDialog}
            onSave={handleSaveWithVersion}
            currentVersionName=""
          />
        )}
      </div>
    </CVDataContext.Provider>
  );
};

CVBuilderEditor.displayName = "CVBuilderEditor";

export default CVBuilderEditor;