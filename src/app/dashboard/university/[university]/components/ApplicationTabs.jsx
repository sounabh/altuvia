// ============================================================
// ApplicationTabs.jsx
// Main component file - handles rendering and UI
// Imports the custom hook for state and logic management
// ============================================================

"use client";

import React, { Suspense, lazy } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  Save,
  Calendar,
  BookOpen,
  Plus,
  ArrowLeft,
  Sparkles,
  Loader2,
  AlertTriangle,
  Edit3,
  Target,
  Timer,
  CheckCircle,
  Lock,
} from "lucide-react";

// ============================================================
// Lazy loaded components for code splitting
// ============================================================

// ============================================================
// Import custom components
// ============================================================
import CustomEssayModal from "./CustomEssayModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";


// ============================================================
// Import helpers and constants
// ============================================================
import {
  formatDate,
  getStatusColors,
  getItemIcon,
  getStatusInfo,
  getProgressBarColor,
} from "@/lib/constants/ApplicationTab/Helpers";
import { PANEL_CONFIG } from "@/lib/constants/ApplicationTab/Constant";

// ============================================================
// Import existing editor components
// ============================================================

// ============================================================
// Import custom hook containing all state and logic
// ============================================================
import { useApplicationTabs } from "@/lib/hooks/useApplicationTabs";

// ============================================================
// Import render helpers
// ============================================================
import {
  renderListView,
  renderEditorView,
  renderPanels,
} from "./ApplicationTabsView";

