// ============================================================
// ApplicationTabsViews.jsx
// Contains render functions for list view and editor view
// Separated for better code organization and maintainability
// ============================================================

import React, { Suspense, lazy } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  Save,
  Calendar,
  BookOpen,
  Plus,
  Sparkles,
  Loader2,
  AlertTriangle,
  Edit3,
  Target,
  Timer,
  CheckCircle,
  CalendarDays,
} from "lucide-react";

// ============================================================
// Lazy loaded components
// ============================================================
const VersionManager = lazy(() =>
  import("@/app/workspace/components/VersionManager.jsx").then((m) => ({
    default: m.VersionManager,
  }))
);
const EssayAnalytics = lazy(() =>
  import("@/app/workspace/components/EssayAnalytics").then((m) => ({
    default: m.EssayAnalytics,
  }))
);

// ============================================================
// Import custom components
// ============================================================
import LockedTabContent from "./LockedTabContent";
import CustomEssayCard from "./CustomEssayCard";
import EssayCard from "./EssayCard";
import Panel from "@/lib/constants/ApplicationTab/Panel";
import PanelLoader from "@/lib/constants/ApplicationTab/PanelLoader";

// ============================================================
// Import editor components
// ============================================================
import { EssayEditor } from "@/app/workspace/components/EssayEditor";
import { AISuggestions } from "@/app/workspace/components/AiSuggestion";

// ============================================================
// RENDER PANELS FUNCTION
// Renders the side panels (versions, analytics, AI)
// ============================================================
export const renderPanels = ({
  currentEssay,
  openPanels,
  isUniversityAdded,
  currentProgram,
  isPanelOpen,
  closePanel,
  handleRestoreVersion,
  
  handleDeleteVersion,
  workspaceLoading,
  currentEssayData,
  selectedEssayInfo,
  customEssays,
  programsWithEssays,
  userId,
  universityName,
  PANEL_CONFIG,
}) => {
  // Guard clause - don't render if no essay or no panels open
  if (!currentEssay || openPanels.length === 0 || !isUniversityAdded) {
    return null;
  }

  // Determine if current essay is custom
  const isCustom =
    currentProgram?.degreeType === "STANDALONE" || currentProgram?.isCustom;

  return (
    <>
      {Object.entries(PANEL_CONFIG).map(([name, config]) => (
        <Panel
          key={name}
          name={name}
          title={config.title}
          icon={config.icon}
          iconColor={config.iconColor}
          isOpen={isPanelOpen(name)}
          onClose={() => closePanel(name)}
        >
          <Suspense fallback={<PanelLoader />}>
            {/* Version Manager Panel */}
            {name === "versions" && (
              <VersionManager
                versions={currentEssay.versions || []}
                currentContent={currentEssay.content || ""}
                onRestoreVersion={handleRestoreVersion}
                onDeleteVersion={handleDeleteVersion}
                essayId={currentEssay.id}
                universityName={universityName}
                isLoading={workspaceLoading}
              />
            )}
            
            {/* Analytics Panel */}
            {name === "analytics" && (
              <EssayAnalytics
                essay={{
                  ...currentEssay,
                  wordLimit:
                    currentEssayData?.wordLimit || selectedEssayInfo.wordLimit,
                  priority: currentEssayData?.priority,
                }}
                allEssays={
                  isCustom
                    ? customEssays
                    : programsWithEssays.flatMap((p) =>
                        p.essays.map((e) => e.userEssay).filter(Boolean)
                      )
                }
                essayId={currentEssay.id}
                userId={userId}
                universityName={universityName}
              />
            )}
            
            {/* AI Suggestions Panel */}
            {name === "ai" && (
              <AISuggestions
                content={currentEssay.content || ""}
                prompt={
                  currentEssayData?.promptText || selectedEssayInfo.promptText
                }
                wordCount={currentEssay.wordCount || 0}
                wordLimit={
                  currentEssayData?.wordLimit || selectedEssayInfo.wordLimit
                }
                essayId={currentEssay.id}
                universityName={universityName}
                currentVersionId={null}
                versions={currentEssay.versions || []}
                isCustomEssay={isCustom}
              />
            )}
          </Suspense>
        </Panel>
      ))}
    </>
  );
};

