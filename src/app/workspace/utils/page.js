"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Target,
  Sparkles,
  TrendingUp,
  Loader2,
  AlertCircle,
  X,
  GraduationCap,
  Building2,
  Filter,
  FileText,
} from "lucide-react";

// Import components
import { UniversitySelector } from "../components/UniversitySelector";
import { ProgramCard } from "../components/ProgramCard";
import { StatsSummary } from "../components/StatsSummary";
import { EssayWorkspace } from "../components/EssayWorkspace";
import { RightSidebarPanels } from "../components/RightSidebarPanels";
import { LoadingAndErrorStates } from "../components/LoadingAndErrorStates";
import { IndependentWorkspaceHeader } from "../components/IndependentWorkspaceHeader";

// Import hooks
import { useWorkspaceData } from "../hooks/useWorkspaceData";
import { useAutoSave } from "../hooks/useAutoSave";
import { useActivityTracking } from "../hooks/useActivityTracking";

// Import utils
import { calculateStats } from "../utils/calculateStats";
import { filterPrograms } from "../utils/workspaceFilters";
import { updateEssayContent, saveVersion, handleCreateEssay, handleDeleteEssay, toggleEssayCompletion } from "../utils/essayHelpers";

export default function IndependentWorkspacePage() {
  const {
    workspaceData,
    setWorkspaceData,
    loading,
    error,
    setError,
    fetchWorkspaceData,
    session,
    status
  } = useWorkspaceData();

  const router = useRouter();

  // Active selections
  const [selectedUniversityId, setSelectedUniversityId] = useState("all");
  const [activeProgramId, setActiveProgramId] = useState(null);
  const [activeEssayPromptId, setActiveEssayPromptId] = useState(null);
  const [expandedPrograms, setExpandedPrograms] = useState(new Set());

  // UI state
  const [showVersions, setShowVersions] = useState(false);
  const [showAI, setShowAI] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [panelOrder, setPanelOrder] = useState(['versions', 'analytics', 'ai']);

  // Essay creation state
  const [isCreatingEssay, setIsCreatingEssay] = useState(false);
  const [isSavingVersion, setIsSavingVersion] = useState(false);

  // Activity tracking
  const { lastUserActivity, isUserActive } = useActivityTracking();

  // Calculate stats
  const enhancedStats = useMemo(() => {
    if (!workspaceData) return null;
    const freshStats = calculateStats(workspaceData);
    return {
      ...freshStats,
      savedUniversitiesCount: workspaceData.universities?.length || 0,
    };
  }, [workspaceData]);

  // Filter programs
  const filteredPrograms = useMemo(() => {
    return filterPrograms(workspaceData, selectedUniversityId, filterStatus);
  }, [workspaceData, selectedUniversityId, filterStatus]);

  // Current program and essay
  const currentProgram = useMemo(() => {
    return workspaceData?.programs?.find((p) => p.id === activeProgramId);
  }, [workspaceData, activeProgramId]);

  const currentEssayData = useMemo(() => {
    return currentProgram?.essays?.find(
      (e) => e.promptId === activeEssayPromptId
    );
  }, [currentProgram, activeEssayPromptId]);

  const currentEssay = useMemo(() => {
    return currentEssayData?.userEssay;
  }, [currentEssayData]);

  // Auto-save setup
  const {
    isSaving,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    lastSaved,
    setLastSaved,
    autoSaveEssay,
    cleanup
  } = useAutoSave(currentEssay, useCallback(async () => {
    // Auto-save implementation
    if (!currentEssay || isSaving || !hasUnsavedChanges) return false;
    
    const response = await fetch(`/api/essay/independent`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        essayId: currentEssay.id,
        content: currentEssay.content,
        wordCount: currentEssay.wordCount,
        isAutoSave: true,
      }),
    });

    return response.ok;
  }, [currentEssay, isSaving, hasUnsavedChanges]));

  // Fetch data on mount
  useEffect(() => {
    const initData = async () => {
      const data = await fetchWorkspaceData();
      if (data && data.programs && data.programs.length > 0) {
        const firstProgram = data.programs[0];
        setExpandedPrograms(new Set([firstProgram.id]));
        setActiveProgramId(firstProgram.id);

        if (firstProgram.essays && firstProgram.essays.length > 0) {
          setActiveEssayPromptId(firstProgram.essays[0].promptId);
        }
      }
    };
    initData();
  }, [fetchWorkspaceData]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Handle panel toggle
  const handlePanelToggle = useCallback((panelName, currentState) => {
    if (!currentState) {
      setPanelOrder(prev => [panelName, ...prev.filter(p => p !== panelName)]);
    }
  }, []);

  // Handle essay selection
  const handleEssaySelect = useCallback((programId, promptId) => {
    setActiveProgramId(programId);
    setActiveEssayPromptId(promptId);
    setHasUnsavedChanges(false);
    setLastSaved(null);
    setError(null);
    setExpandedPrograms((prev) => new Set([...prev, programId]));
  }, [setHasUnsavedChanges, setLastSaved, setError]);

  // Toggle program expansion
  const toggleProgramExpansion = useCallback((programId) => {
    setExpandedPrograms((prev) => {
      const next = new Set(prev);
      if (next.has(programId)) {
        next.delete(programId);
      } else {
        next.add(programId);
      }
      return next;
    });
  }, []);

  // Loading and error states
  if (loading || status === "loading") {
    return <LoadingAndErrorStates type="loading" />;
  }

  if (error && !workspaceData) {
    return <LoadingAndErrorStates type="error" error={error} router={router} />;
  }

  if (workspaceData && (!workspaceData.universities || workspaceData.universities.length === 0)) {
    return <LoadingAndErrorStates type="no-universities" router={router} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <IndependentWorkspaceHeader
        currentUniversity={currentProgram?.university}
        selectedUniversityId={selectedUniversityId}
        workspaceData={workspaceData}
        enhancedStats={enhancedStats}
        currentEssay={currentEssay}
        currentEssayData={currentEssayData}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        showAnalytics={showAnalytics}
        showAI={showAI}
        onUniversitySelect={setSelectedUniversityId}
        onPanelToggle={handlePanelToggle}
        onToggleAnalytics={() => {
          handlePanelToggle('analytics', showAnalytics);
          setShowAnalytics(!showAnalytics);
        }}
        onToggleAI={() => {
          handlePanelToggle('ai', showAI);
          setShowAI(!showAI);
        }}
      />

      {/* Stats Summary */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-4">
        <StatsSummary
          stats={enhancedStats}
          selectedUniversityId={selectedUniversityId}
          universities={workspaceData?.universities}
        />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 pb-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-100 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Programs & Essays List */}
          <div className="col-span-12 lg:col-span-3">
            <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm sticky top-28 hover:shadow-2xl transition-shadow">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#002147]">Programs & Essays</h3>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="text-xs px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <option value="all">All</option>
                    <option value="completed">Completed</option>
                    <option value="in-progress">In Progress</option>
                    <option value="not-started">Not Started</option>
                  </select>
                </div>

                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
                  {filteredPrograms.map((program) => (
                    <ProgramCard
                      key={program.id}
                      program={program}
                      isExpanded={expandedPrograms.has(program.id)}
                      onToggle={() => toggleProgramExpansion(program.id)}
                      activeEssayPromptId={activeEssayPromptId}
                      onEssaySelect={handleEssaySelect}
                      onDeleteEssay={(essayId) => handleDeleteEssay(essayId, setWorkspaceData, setError, activeEssayPromptId, setActiveEssayPromptId)}
                      onToggleCompletion={(essayId, currentStatus) => toggleEssayCompletion(essayId, currentStatus, setWorkspaceData, setError)}
                    />
                  ))}

                  {filteredPrograms.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        {filterStatus !== "all"
                          ? `No ${filterStatus.replace("-", " ")} essays`
                          : "No programs available"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Main Editor Area */}
          <div className="col-span-12 lg:col-span-6">
            <Card className="min-h-[600px] shadow-xl border-0 bg-white/70 backdrop-blur-sm hover:shadow-2xl transition-shadow">
              <div className="p-6">
                <EssayWorkspace
                  currentEssayData={currentEssayData}
                  currentEssay={currentEssay}
                  currentProgram={currentProgram}
                  updateEssayContent={(content, wordCount) => updateEssayContent(content, wordCount, currentEssay, activeProgramId, activeEssayPromptId, setWorkspaceData, setHasUnsavedChanges)}
                  onSaveVersion={() => saveVersion(currentEssay, isSaving, isSavingVersion, hasUnsavedChanges, autoSaveEssay, setWorkspaceData, setError, activeProgramId, activeEssayPromptId, setIsSavingVersion)}
                  isSaving={isSaving}
                  isSavingVersion={isSavingVersion}
                  lastSaved={lastSaved}
                  hasUnsavedChanges={hasUnsavedChanges}
                  onCreateEssay={(programId, promptId) => handleCreateEssay(programId, promptId, setIsCreatingEssay, setError, setWorkspaceData, handleEssaySelect, setHasUnsavedChanges, setLastSaved)}
                  isCreatingEssay={isCreatingEssay}
                />
              </div>
            </Card>
          </div>

          {/* Right Sidebar - Panels */}
          <RightSidebarPanels
            panelOrder={panelOrder}
            showVersions={showVersions}
            showAnalytics={showAnalytics}
            showAI={showAI}
            currentEssay={currentEssay}
            currentProgram={currentProgram}
            activeProgramId={activeProgramId}
            activeEssayPromptId={activeEssayPromptId}
            loading={loading}
            session={session}
            setWorkspaceData={setWorkspaceData}
            setError={setError}
            setHasUnsavedChanges={setHasUnsavedChanges}
            setLastSaved={setLastSaved}
            setShowVersions={setShowVersions}
            handlePanelToggle={handlePanelToggle}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200/50">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>{workspaceData?.universities?.length || 0} saved universities</span>
              <span>•</span>
              <span>Auto-save enabled (4 min inactivity)</span>
            </div>
            <div className="flex items-center space-x-4">
              {session?.user?.email && (
                <>
                  <span>{session.user.email}</span>
                  <span>•</span>
                </>
              )}
              <span>Last sync: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}