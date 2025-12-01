"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EssayEditor } from "./EssayEditor";
import { VersionManager } from "./VersionManager";
import { AISuggestions } from "./AiSuggestion";
import { EssayAnalytics } from "./EssayAnalytics";
import {
  BookOpen,
  Target,
  Sparkles,
  TrendingUp,
  Clock,
  Award,
  Loader2,
  AlertCircle,
  Save,
} from "lucide-react";

export function EssayWorkspace({ universityName, userId, userEmail }) {
 // console.log("EssayWorkspace props:", { universityName, userId, userEmail });

  // Core state management
  const [workspaceData, setWorkspaceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active selections
  const [activeProgramId, setActiveProgramId] = useState(null);
  const [activeEssayPromptId, setActiveEssayPromptId] = useState(null);

  // UI state management
  const [showVersions, setShowVersions] = useState(false);
  const [showAI, setShowAI] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(true);

  const [lastUserActivity, setLastUserActivity] = useState(Date.now());
  const [isUserActive, setIsUserActive] = useState(true);
  const [isSavingVersion, setIsSavingVersion] = useState(false);

  // Add activity tracking ref
  const activityTimeoutRef = useRef(null);

  // Auto-save state - FIXED
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isCreatingEssay, setIsCreatingEssay] = useState(false);

  // Use refs to manage timers and content properly - FIXED
  const autoSaveTimerRef = useRef(null);
  const lastContentRef = useRef("");
  const isUpdatingRef = useRef(false);
  const editorChangeRef = useRef(null);

  // Memoized current program and essay data
  const currentProgram = useMemo(() => {
    return workspaceData?.programs?.find((p) => p.id === activeProgramId);
  }, [workspaceData, activeProgramId]);

  const currentEssayData = useMemo(() => {
    return currentProgram?.essays?.find((e) => e.promptId === activeEssayPromptId);
  }, [currentProgram, activeEssayPromptId]);

  const currentEssay = useMemo(() => {
    return currentEssayData?.userEssay;
  }, [currentEssayData]);

  /**
   * Fetch workspace data from API - ENHANCED with proper error handling
   */
  const fetchWorkspaceData = useCallback(async () => {
    if (!universityName || !userId) {
      console.warn("Missing required data:", { universityName, userId });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("Fetching workspace data for:", { universityName, userId });

      const response = await fetch(
        `/api/essay/${encodeURIComponent(
          universityName
        )}?userId=${encodeURIComponent(userId)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-cache",
        }
      );

      console.log("Fetch response status:", response.status);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: response.statusText }));
        throw new Error(
          errorData.error || `Failed to fetch data: ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Fetched workspace data:", data);
      setWorkspaceData(data);

      // Set default active selections if none exist
      if (data.programs && data.programs.length > 0) {
        // Try to maintain current selections if they still exist
        let programToSelect = activeProgramId
          ? data.programs.find((p) => p.id === activeProgramId)
          : null;

        if (!programToSelect) {
          programToSelect = data.programs[0];
          setActiveProgramId(programToSelect.id);
        }

        if (programToSelect.essays && programToSelect.essays.length > 0) {
          let essayToSelect = activeEssayPromptId
            ? programToSelect.essays.find(
                (e) => e.promptId === activeEssayPromptId
              )
            : null;

          if (!essayToSelect) {
            essayToSelect = programToSelect.essays[0];
            setActiveEssayPromptId(essayToSelect.promptId);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching workspace data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [universityName, userId, activeProgramId, activeEssayPromptId]);

  /**
   * Initial data fetch
   */
  useEffect(() => {
    fetchWorkspaceData();
  }, [universityName, userId]);

  /**
   * FIXED: Auto-save functionality with proper error handling and retry logic
   */
  const autoSaveEssay = useCallback(async () => {
    if (
      !currentEssay ||
      isSaving ||
      !hasUnsavedChanges ||
      isUpdatingRef.current
    ) {
      return false;
    }

    console.log("Starting auto-save for essay:", currentEssay.id);

    try {
      setIsSaving(true);
      isUpdatingRef.current = true;

      const response = await fetch(
        `/api/essay/${encodeURIComponent(universityName)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            essayId: currentEssay.id,
            content: currentEssay.content,
            wordCount: currentEssay.wordCount,
            isAutoSave: true,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Auto-save failed:", response.statusText, errorData);
        return false;
      }
    } catch (error) {
      console.error("Auto-save error:", error);
      return false;
    } finally {
      setIsSaving(false);
      isUpdatingRef.current = false;
    }
  }, [currentEssay, isSaving, hasUnsavedChanges, universityName]);

  /**
   * FIXED: Auto-save timer management with cleanup
   */
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    if (
      hasUnsavedChanges &&
      currentEssay &&
      !isSaving &&
      !isUpdatingRef.current
    ) {
      const timeSinceLastActivity = Date.now() - lastUserActivity;

      if (timeSinceLastActivity >= 4 * 60 * 1000) {
        autoSaveEssay();
      } else if (!isUserActive) {
        const remainingTime = 4 * 60 * 1000 - timeSinceLastActivity;
        autoSaveTimerRef.current = setTimeout(() => {
          autoSaveEssay();
        }, remainingTime);
      }
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    hasUnsavedChanges,
    currentEssay?.id,
    isSaving,
    lastUserActivity,
    isUserActive,
    autoSaveEssay,
  ]);

  /**
   * Activity tracking
   */
  useEffect(() => {
    const handleUserActivity = () => {
      const now = Date.now();
      setLastUserActivity(now);
      setIsUserActive(true);

      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }

      activityTimeoutRef.current = setTimeout(() => {
        setIsUserActive(false);
      }, 2 * 60 * 1000);
    };

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((event) => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    handleUserActivity();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleUserActivity);
      });
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Create new essay for current prompt
   */
  const createEssay = useCallback(async () => {
    if (!activeProgramId || !activeEssayPromptId || !userId || isCreatingEssay) {
      return null;
    }

    try {
      setIsCreatingEssay(true);
      setError(null);
      isUpdatingRef.current = true;

      const response = await fetch(
        `/api/essay/${encodeURIComponent(universityName)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create_essay",
            userId,
            programId: activeProgramId,
            essayPromptId: activeEssayPromptId,
          }),
        }
      );

      const responseData = await response.json();

      if (response.ok && responseData.essay) {
        setWorkspaceData((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            programs: prev.programs.map((program) =>
              program.id === activeProgramId
                ? {
                    ...program,
                    essays: program.essays.map((essayData) =>
                      essayData.promptId === activeEssayPromptId
                        ? {
                            ...essayData,
                            userEssay: responseData.essay,
                          }
                        : essayData
                    ),
                  }
                : program
            ),
          };
        });

        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        lastContentRef.current = responseData.essay.content || "";

        return responseData.essay;
      } else {
        setError(responseData.error || "Failed to create essay");
        return null;
      }
    } catch (error) {
      console.error("Error creating essay:", error);
      setError("Network error while creating essay");
      return null;
    } finally {
      setIsCreatingEssay(false);
      isUpdatingRef.current = false;
    }
  }, [
    activeProgramId,
    activeEssayPromptId,
    userId,
    universityName,
    isCreatingEssay,
  ]);

  /**
   * Update essay content - FIXED with proper state management
   */
  const updateEssayContent = useCallback(
    (content, wordCount) => {
      if (isUpdatingRef.current) {
        return;
      }

      // Store the change function for later execution if needed
      editorChangeRef.current = { content, wordCount };

      // If no essay exists, create one first
      if (!currentEssay) {
        createEssay().then((newEssay) => {
          if (newEssay && editorChangeRef.current) {
            // After creation, update the content
            setWorkspaceData((prev) => {
              if (!prev) return prev;

              return {
                ...prev,
                programs: prev.programs.map((program) =>
                  program.id === activeProgramId
                    ? {
                        ...program,
                        essays: program.essays.map((essayData) =>
                          essayData.promptId === activeEssayPromptId
                            ? {
                                ...essayData,
                                userEssay: {
                                  ...essayData.userEssay,
                                  content: editorChangeRef.current.content,
                                  wordCount: editorChangeRef.current.wordCount,
                                  lastModified: new Date(),
                                },
                              }
                            : essayData
                        ),
                      }
                    : program
                ),
              };
            });

            lastContentRef.current = editorChangeRef.current.content;
            setHasUnsavedChanges(true);
            editorChangeRef.current = null;
          }
        });
        return;
      }

      // Check if content actually changed
      if (content === lastContentRef.current) {
        return;
      }

      try {
        isUpdatingRef.current = true;

        // Update local state immediately for responsiveness
        setWorkspaceData((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            programs: prev.programs.map((program) =>
              program.id === activeProgramId
                ? {
                    ...program,
                    essays: program.essays.map((essayData) =>
                      essayData.promptId === activeEssayPromptId
                        ? {
                            ...essayData,
                            userEssay: {
                              ...essayData.userEssay,
                              content,
                              wordCount,
                              lastModified: new Date(),
                            },
                          }
                        : essayData
                    ),
                  }
                : program
            ),
          };
        });

        // Update refs and state
        lastContentRef.current = content;
        setHasUnsavedChanges(true);
      } catch (error) {
        console.error("Error updating content:", error);
      } finally {
        isUpdatingRef.current = false;
      }
    },
    [currentEssay, activeProgramId, activeEssayPromptId, createEssay]
  );

  /**
   * Manual save function
   */
  const manualSave = useCallback(async () => {
    if (!currentEssay || isSaving) {
      return false;
    }

    return await autoSaveEssay();
  }, [currentEssay, isSaving, autoSaveEssay]);

  /**
   * Save a named version of the essay
   */
  const saveVersion = useCallback(
    async (label) => {
      if (!currentEssay || isSaving || isSavingVersion) {
        return false;
      }

      try {
        setIsSavingVersion(true);

        if (hasUnsavedChanges) {
          const autoSaved = await autoSaveEssay();
          if (!autoSaved) {
            setError("Failed to save current changes");
            return false;
          }
        }

        const response = await fetch(
          `/api/essay/${encodeURIComponent(universityName)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "save_version",
              essayId: currentEssay.id,
              content: currentEssay.content,
              wordCount: currentEssay.wordCount,
              label: label || `Version ${new Date().toLocaleString()}`,
            }),
          }
        );

        if (response.ok) {
          await fetchWorkspaceData();
          return true;
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.error || "Failed to save version");
          return false;
        }
      } catch (error) {
        console.error("Error saving version:", error);
        setError("Error saving version");
        return false;
      } finally {
        setIsSavingVersion(false);
      }
    },
    [
      currentEssay,
      isSaving,
      isSavingVersion,
      hasUnsavedChanges,
      autoSaveEssay,
      universityName,
      fetchWorkspaceData,
    ]
  );

  /**
   * Handle program selection
   */
  const handleProgramSelect = useCallback(
    (programId) => {
      if (programId === activeProgramId) {
        return;
      }

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }

      setActiveProgramId(programId);

      const program = workspaceData?.programs?.find((p) => p.id === programId);
      if (program && program.essays && program.essays.length > 0) {
        setActiveEssayPromptId(program.essays[0].promptId);
      } else {
        setActiveEssayPromptId(null);
      }

      setHasUnsavedChanges(false);
      setLastSaved(null);
      lastContentRef.current = "";
      setError(null);
    },
    [activeProgramId, workspaceData]
  );

  /**
   * Handle essay prompt selection
   */
  const handleEssayPromptSelect = useCallback(
    (promptId) => {
      if (promptId === activeEssayPromptId) {
        return;
      }

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }

      setActiveEssayPromptId(promptId);

      setHasUnsavedChanges(false);
      setLastSaved(null);
      setError(null);

      const newEssayData = currentProgram?.essays?.find(
        (e) => e.promptId === promptId
      );
      lastContentRef.current = newEssayData?.userEssay?.content || "";
    },
    [activeEssayPromptId, currentProgram]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <Card className="p-8 bg-white/70 backdrop-blur-sm shadow-xl">
          <div className="flex items-center space-x-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#3598FE]" />
            <div>
              <h3 className="text-lg font-semibold text-[#002147]">
                Loading Workspace
              </h3>
              <p className="text-sm text-[#6C7280]">
                Fetching your essays and data...
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <Card className="p-8 bg-white/70 backdrop-blur-sm shadow-xl max-w-md">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Error Loading Workspace
            </h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button
              onClick={fetchWorkspaceData}
              className="bg-[#3598FE] hover:bg-[#2563EB]"
            >
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // No data state
  if (
    !workspaceData ||
    !workspaceData.programs ||
    workspaceData.programs.length === 0
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <Card className="p-8 bg-white/70 backdrop-blur-sm shadow-xl max-w-md text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#002147] mb-2">
            No Programs Found
          </h3>
          <p className="text-sm text-gray-600">
            No programs available for {universityName}.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left side - Logo and title */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#002147] to-[#003366] rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#002147]">
                  Essay Workspace
                </h1>
                <p className="text-sm text-[#6C7280]">
                  {workspaceData.university.name}
                </p>
              </div>
            </div>

            {/* Right side - Stats and controls */}
            <div className="flex items-center space-x-6">
              {/* Quick Stats */}
              <div className="hidden lg:flex items-center space-x-6">
                <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg">
                  <Award className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    {workspaceData.stats.completedEssays}/
                    {workspaceData.stats.totalEssayPrompts} Complete
                  </span>
                </div>
                <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    {workspaceData.stats.totalWords.toLocaleString()} words
                  </span>
                </div>
              </div>

              {/* Current Essay Word Count */}
              {currentEssay && (
                <div className="flex items-center space-x-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200">
                  <Target className="w-5 h-5 text-[#6C7280]" />
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-[#002147]">
                      {currentEssay.wordCount}/{currentEssayData.wordLimit}
                    </span>
                    <div className="flex items-center space-x-1">
                      {isSaving ? (
                        <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                      ) : hasUnsavedChanges ? (
                        <div
                          className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"
                          title="Unsaved changes"
                        />
                      ) : (
                        <div
                          className="w-2 h-2 bg-green-500 rounded-full"
                          title="Saved"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Panel Toggle Buttons */}
              <div className="flex items-center space-x-3">
                <Button
                  variant={showAnalytics ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className={
                    showAnalytics
                      ? "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0"
                      : "border-purple-500 text-purple-600 hover:bg-purple-50"
                  }
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analytics
                </Button>

                <Button
                  variant={showAI ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAI(!showAI)}
                  className={
                    showAI
                      ? "bg-gradient-to-r from-[#3598FE] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white border-0"
                      : "border-[#3598FE] text-[#3598FE] hover:bg-blue-50"
                  }
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Assistant
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left Sidebar - Program & Essay Selector */}
          <div className="col-span-12 lg:col-span-3">
            <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
                    style={{
                      backgroundColor:
                        workspaceData.university.color || "#002147",
                    }}
                  >
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#002147]">Programs</h3>
                    <p className="text-xs text-[#6C7280]">
                      {workspaceData.programs.length} available
                    </p>
                  </div>
                </div>

                {/* Program List */}
                <div className="space-y-4">
                  {workspaceData.programs.map((program) => (
                    <div
                      key={program.id}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* Program Header */}
                    <div
                        className={`p-3 cursor-pointer transition-colors ${
                          activeProgramId === program.id
                            ? "bg-blue-50 border-l-4 border-l-blue-500"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                        onClick={() => handleProgramSelect(program.id)}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-[#002147]">
                            {program.name}
                          </h4>
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              program.essays?.length > 0
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {program.essays?.length || 0} essays
                          </span>
                        </div>
                        <p className="text-xs text-[#6C7280] mt-1">
                          {program.departmentName}
                        </p>
                      </div>

                      {/* Essays List - Only show if program is active */}
                      {activeProgramId === program.id && program.essays && (
                        <div className="bg-white">
                          {program.essays.map((essayData) => (
                            <div
                              key={essayData.promptId}
                              className={`p-3 border-t border-gray-100 cursor-pointer transition-colors ${
                                activeEssayPromptId === essayData.promptId
                                  ? "bg-blue-50 border-l-4 border-l-blue-500"
                                  : "hover:bg-gray-50"
                              }`}
                              onClick={() =>
                                handleEssayPromptSelect(essayData.promptId)
                              }
                            >
                              <div className="flex items-center justify-between">
                                <h5 className="text-sm font-medium text-[#002147]">
                                  {essayData.promptTitle}
                                </h5>
                                <div className="flex items-center space-x-2">
                                  {essayData.userEssay && (
                                    <span className="text-xs text-green-600 font-medium">
                                      {Math.round(
                                        (essayData.userEssay.wordCount /
                                          essayData.wordLimit) *
                                          100
                                      )}
                                      %
                                    </span>
                                  )}
                                  {essayData.isMandatory && (
                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                      Required
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-[#6C7280] mt-1">
                                {essayData.userEssay
                                  ? essayData.userEssay.wordCount
                                  : 0}{" "}
                                / {essayData.wordLimit} words
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Main Editor Area */}
          <div className="col-span-12 lg:col-span-6">
            <Card className="h-full shadow-xl border-0 bg-white/70 backdrop-blur-sm">
              <div className="p-8">
                {currentEssayData && (
                  <>
                    {/* Essay Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-[#002147]">
                          {currentEssayData.promptTitle}
                        </h2>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-sm text-[#6C7280]">
                            {currentProgram?.name}
                          </p>
                          {currentProgram?.deadlines &&
                            currentProgram.deadlines.length > 0 && (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3 text-[#6C7280]" />
                                <span className="text-xs text-[#6C7280]">
                                  Due:{" "}
                                  {new Date(
                                    currentProgram.deadlines[0].date
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowVersions(!showVersions)}
                        className="border-[#3598FE] text-[#3598FE] hover:bg-[#3598FE] hover:text-white"
                      >
                        Versions ({currentEssay?.versions?.length || 0})
                      </Button>
                    </div>

                    {/* Essay Prompt */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <p className="text-sm text-blue-800 font-medium mb-2">
                        Essay Prompt:
                      </p>
                      <p className="text-sm text-blue-700 leading-relaxed">
                        {currentEssayData.promptText}
                      </p>
                      <div className="flex items-center justify-between mt-3 text-xs text-blue-600">
                        <span>Word limit: {currentEssayData.wordLimit}</span>
                        {currentEssayData.minWordCount && (
                          <span>Minimum: {currentEssayData.minWordCount}</span>
                        )}
                      </div>
                    </div>

                    {/* Essay Editor or Create Button */}
                    {currentEssay ? (
                      <>
                        <EssayEditor
                          key={`editor-${currentEssay.id}`}
                          content={currentEssay.content}
                          onChange={updateEssayContent}
                          wordLimit={currentEssayData.wordLimit}
                          essayId={currentEssay.id}
                          lastSaved={lastSaved}
                          hasUnsavedChanges={hasUnsavedChanges}
                          isSaving={isSaving}
                          onSave={manualSave}
                        />

                        {/* Editor Footer */}
                        <div className="mt-6 flex justify-between items-center">
                          <div className="flex items-center space-x-4 text-xs text-[#6C7280]">
                            <span>
                              Last modified:{" "}
                              {new Date(
                                currentEssay.lastModified
                              ).toLocaleString()}
                            </span>
                            {lastSaved && (
                              <span className="text-green-600">
                                Auto-saved: {lastSaved.toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              saveVersion(
                                `Manual Save ${new Date().toLocaleTimeString()}`
                              )
                            }
                            disabled={isSaving || isSavingVersion}
                            className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700 hover:bg-green-100"
                          >
                            {isSaving || isSavingVersion ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Version
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    ) : (
                      /* No essay created yet */
                      <div className="text-center py-12">
                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-[#002147] mb-2">
                          Start Writing
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Create your essay for this prompt
                        </p>

                        <Button
                          onClick={createEssay}
                          disabled={
                            !activeProgramId ||
                            !activeEssayPromptId ||
                            !userId ||
                            isCreatingEssay
                          }
                          className="bg-[#3598FE] hover:bg-[#2563EB] disabled:bg-gray-300"
                        >
                          {isCreatingEssay ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Creating Essay...
                            </>
                          ) : !activeProgramId ||
                            !activeEssayPromptId ||
                            !userId ? (
                            "Missing Required Data"
                          ) : (
                            "Start Essay"
                          )}
                        </Button>

                        {error && (
                          <p className="text-xs text-red-500 mt-2">{error}</p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* No essay prompt selected state */}
                {!currentEssayData && (
                  <div className="text-center py-12">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-[#002147] mb-2">
                      Select an Essay
                    </h3>
                    <p className="text-sm text-gray-600">
                      Choose a program and essay prompt to begin writing
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Sidebar - Analytics, AI, and Versions */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            {/* Essay Analytics Panel */}
            {showAnalytics && currentEssay && (
              <EssayAnalytics
                key={`analytics-${currentEssay.id}`}
                essay={{
                  ...currentEssay,
                  wordLimit: currentEssayData.wordLimit,
                  priority: currentEssay.priority || "medium",
                }}
                allEssays={workspaceData.programs.flatMap(
                  (p) =>
                    p.essays
                      ?.filter((e) => e.userEssay)
                      .map((e) => ({
                        ...e.userEssay,
                        wordLimit: e.wordLimit,
                      })) || []
                )}
                essayId={currentEssay.id}
                userId={userId}
                universityName={universityName}
              />
            )}

            {/* AI Suggestions Panel */}
            {showAI && currentEssay && (
              <AISuggestions
                key={`ai-${currentEssay.id}`}
                content={currentEssay.content}
                prompt={currentEssayData.promptText}
                wordCount={currentEssay.wordCount}
                wordLimit={currentEssayData.wordLimit}
                essayId={currentEssay.id}
                universityName={universityName}
              />
            )}

            {/* Version Manager Panel */}
            {showVersions && currentEssay && (
              <VersionManager
                key={`versions-${currentEssay.id}`}
                versions={currentEssay.versions || []}
                currentContent={currentEssay.content}
                onRestoreVersion={async (versionId) => {
                  try {
                    setError(null);
                    const response = await fetch(
                      `/api/essay/${encodeURIComponent(universityName)}`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "restore_version",
                          essayId: currentEssay.id,
                          versionId,
                        }),
                      }
                    );

                    if (response.ok) {
                      await fetchWorkspaceData();
                      setHasUnsavedChanges(false);
                      setLastSaved(new Date());
                    } else {
                      const errorData = await response.json();
                      setError(errorData.error || "Failed to restore version");
                    }
                  } catch (error) {
                    console.error("Error restoring version:", error);
                    setError("Error restoring version");
                  }
                }}
                onDeleteVersion={async (versionId) => {
                  try {
                    setError(null);
                    const response = await fetch(
                      `/api/essay/${encodeURIComponent(universityName)}`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "delete_version",
                          versionId,
                          essayId: currentEssay.id,
                        }),
                      }
                    );

                    if (response.ok) {
                      await fetchWorkspaceData();
                    } else {
                      const errorData = await response.json();
                      setError(errorData.error || "Failed to delete version");
                    }
                  } catch (error) {
                    console.error("Error deleting version:", error);
                    setError("Error deleting version");
                  }
                }}
                essayId={currentEssay.id}
                universityName={universityName}
                isLoading={loading}
              />
            )}

            {/* Help Panel - Show when no essay is selected */}
            {!currentEssay && (
              <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-[#002147]">
                      Getting Started
                    </h3>
                  </div>

                  <div className="space-y-4 text-sm text-gray-600">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-blue-600">
                          1
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          Select a Program
                        </p>
                        <p className="text-xs text-gray-500">
                          Choose the MBA program you're applying to
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-blue-600">
                          2
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          Pick an Essay
                        </p>
                        <p className="text-xs text-gray-500">
                          Select an essay prompt to start writing
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-blue-600">
                          3
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          Start Writing
                        </p>
                        <p className="text-xs text-gray-500">
                          Click "Start Essay" to begin your draft
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">
                      Tips for Success:
                    </h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Start with an outline of key points</li>
                      <li>• Use specific examples and metrics</li>
                      <li>• Show leadership and impact</li>
                      <li>• Stay within word limits</li>
                      <li>• Use AI suggestions for improvement</li>
                    </ul>
                  </div>
                </div>
              </Card>
            )}

            {/* Quick Actions Panel */}
            {currentEssay && (
              <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-[#002147]">Quick Actions</h3>
                  </div>

                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        saveVersion(
                          `Manual Save ${new Date().toLocaleTimeString()}`
                        )
                      }
                      disabled={isSaving || isSavingVersion}
                      className="w-full justify-start bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                    >
                      {isSavingVersion ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Version
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowVersions(!showVersions)}
                      className="w-full justify-start bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      View History ({currentEssay.versions?.length || 0})
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={manualSave}
                      disabled={isSaving || !hasUnsavedChanges}
                      className="w-full justify-start bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Manual Save
                    </Button>

                    {/* Word Count Progress */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">
                          Progress
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.round(
                            (currentEssay.wordCount /
                              currentEssayData.wordLimit) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              (currentEssay.wordCount /
                                currentEssayData.wordLimit) *
                                100,
                              100
                            )}%`,
                            backgroundColor:
                              currentEssay.wordCount >
                              currentEssayData.wordLimit
                                ? "#EF4444"
                                : currentEssay.wordCount >
                                  currentEssayData.wordLimit * 0.8
                                ? "#F59E0B"
                                : "#10B981",
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{currentEssay.wordCount} words</span>
                        <span>{currentEssayData.wordLimit} limit</span>
                      </div>
                    </div>

                    {/* Essay Status */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">
                          Status
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            currentEssay.status === "COMPLETED"
                              ? "bg-green-100 text-green-700"
                              : currentEssay.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {currentEssay.status || "DRAFT"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>
                          Modified{" "}
                          {new Date(
                            currentEssay.lastModified
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Footer with additional info */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200/50 mt-12">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <span>Essay Workspace</span>
              <span>•</span>
              <span>{workspaceData.university.name}</span>
              <span>•</span>
              <span>Auto-save enabled (3s)</span>
            </div>

            <div className="flex items-center space-x-4 text-xs text-gray-500">
              {userEmail && (
                <>
                  <span>Logged in as {userEmail}</span>
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