// ============================================================
// RENDER LIST VIEW FUNCTION
// Renders the essays list and tasks/events tabs
// ============================================================
export const renderListView = ({
  isUniversityAdded,
  universityName,
  university,
  progressData,
  uniqueCustomEssays,
  tasksAndEvents,
  handleAddUniversity,
  isAddingUniversity,
  workspaceLoading,
  setShowCustomEssayModal,
  handleOpenEditor,
  openDeleteConfirmation,
  formatDate,
  getStatusColors,
  getItemIcon,
}) => {
  const router = useRouter();

  return (
    <Tabs defaultValue="essays" className="w-full">
      {/* ============================================================ */}
      {/* TAB LIST */}
      {/* ============================================================ */}
      <TabsList className="grid w-full grid-cols-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100 h-14">
        <TabsTrigger
          value="essays"
          className="data-[state=active]:bg-[#002147] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-300 h-11 font-semibold relative"
        >
          <FileText className="h-5 w-5 mr-2" />
          <span className="hidden sm:inline">Essay Workspace</span>
          <span className="sm:hidden">Essays</span>
        </TabsTrigger>
        <TabsTrigger
          value="deadlines"
          className="data-[state=active]:bg-[#002147] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-300 h-11 font-semibold relative"
        >
          <Clock className="h-5 w-5 mr-2" />
          <span className="hidden sm:inline">Tasks & Events</span>
          <span className="sm:hidden">Tasks</span>
        </TabsTrigger>
      </TabsList>

      {/* ============================================================ */}
      {/* ESSAYS TAB CONTENT */}
      {/* ============================================================ */}
      <TabsContent value="essays" className="mt-8">
        {!isUniversityAdded ? (
          <LockedTabContent
            tabName="Essays"
            universityName={universityName}
            onAddUniversity={handleAddUniversity}
            isAddingUniversity={isAddingUniversity}
          />
        ) : workspaceLoading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            <p className="text-white/60 text-sm">Loading your essays...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header with create button */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  Essay Requirements
                </h3>
                <p className="text-white/80 text-sm mt-1">
                  {progressData.totalEssays} essays •{" "}
                  {progressData.completedEssays} completed
                </p>
              </div>
              <Button
                onClick={() => setShowCustomEssayModal(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Custom Essay
              </Button>
            </div>

            {/* ============================================================ */}
            {/* CUSTOM ESSAYS SECTION */}
            {/* ============================================================ */}
            {uniqueCustomEssays.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  <h4 className="text-lg font-semibold text-white">
                    My Custom Essays
                  </h4>
                  <span className="text-xs text-white/60 bg-purple-500/20 px-2 py-1 rounded-full">
                    {uniqueCustomEssays.length} essay
                    {uniqueCustomEssays.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {uniqueCustomEssays.map((essay, index) => (
                  <CustomEssayCard
                    key={`custom-${essay.id}-${index}`}
                    essay={essay}
                    index={index}
                    onEdit={(essay) => handleOpenEditor(essay, true)}
                    onDelete={(essayId) =>
                      openDeleteConfirmation(essayId, essay.title)
                    }
                  />
                ))}
              </div>
            )}

            {/* ============================================================ */}
            {/* REGULAR ESSAYS SECTION */}
            {/* ============================================================ */}
            <div className="space-y-4">
              {uniqueCustomEssays.length > 0 && (
                <div className="flex items-center space-x-2 mb-2">
                  <BookOpen className="h-5 w-5 text-blue-400" />
                  <h4 className="text-lg font-semibold text-white">
                    University Essay Prompts
                  </h4>
                  <span className="text-xs text-white/60 bg-blue-500/20 px-2 py-1 rounded-full">
                    {university?.allEssayPrompts?.length || 0} essay
                    {(university?.allEssayPrompts?.length || 0) !== 1
                      ? "s"
                      : ""}
                  </span>
                </div>
              )}

              {university?.allEssayPrompts &&
              university.allEssayPrompts.length > 0 ? (
                <div className="space-y-4">
                  {university.allEssayPrompts.map((essay, index) => (
                    <EssayCard
                      key={essay.id || index}
                      essay={essay}
                      index={index}
                      onEdit={handleOpenEditor}
                      isUniversityAdded={isUniversityAdded}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white/5 rounded-xl">
                  <FileText className="h-12 w-12 text-white/40 mx-auto mb-3" />
                  <h4 className="text-lg font-semibold text-white mb-1">
                    No Essay Prompts
                  </h4>
                  <p className="text-white/60 text-sm">
                    Essays will appear when available
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </TabsContent>

      {/* ============================================================ */}
      {/* TASKS & EVENTS TAB CONTENT */}
      {/* ============================================================ */}
      <TabsContent value="deadlines" className="mt-8">
        {!isUniversityAdded ? (
          <LockedTabContent
            tabName="Tasks & Events"
            universityName={universityName}
            onAddUniversity={handleAddUniversity}
            isAddingUniversity={isAddingUniversity}
          />
        ) : (
          <div className="space-y-6">
            {/* Header with calendar button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  Tasks & Events
                </h3>
                <p className="text-white text-sm mt-1">
                  {progressData.completedTasks} of{" "}
                  {progressData.totalTasks} tasks completed
                </p>
              </div>
              <Button
                onClick={() => router.push("/dashboard/calendar")}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/30"
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Manage Calendar
              </Button>
            </div>

            {/* Tasks/Events List */}
            <div className="grid gap-4">
              {tasksAndEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-white mb-2">
                    No Tasks or Events
                  </h4>
                  <p className="text-gray-300 mb-6">
                    Your application tasks and events will appear
                    here.
                  </p>
                </div>
              ) : (
                tasksAndEvents.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="flex items-center justify-between p-6 border-2 border-gray-100 rounded-2xl hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-3 rounded-xl ${
                          item.status === "completed"
                            ? "bg-green-100"
                            : item.type === "event"
                              ? "bg-purple-100"
                              : item.priority === "high"
                                ? "bg-red-100"
                                : item.priority === "medium"
                                  ? "bg-yellow-100"
                                  : "bg-blue-100"
                        }`}
                      >
                        {getItemIcon(item)}
                      </div>

                      <div>
                        <div className="font-bold text-[#002147] text-lg flex items-center space-x-2">
                          <span>{item.task}</span>
                          {item.type === "event" && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              EVENT
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center space-x-4 flex-wrap gap-2">
                          <span>{formatDate(item.date)}</span>
                          {item.time && <span>• {item.time}</span>}
                          {item.daysLeft !== undefined &&
                            item.status !== "completed" && (
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.daysLeft <= 0
                                    ? "bg-red-100 text-red-700"
                                    : item.daysLeft <= 7
                                      ? "bg-orange-100 text-orange-700"
                                      : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                <Timer className="h-3 w-3 mr-1 inline" />
                                {item.daysLeft === 0
                                  ? "Due today"
                                  : item.daysLeft < 0
                                    ? `${Math.abs(item.daysLeft)} days overdue`
                                    : `${item.daysLeft} days left`}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-4 py-2 text-sm rounded-full font-medium ${getStatusColors(item.status, item.priority)}`}
                    >
                      {item.status === "completed" && (
                        <CheckCircle className="h-4 w-4 mr-1 inline" />
                      )}
                      {item.status.replace("-", " ")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

// ============================================================
// RENDER EDITOR VIEW FUNCTION
// Renders the essay editor with sidebar and panels
// ============================================================
export const renderEditorView = ({
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
}) => {
  // ============================================================
  // LOCKED STATE
  // ============================================================
  if (!isUniversityAdded) {
    return (
      <LockedTabContent
        tabName="Essay Editor"
        universityName={universityName}
        onAddUniversity={handleAddUniversity}
        isAddingUniversity={isAddingUniversity}
      />
    );
  }

  // ============================================================
  // SESSION WARNING
  // ============================================================
  if (!userId && sessionStatus === "authenticated") {
    return (
      <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl p-4 flex items-center">
        <AlertTriangle className="w-5 h-5 text-amber-400 mr-3" />
        <div>
          <p className="text-amber-200 font-medium">
            Session issue detected
          </p>
          <p className="text-amber-300/70 text-sm">
            User ID not found. Try refreshing or signing out and
            back in.
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (workspaceLoading && !currentEssayData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
        <span className="ml-3 text-white">
          Loading workspace...
        </span>
      </div>
    );
  }

  // ============================================================
  // ERROR STATE
  // ============================================================
  if (workspaceError) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h4 className="text-lg font-semibold text-white mb-2">
          Error Loading Workspace
        </h4>
        <p className="text-white/60 mb-4">{workspaceError}</p>
        <Button
          onClick={fetchWorkspaceData}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // ============================================================
  // AUTH REQUIRED STATE
  // ============================================================
  if (!userId) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h4 className="text-lg font-semibold text-white mb-2">
          Authentication Required
        </h4>
        <p className="text-white/60 mb-4">
          Please sign in to access the essay editor.
        </p>
      </div>
    );
  }

  // ============================================================
  // MAIN EDITOR VIEW
  // ============================================================
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* ============================================================ */}
      {/* LEFT SIDEBAR - Essay Selector */}
      {/* ============================================================ */}
      <div className="col-span-12 lg:col-span-3">
        <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl">
          <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-white/10">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-bold text-white">
              Programs & Essays
            </h3>
          </div>

          <div className="space-y-2 max-h-[450px] overflow-y-auto custom-scrollbar pr-1">
            {/* ============================================================ */}
            {/* CUSTOM ESSAYS IN SIDEBAR */}
            {/* ============================================================ */}
            {uniqueCustomEssays.length > 0 && (
              <div className="space-y-1 mb-3">
                <div
                  onClick={() => {
                    const standaloneProgram =
                      workspaceData?.programs?.find(
                        (p) =>
                          p.degreeType === "STANDALONE" ||
                          p.isCustom
                      );
                    if (standaloneProgram) {
                      handleProgramSelect(
                        standaloneProgram.id
                      );
                    }
                  }}
                  className={`px-2 py-2 flex items-center space-x-2 cursor-pointer rounded-lg transition-all ${
                    currentProgram?.degreeType ===
                      "STANDALONE" || currentProgram?.isCustom
                      ? "bg-gradient-to-r from-purple-500/30 to-pink-500/20 border-l-4 border-purple-400"
                      : "hover:bg-white/10 border-l-4 border-transparent"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-white">
                    My Custom Essays
                  </span>
                  <span className="text-xs text-white/40 bg-purple-500/20 px-1.5 py-0.5 rounded-full ml-auto">
                    {uniqueCustomEssays.length}
                  </span>
                </div>
                
                {/* Custom essay items */}
                {(currentProgram?.degreeType === "STANDALONE" ||
                  currentProgram?.isCustom) &&
                  workspaceData?.programs
                    ?.find((p) => p.id === activeProgramId)
                    ?.essays?.map((essay) => (
                      <div
                        key={`custom-essay-${essay.promptId}-${essay.programId || ""}`}
                        onClick={() =>
                          handleEssayPromptSelect(
                            essay.promptId,
                            {
                              title: essay.promptTitle,
                              programName: "My Custom Essays",
                              isCustom: true,
                              promptText: essay.promptText,
                              wordLimit: essay.wordLimit,
                            }
                          )
                        }
                        className={`p-2.5 pl-5 ml-3 rounded-lg cursor-pointer transition-all text-xs ${
                          activeEssayPromptId ===
                          essay.promptId
                            ? "bg-gradient-to-r from-purple-500/50 to-pink-500/30 border-l-2 border-pink-400"
                            : "hover:bg-white/10 border-l-2 border-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white/90 truncate flex-1">
                            {essay.promptTitle}
                          </span>
                          {essay.userEssay?.wordCount > 0 && (
                            <span className="text-purple-400 text-[10px] ml-2 font-bold bg-purple-500/20 px-1.5 py-0.5 rounded">
                              {Math.round(
                                (essay.userEssay.wordCount /
                                  essay.wordLimit) *
                                  100
                              )}
                              %
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
              </div>
            )}

            {/* ============================================================ */}
            {/* REGULAR PROGRAMS IN SIDEBAR */}
            {/* ============================================================ */}
            {programsWithEssays.length === 0 &&
            uniqueCustomEssays.length === 0 ? (
              <div className="text-center py-6">
                <FileText className="w-8 h-8 text-white/30 mx-auto mb-2" />
                <p className="text-sm text-white/50">
                  No programs with essays
                </p>
              </div>
            ) : (
              programsWithEssays.map((program) => (
                <div key={program.id} className="space-y-1">
                  <div
                    onClick={() =>
                      handleProgramSelect(program.id)
                    }
                    className={`p-3 rounded-xl cursor-pointer transition-all text-sm ${
                      activeProgramId === program.id &&
                      program.degreeType !== "STANDALONE"
                        ? "bg-gradient-to-r from-blue-500/30 to-cyan-500/20 border-l-4 border-blue-400 shadow-lg"
                        : "hover:bg-white/10 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">
                        {program.programName || program.name}
                      </span>
                      <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/60">
                        {program.essays?.length || 0}
                      </span>
                    </div>
                  </div>

                  {/* Essay items for selected program */}
                  {activeProgramId === program.id &&
                    program.essays?.map((essayData) => {
                      const hasContent =
                        essayData.userEssay?.wordCount > 0;
                      return (
                        <div
                          key={`regular-${essayData.promptId}-${program.id}`}
                          onClick={() =>
                            handleEssayPromptSelect(
                              essayData.promptId,
                              {
                                title: essayData.promptTitle,
                                programName:
                                  program.programName ||
                                  program.name,
                                isCustom: false,
                                promptText:
                                  essayData.promptText,
                                wordLimit:
                                  essayData.wordLimit,
                              }
                            )
                          }
                          className={`p-2.5 pl-5 ml-3 rounded-lg cursor-pointer transition-all text-xs ${
                            activeEssayPromptId ===
                            essayData.promptId
                              ? "bg-gradient-to-r from-blue-500/50 to-cyan-500/30 border-l-2 border-cyan-400"
                              : "hover:bg-white/10 border-l-2 border-white/10"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-white/90 truncate flex-1">
                              {essayData.promptTitle}
                            </span>
                            {hasContent && (
                              <span className="text-emerald-400 text-[10px] ml-2 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded">
                                {Math.round(
                                  (essayData.userEssay
                                    .wordCount /
                                    essayData.wordLimit) *
                                    100
                                )}
                                %
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MAIN EDITOR AREA */}
      {/* ============================================================ */}
      <div className="col-span-12 lg:col-span-9">
        {currentEssayData || selectedEssayInfo.title ? (
          <div className="space-y-5">
            {/* ============================================================ */}
            {/* ESSAY HEADER WITH PANEL TOGGLES */}
            {/* ============================================================ */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {displayTitle}
                </h3>
                <p className="text-sm text-white/60">
                  {displayProgramName}
                  {selectedEssayInfo.isCustom && (
                    <span className="ml-2 inline-flex items-center gap-1 text-purple-400">
                      <Sparkles className="w-3 h-3" /> My
                      Custom Essay
                    </span>
                  )}
                </p>
              </div>

              {/* Panel Toggle Buttons */}
              {currentEssay && (
                <div className="flex items-center gap-2">
                  {Object.entries(PANEL_CONFIG).map(([name, config]) => (
                    <button
                      key={name}
                      onClick={() => togglePanel(name)}
                      className={`text-xs px-4 py-2 rounded-xl transition-all flex items-center font-medium ${
                        isPanelOpen(name)
                          ? `bg-gradient-to-r ${name === "versions" ? "from-blue-500 to-cyan-500" : name === "analytics" ? "from-purple-500 to-pink-500" : "from-amber-500 to-orange-500"} text-white shadow-lg shadow-${name === "versions" ? "blue" : name === "analytics" ? "purple" : "amber"}-500/30`
                          : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/20"
                      }`}
                    >
                      <config.icon className="w-4 h-4 mr-2" />
                      {config.title.split(" ")[0]}
                      {name === "versions" && currentEssay.versions?.length > 0 && (
                        <span className="ml-2 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">
                          {currentEssay.versions.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ============================================================ */}
            {/* PROMPT DISPLAY */}
            {/* ============================================================ */}
            <div
              className={`p-4 rounded-xl border ${
                selectedEssayInfo.isCustom
                  ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/30"
                  : "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-blue-400/30"
              }`}
            >
              <p
                className={`text-xs font-semibold mb-2 uppercase tracking-wider ${
                  selectedEssayInfo.isCustom
                    ? "text-purple-300"
                    : "text-blue-300"
                }`}
              >
                Prompt
              </p>
              <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
                {currentEssayData?.promptText ||
                  selectedEssayInfo.promptText ||
                  "Loading..."}
              </p>
              <p
                className={`text-xs mt-3 flex items-center ${
                  selectedEssayInfo.isCustom
                    ? "text-purple-300/70"
                    : "text-blue-300/70"
                }`}
              >
                <FileText className="w-3 h-3 mr-1" />
                Word limit:{" "}
                {currentEssayData?.wordLimit ||
                  selectedEssayInfo.wordLimit ||
                  500}
              </p>
            </div>

            {/* ============================================================ */}
            {/* STACKED PANELS */}
            {/* ============================================================ */}
            {renderPanels({
              currentEssay,
              openPanels,
              isUniversityAdded,
              currentProgram,
              isPanelOpen,
              closePanel,
              handleRestoreVersion,
              handleDeleteVersion,
              workspaceLoading,
              currentEssayData,
              selectedEssayInfo,
              customEssays,
              programsWithEssays,
              userId,
              universityName,
              PANEL_CONFIG,
            })}

            {/* ============================================================ */}
            {/* EDITOR OR CREATE BUTTON */}
            {/* ============================================================ */}
            {currentEssay ? (
              <>
                <EssayEditor
                  key={editorKey}
                  content={editorContent}
                  onChange={updateEssayContent}
                  wordLimit={
                    currentEssayData?.wordLimit ||
                    selectedEssayInfo.wordLimit ||
                    500
                  }
                  essayId={currentEssay.id}
                  onSave={autoSaveEssay}
                  lastSaved={lastSaved}
                />

                {/* ============================================================ */}
                {/* FOOTER ACTIONS */}
                {/* ============================================================ */}
                <div className="flex justify-between items-center text-xs text-white/50 pt-2">
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Last modified:{" "}
                    {currentEssay.lastModified
                      ? new Date(
                          currentEssay.lastModified
                        ).toLocaleString()
                      : "Never"}
                    <span className="ml-3 text-white/30">
                      • Auto-saves every 20 seconds
                    </span>
                    {hasUnsavedChanges && (
                      <span className="ml-3 text-amber-400 flex items-center">
                        <span className="w-2 h-2 bg-amber-400 rounded-full mr-1 animate-pulse" />
                        Unsaved changes
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {/* Manual Save Hint */}
                    <span className="flex items-center text-white/60 text-xs">
                      <Save className="w-3 h-3 mr-1.5" />
                      Press Ctrl+S to save
                    </span>
                    
                    {/* Save Version Button */}
                    <Button
                      size="sm"
                      onClick={() => saveVersion()}
                      disabled={isSaving || isSavingVersion}
                      className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-400/30"
                    >
                      {isSavingVersion ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3 mr-1.5" />
                          Save Version & Exit
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              // ============================================================
              // CREATE ESSAY PROMPT
              // ============================================================
              <div className="text-center py-16 bg-gradient-to-b from-white/10 to-white/5 rounded-2xl border border-white/20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-blue-400" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">
                  Start Writing
                </h4>
                <p className="text-white/60 mb-6">
                  Create your essay for this prompt
                </p>
                <Button
                  onClick={createEssay}
                  disabled={isCreatingEssay || !userId}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/30 px-8"
                >
                  {isCreatingEssay ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Start Essay
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          // ============================================================
          // NO ESSAY SELECTED STATE
          // ============================================================
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 flex items-center justify-center">
              <Target className="w-8 h-8 text-white/40" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">
              Select an Essay
            </h4>
            <p className="text-white/60">
              Choose a program and essay from the left sidebar
            </p>
          </div>
        )}
      </div>
    </div>
  );
};