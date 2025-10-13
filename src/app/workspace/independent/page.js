"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EssayEditor } from "../components/EssayEditor";
import { VersionManager } from "../components/VersionManager";
import { AISuggestions } from "../components/AiSuggestion";
import { EssayAnalytics } from "../components/EssayAnalytics";
import {
  BookOpen,
  Plus,
  Target,
  Sparkles,
  TrendingUp,
  Loader2,
  AlertCircle,
  Save,
  Trash2,
  X,
  Award,
  Clock,
} from "lucide-react";

// New Essay Modal Component
function NewEssayModal({ onClose, onCreate, isCreating }) {
  const [title, setTitle] = useState("");
  const [wordLimit, setWordLimit] = useState(500);
  const [priority, setPriority] = useState("medium");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onCreate({ title: title.trim(), wordLimit, priority });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[#002147]">Create New Essay</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isCreating}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Essay Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter essay title..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isCreating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Word Limit
              </label>
              <input
                type="number"
                value={wordLimit}
                onChange={(e) => setWordLimit(Math.max(100, parseInt(e.target.value) || 500))}
                min="100"
                max="5000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isCreating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isCreating}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#3598FE] hover:bg-[#2563EB]"
                disabled={isCreating || !title.trim()}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Essay"
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

export default function IndependentWorkspacePage() {
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [workspaceData, setWorkspaceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active selections - works same as program workspace
  const [activeProgramId, setActiveProgramId] = useState(null);
  const [activeEssayPromptId, setActiveEssayPromptId] = useState(null);

  // UI state
  const [showVersions, setShowVersions] = useState(false);
  const [showAI, setShowAI] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [showNewEssayModal, setShowNewEssayModal] = useState(false);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isCreatingEssay, setIsCreatingEssay] = useState(false);
  const [isSavingVersion, setIsSavingVersion] = useState(false);

  // Activity tracking
  const [lastUserActivity, setLastUserActivity] = useState(Date.now());
  const [isUserActive, setIsUserActive] = useState(true);

  // Refs for auto-save
  const autoSaveTimerRef = useRef(null);
  const lastContentRef = useRef("");
  const isUpdatingRef = useRef(false);
  const editorChangeRef = useRef(null);
  const activityTimeoutRef = useRef(null);

  // Memoized current program and essay - SAME AS PROGRAM WORKSPACE
  const currentProgram = useMemo(() => {
    return workspaceData?.programs?.find((p) => p.id === activeProgramId);
  }, [workspaceData, activeProgramId]);

  const currentEssayData = useMemo(() => {
    return currentProgram?.essays?.find((e) => e.promptId === activeEssayPromptId);
  }, [currentProgram, activeEssayPromptId]);

  const currentEssay = useMemo(() => {
    return currentEssayData?.userEssay;
  }, [currentEssayData]);

  // Initialize userId
  useEffect(() => {
    if (typeof window !== "undefined") {
      const authData = localStorage.getItem("authData");
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          setUserId(parsed.userId);
          setUserEmail(parsed.email);
        } catch (err) {
          console.error("Error parsing auth data:", err);
          setError("Invalid authentication data. Please log in again.");
        }
      } else {
        setError("User authentication required. Please log in.");
      }
    }
  }, []);

  // Fetch workspace data - USES INDEPENDENT API
  const fetchWorkspaceData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/essay/independent?userId=${userId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch data");
      }

      const data = await response.json();
      console.log("Fetched independent workspace data:", data);
      setWorkspaceData(data);

      // Set default active selections
      if (data.programs && data.programs.length > 0) {
        const program = data.programs[0];
        setActiveProgramId(program.id);

        if (program.essays && program.essays.length > 0) {
          setActiveEssayPromptId(program.essays[0].promptId);
          lastContentRef.current = program.essays[0].userEssay?.content || "";
        }
      }
    } catch (err) {
      console.error("Error fetching workspace data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchWorkspaceData();
    }
  }, [userId, fetchWorkspaceData]);

  // Auto-save function - SAME AS PROGRAM WORKSPACE
  const autoSaveEssay = useCallback(async () => {
    if (!currentEssay || isSaving || !hasUnsavedChanges || isUpdatingRef.current) {
      return false;
    }

    try {
      setIsSaving(true);
      isUpdatingRef.current = true;

      const response = await fetch("/api/essay/independent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essayId: currentEssay.id,
          content: currentEssay.content,
          wordCount: currentEssay.wordCount,
          isAutoSave: true,
        }),
      });

      if (response.ok) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Auto-save error:", error);
      return false;
    } finally {
      setIsSaving(false);
      isUpdatingRef.current = false;
    }
  }, [currentEssay, isSaving, hasUnsavedChanges]);

  // Auto-save timer - SAME AS PROGRAM WORKSPACE
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    if (hasUnsavedChanges && currentEssay && !isSaving && !isUpdatingRef.current) {
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
  }, [hasUnsavedChanges, currentEssay?.id, isSaving, lastUserActivity, isUserActive, autoSaveEssay]);

  // Activity tracking - SAME AS PROGRAM WORKSPACE
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

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];
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

  // Update essay content - SAME AS PROGRAM WORKSPACE
  const updateEssayContent = useCallback(
    (content, wordCount) => {
      if (isUpdatingRef.current || !currentEssay) return;

      editorChangeRef.current = { content, wordCount };

      if (content === lastContentRef.current) {
        return;
      }

      try {
        isUpdatingRef.current = true;

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

        lastContentRef.current = content;
        setHasUnsavedChanges(true);
      } catch (error) {
        console.error("Error updating content:", error);
      } finally {
        isUpdatingRef.current = false;
      }
    },
    [currentEssay, activeProgramId, activeEssayPromptId]
  );

  // Manual save
  const manualSave = useCallback(async () => {
    if (!currentEssay || isSaving) {
      return false;
    }
    return await autoSaveEssay();
  }, [currentEssay, isSaving, autoSaveEssay]);

  // Save version
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

        const response = await fetch("/api/essay/independent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save_version",
            essayId: currentEssay.id,
            content: currentEssay.content,
            wordCount: currentEssay.wordCount,
            label: label || `Version ${new Date().toLocaleString()}`,
          }),
        });

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
    [currentEssay, isSaving, isSavingVersion, hasUnsavedChanges, autoSaveEssay, fetchWorkspaceData]
  );

  // Create new essay
  const handleCreateEssay = async (essayData) => {
    try {
      setIsCreatingEssay(true);
      setError(null);

      const response = await fetch("/api/essay/independent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_essay",
          userId,
          ...essayData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create essay");
      }

      await fetchWorkspaceData();
      setShowNewEssayModal(false);
    } catch (error) {
      console.error("Error creating essay:", error);
      setError(error.message);
    } finally {
      setIsCreatingEssay(false);
    }
  };

  // Delete essay
  const handleDeleteEssay = async (essayId) => {
    if (!confirm("Are you sure you want to delete this essay?")) return;

    try {
      const response = await fetch("/api/essay/independent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_essay",
          essayId,
        }),
      });

      if (!response.ok) throw new Error("Failed to delete essay");

      await fetchWorkspaceData();
      
      // If deleted essay was active, clear selection
      if (currentEssay?.id === essayId) {
        setActiveEssayPromptId(null);
        lastContentRef.current = "";
      }
    } catch (error) {
      setError(error.message);
    }
  };

  // Handle essay selection
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
  if (!userId || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <Card className="p-8 bg-white/70 backdrop-blur-sm shadow-xl">
          <div className="flex items-center space-x-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#3598FE]" />
            <div>
              <h3 className="text-lg font-semibold text-[#002147]">
                Loading Workspace
              </h3>
              <p className="text-sm text-[#6C7280]">Fetching your essays...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && !workspaceData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <Card className="p-8 bg-white/70 backdrop-blur-sm shadow-xl max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            Authentication Required
          </h3>
          <p className="text-sm text-gray-600 mb-4">{error || "Please log in to continue"}</p>
          <Button
            onClick={() => (window.location.href = "/dashboard")}
            className="bg-[#3598FE] hover:bg-[#2563EB]"
          >
            Go to dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      {/* Header - SAME STRUCTURE AS PROGRAM WORKSPACE */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#002147] to-[#003366] rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#002147]">
                  Independent Essay Workspace
                </h1>
                <p className="text-sm text-[#6C7280]">
                  {workspaceData?.university?.name || "Personal Essays"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {workspaceData?.stats && (
                <div className="hidden lg:flex items-center space-x-4">
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
              )}

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
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" title="Unsaved changes" />
                      ) : (
                        <div className="w-2 h-2 bg-green-500 rounded-full" title="Saved" />
                      )}
                    </div>
                  </div>
                </div>
              )}

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

      {/* Error Banner */}
      {error && (
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content - SAME STRUCTURE AS PROGRAM WORKSPACE */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left Sidebar - Essay List */}
          <div className="col-span-12 lg:col-span-3">
            <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-[#002147]">My Essays</h3>
                    <p className="text-xs text-[#6C7280]">
                      {currentProgram?.essays?.length || 0} total
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowNewEssayModal(true)}
                    className="bg-[#3598FE] hover:bg-[#2563EB]"
                    disabled={isCreatingEssay}
                  >
                    {isCreatingEssay ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Essay List */}
                <div className="space-y-2 max-h-[700px] overflow-y-auto">
                  {currentProgram?.essays?.map((essayData) => (
                    <div
                      key={essayData.promptId}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        activeEssayPromptId === essayData.promptId
                          ? "bg-blue-50 border-blue-500"
                          : "bg-white hover:bg-gray-50 border-gray-200"
                      }`}
                      onClick={() => handleEssayPromptSelect(essayData.promptId)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-semibold text-[#002147] flex-1 pr-2">
                          {essayData.promptTitle}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEssay(essayData.promptId);
                          }}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>
                          {essayData.userEssay?.wordCount || 0}/{essayData.wordLimit} words
                        </span>
                        <span
                          className={`px-2 py-1 rounded ${
                            essayData.userEssay?.status === "COMPLETED"
                              ? "bg-green-100 text-green-700"
                              : essayData.userEssay?.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {essayData.userEssay?.status || "DRAFT"}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              essayData.userEssay?.priority === "high"
                                ? "bg-red-500"
                                : essayData.userEssay?.priority === "medium"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                          />
                          <span className="text-xs text-gray-500">
                            {essayData.userEssay?.lastModified
                              ? new Date(essayData.userEssay.lastModified).toLocaleDateString()
                              : "Not started"}
                          </span>
                        </div>
                        <div className="w-full max-w-[60px] bg-gray-200 rounded-full h-1">
                          <div
                            className="h-1 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(
                                ((essayData.userEssay?.wordCount || 0) / essayData.wordLimit) * 100,
                                100
                              )}%`,
                              backgroundColor:
                                (essayData.userEssay?.wordCount || 0) > essayData.wordLimit
                                  ? "#EF4444"
                                  : (essayData.userEssay?.wordCount || 0) > essayData.wordLimit * 0.8
                                  ? "#F59E0B"
                                  : "#10B981",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!currentProgram?.essays || currentProgram.essays.length === 0) && (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-3">No essays yet</p>
                      <Button
                        size="sm"
                        onClick={() => setShowNewEssayModal(true)}
                        className="bg-[#3598FE]"
                        disabled={isCreatingEssay}
                      >
                        Create First Essay
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Main Editor Area - USES SAME COMPONENTS */}
          <div className="col-span-12 lg:col-span-6">
            <Card className="h-full shadow-xl border-0 bg-white/70 backdrop-blur-sm">
              <div className="p-8">
                {currentEssayData && currentEssay ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-[#002147]">
                          {currentEssayData.promptTitle}
                        </h2>
                        <div className="flex items-center space-x-4 mt-1">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              currentEssay.priority === "high"
                                ? "bg-red-100 text-red-700"
                                : currentEssay.priority === "medium"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {currentEssay.priority} priority
                          </span>
                          <span className="text-xs text-gray-500">
                            {currentEssayData.wordLimit} words max
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowVersions(!showVersions)}
                        className="border-[#3598FE] text-[#3598FE] hover:bg-[#3598FE] hover:text-white"
                      >
                        Versions ({currentEssay.versions?.length || 0})
                      </Button>
                    </div>

                    {/* SAME EssayEditor COMPONENT */}
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

                    <div className="mt-6 flex justify-between items-center">
                      <div className="flex items-center space-x-4 text-xs text-[#6C7280]">
                        <span>
                          Last modified: {new Date(currentEssay.lastModified).toLocaleString()}
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
                          saveVersion(`Manual Save ${new Date().toLocaleTimeString()}`)
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
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-[#002147] mb-2">
                      No Essay Selected
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Select an essay from the list or create a new one
                    </p>
                    <Button
                      onClick={() => setShowNewEssayModal(true)}
                      className="bg-[#3598FE]"
                      disabled={isCreatingEssay}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Essay
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Sidebar - USES SAME COMPONENTS */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            {showAnalytics && currentEssay && (
              <EssayAnalytics
                key={`analytics-${currentEssay.id}`}
                essay={{
                  ...currentEssay,
                  wordLimit: currentEssayData.wordLimit,
                }}
                allEssays={
                  currentProgram?.essays
                    ?.filter((e) => e.userEssay)
                    .map((e) => ({
                      ...e.userEssay,
                      wordLimit: e.wordLimit,
                    })) || []
                }
                essayId={currentEssay.id}
                userId={userId}
                universityName="independent"
              />
            )}

            {showAI && currentEssay && (
              <AISuggestions
                key={`ai-${currentEssay.id}`}
                content={currentEssay.content}
                prompt={currentEssayData.promptText}
                wordCount={currentEssay.wordCount}
                wordLimit={currentEssayData.wordLimit}
                essayId={currentEssay.id}
                universityName="independent"
              />
            )}

            {showVersions && currentEssay && (
              <VersionManager
                key={`versions-${currentEssay.id}`}
                versions={currentEssay.versions || []}
                currentContent={currentEssay.content}
                onRestoreVersion={async (versionId) => {
                  try {
                    setError(null);
                    const response = await fetch("/api/essay/independent", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "restore_version",
                        essayId: currentEssay.id,
                        versionId,
                      }),
                    });

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
                    const response = await fetch("/api/essay/independent", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "delete_version",
                        versionId,
                        essayId: currentEssay.id,
                      }),
                    });

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
                universityName="independent"
                isLoading={loading}
              />
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
                        saveVersion(`Manual Save ${new Date().toLocaleTimeString()}`)
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
                        <span className="text-xs font-medium text-gray-600">Progress</span>
                        <span className="text-xs text-gray-500">
                          {Math.round(
                            (currentEssay.wordCount / currentEssayData.wordLimit) * 100
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              (currentEssay.wordCount / currentEssayData.wordLimit) * 100,
                              100
                            )}%`,
                            backgroundColor:
                              currentEssay.wordCount > currentEssayData.wordLimit
                                ? "#EF4444"
                                : currentEssay.wordCount > currentEssayData.wordLimit * 0.8
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
                        <span className="text-xs font-medium text-gray-600">Status</span>
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
                          Modified {new Date(currentEssay.lastModified).toLocaleDateString()}
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

      {/* New Essay Modal */}
      {showNewEssayModal && (
        <NewEssayModal
          onClose={() => setShowNewEssayModal(false)}
          onCreate={handleCreateEssay}
          isCreating={isCreatingEssay}
        />
      )}

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200/50 mt-12">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <span>Independent Essay Workspace</span>
              <span>•</span>
              <span>Auto-save enabled (4 min inactivity)</span>
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