// ============================================================
// MAIN COMPONENT
// ============================================================
const ApplicationTabs = ({ university }) => {
  // ========== GET ALL STATE AND HANDLERS FROM CUSTOM HOOK ==========
  const {
    // Session and user data
    sessionStatus,
    userId,
    userEmail,
    universityName,
    
    // University state
    isUniversityAdded,
    isAddingUniversity,
    
    // Modal states
    showCustomEssayModal,
    setShowCustomEssayModal,
    isCreatingCustomEssay,
    deleteModal,
    setDeleteModal,
    isDeletingEssay,
    
    // View state
    activeView,
    setActiveView,
    
    // Workspace data
    workspaceData,
    workspaceLoading,
    workspaceError,
    
    // Selection state
    activeProgramId,
    activeEssayPromptId,
    selectedEssayInfo,
    
    // Panel state
    openPanels,
    togglePanel,
    closePanel,
    isPanelOpen,
    
    // Save state
    lastSaved,
    isSaving,
    hasUnsavedChanges,
    isCreatingEssay,
    isSavingVersion,
    
    // Derived data
    tasksAndEvents,
    programsWithEssays,
    customEssays,
    uniqueCustomEssays,
    currentProgram,
    currentEssayData,
    currentEssay,
    progressData,
    displayTitle,
    displayProgramName,
    
    // Editor props
    editorKey,
    editorContent,
    
    // Handlers
    handleAddUniversity,
    handleCreateCustomEssay,
    handleDeleteCustomEssay,
    openDeleteConfirmation,
    handleProgramSelect,
    handleEssayPromptSelect,
    handleOpenEditor,
    handleBackToList,
    handleRestoreVersion,
    handleDeleteVersion,
    createEssay,
    updateEssayContent,
    autoSaveEssay,
    saveVersion,
    fetchWorkspaceData,
  } = useApplicationTabs(university);

  // ========== GET STATUS INFO FOR PROGRESS DISPLAY ==========
  const statusInfo = getStatusInfo(progressData.applicationStatus);
  const StatusIcon = statusInfo.icon;

  // ========== LOADING STATE ==========
  if (sessionStatus === "loading") {
    return (
      <div className="my-20">
        <Card className="bg-[#002147] shadow-xl border-0 overflow-hidden">
          <CardContent className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-white mr-3" />
            <span className="text-white">Loading...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========== MAIN RENDER ==========
  return (
    <div className="my-20">
      {/* ============================================================ */}
      {/* GLOBAL STYLES */}
      {/* ============================================================ */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Fix for select dropdown visibility */
        select {
          color: white !important;
          background-color: #002147 !important;
        }
        select option {
          background-color: #002147 !important;
          color: white !important;
        }
        select:focus option {
          background-color: #003366 !important;
        }
        select::-ms-expand {
          display: none;
        }
      `}</style>

      {/* ============================================================ */}
      {/* DEBUG PANEL - Development Only */}
      {/* ============================================================ */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-xs text-white p-2 rounded-lg z-50 opacity-50 hover:opacity-100 transition-opacity">
          <div>Session: {sessionStatus}</div>
          <div>User ID: {userId ? "✓" : "✗"}</div>
          <div>User Email: {userEmail ? "✓" : "✗"}</div>
          <div>University Added: {isUniversityAdded ? "✓" : "✗"}</div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MAIN CARD CONTAINER */}
      {/* ============================================================ */}
      <Card className="bg-[#002147] shadow-xl hover:shadow-2xl transition-all duration-500 border-0 overflow-hidden">
        <CardContent className="p-0">
          {/* ============================================================ */}
          {/* HEADER SECTION */}
          {/* ============================================================ */}
          <div className="bg-gradient-to-r from-[#002147] to-[#003366] p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-3">
                  {activeView === "editor" && (
                    <button
                      onClick={handleBackToList}
                      className="mr-3 p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full mr-4"></div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    {activeView === "editor"
                      ? "Essay Editor"
                      : "Application Workspace"}
                  </h2>
                  {!isUniversityAdded && (
                    <Lock className="w-5 h-5 ml-3 text-white/60" />
                  )}
                </div>
                <p className="text-white/80 text-sm font-medium">
                  {activeView === "editor"
                    ? `Editing: ${displayTitle}`
                    : `Your personalized application center for ${universityName || "this university"}`}
                </p>
              </div>

              {/* ============================================================ */}
              {/* PROGRESS INDICATOR CIRCLE */}
              {/* ============================================================ */}
              {isUniversityAdded && (
                <div className="hidden md:flex items-center space-x-4">
                  <div className="text-right text-sm">
                    <div className="text-white font-semibold">
                      Application Progress
                    </div>
                    <div className="text-white/70">
                      {progressData.overallProgress}% Complete
                    </div>
                  </div>
                  <div className="w-16 h-16 relative">
                    <svg
                      className="w-16 h-16 transform -rotate-90"
                      viewBox="0 0 36 36"
                    >
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="url(#progressGradient)"
                        strokeWidth="3"
                        strokeDasharray={`${progressData.overallProgress}, 100`}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient
                          id="progressGradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop offset="0%" stopColor="#60A5FA" />
                          <stop offset="100%" stopColor="#34D399" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {progressData.overallProgress}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ============================================================ */}
            {/* PROGRESS INFO CARD */}
            {/* ============================================================ */}
            {isUniversityAdded && (
              <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <StatusIcon className="h-4 w-4 text-white" />
                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/20 text-white">
                      {statusInfo.text}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-white">
                    {progressData.overallProgress}%
                  </span>
                </div>

                <div className="w-full h-2.5 bg-white/20 rounded-full mb-3 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${getProgressBarColor(progressData.applicationStatus)}`}
                    style={{ width: `${progressData.overallProgress}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="text-center text-white p-2 bg-white/5 rounded-lg">
                    <div className="font-semibold">Essays</div>
                    <div className="text-white/70 text-lg font-bold">
                      {progressData.completedEssays}/{progressData.totalEssays}
                    </div>
                  </div>
                  <div className="text-center text-white p-2 bg-white/5 rounded-lg">
                    <div className="font-semibold">Tasks</div>
                    <div className="text-white/70 text-lg font-bold">
                      {progressData.completedTasks}/{progressData.totalTasks}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* MAIN CONTENT AREA */}
          {/* ============================================================ */}
          <div className="p-6 space-y-8">
            {activeView === "list"
              ? renderListView({
                  // Props for list view
                  isUniversityAdded,
                  universityName,
                  university,
                  progressData,
                  uniqueCustomEssays,
                  tasksAndEvents,
                  handleAddUniversity,
                  isAddingUniversity,
                  setShowCustomEssayModal,
                  handleOpenEditor,
                  openDeleteConfirmation,
                  formatDate,
                   workspaceLoading,  
                  getStatusColors,
                  getItemIcon,
                  router: null, // Will be handled inside
                })
              : renderEditorView({
                  // Props for editor view
                  isUniversityAdded,
                  universityName,
                  handleAddUniversity,
                  isAddingUniversity,
                  userId,
                  sessionStatus,
                  workspaceLoading,
                  workspaceError,
                  workspaceData,
                  currentEssayData,
                  currentEssay,
                  currentProgram,
                  selectedEssayInfo,
                  displayTitle,
                  displayProgramName,
                  activeProgramId,
                  activeEssayPromptId,
                  uniqueCustomEssays,
                  programsWithEssays,
                  customEssays,
                  openPanels,
                  togglePanel,
                  closePanel,
                  isPanelOpen,
                  handleProgramSelect,
                  handleEssayPromptSelect,
                  handleRestoreVersion,
                  handleDeleteVersion,
                  createEssay,
                  updateEssayContent,
                  autoSaveEssay,
                  saveVersion,
                  fetchWorkspaceData,
                  editorKey,
                  editorContent,
                  lastSaved,
                  isSaving,
                  hasUnsavedChanges,
                  isCreatingEssay,
                  isSavingVersion,
                  PANEL_CONFIG,
                })}
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}
      <CustomEssayModal
        isOpen={showCustomEssayModal}
        onClose={() => setShowCustomEssayModal(false)}
        onCreateEssay={handleCreateCustomEssay}
        universityName={universityName}
        isCreating={isCreatingCustomEssay}
        isUniversityAdded={isUniversityAdded}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, essayId: null, essayTitle: "" })
        }
        onConfirm={() => handleDeleteCustomEssay(deleteModal.essayId)}
        essayTitle={deleteModal.essayTitle}
        isLoading={isDeletingEssay}
      />
    </div>
  );
};

export default ApplicationTabs;