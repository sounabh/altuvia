// src/app/workspace/independent/page.jsx

"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EssayEditor } from "../components/EssayEditor";
import { VersionManager } from "../components/VersionManager";
import { AISuggestions } from "../components/AiSuggestion";
import { EssayAnalytics } from "../components/EssayAnalytics";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  Building2,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  FileText,
  CheckCircle2,
  Circle,
  Filter,
} from "lucide-react";

// ==========================================
// HELPER FUNCTION: calculateStats
// ==========================================

/**
 * Recalculates all statistics from current workspace data
 * This ensures stats are always in sync with actual data
 */
const calculateStats = (workspaceData) => {
  if (!workspaceData?.programs) return null;

  const stats = {
    totalPrograms: workspaceData.programs.length,
    totalEssayPrompts: 0,
    completedEssays: 0,
    totalWords: 0,
    programsByUniversity: {},
  };

  workspaceData.programs.forEach((program) => {
    // Initialize university group
    if (!stats.programsByUniversity[program.universityId]) {
      stats.programsByUniversity[program.universityId] = [];
    }
    stats.programsByUniversity[program.universityId].push(program);

    // Count essays
    if (program.essays) {
      stats.totalEssayPrompts += program.essays.length;

      program.essays.forEach((essay) => {
        if (essay.userEssay) {
          stats.totalWords += essay.userEssay.wordCount || 0;
          if (essay.userEssay.isCompleted) {
            stats.completedEssays++;
          }
        }
      });
    }
  });

  stats.averageProgress =
    stats.totalEssayPrompts > 0
      ? (stats.completedEssays / stats.totalEssayPrompts) * 100
      : 0;

  return stats;
};

// University Selector Component
function UniversitySelector({
  universities,
  selectedUniversityId,
  onSelect,
  stats,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedUniversity = universities?.find(
    (u) => u.id === selectedUniversityId
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-all min-w-[250px] hover:shadow-md active:scale-[0.98]"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
          style={{ backgroundColor: selectedUniversity?.color || "#002147" }}
        >
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-[#002147] truncate">
            {selectedUniversityId === "all"
              ? "All Universities"
              : selectedUniversity?.name || "Select University"}
          </p>
          <p className="text-xs text-gray-500">
            {selectedUniversityId === "all"
              ? `${universities?.length || 0} universities`
              : `${selectedUniversity?.programCount || 0} programs`}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden max-h-[400px] overflow-y-auto">
            {/* All Universities Option */}
            <button
              onClick={() => {
                onSelect("all");
                setIsOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors active:bg-gray-100 ${
                selectedUniversityId === "all" ? "bg-blue-50" : ""
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-sm">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-[#002147]">
                  All Universities
                </p>
                <p className="text-xs text-gray-500">
                  {stats?.totalPrograms || 0} programs •{" "}
                  {stats?.totalEssayPrompts || 0} essays
                </p>
              </div>
              {selectedUniversityId === "all" && (
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
              )}
            </button>

            <div className="border-t border-gray-100" />

            {/* Individual Universities */}
            {universities?.map((university) => {
              const uniPrograms =
                stats?.programsByUniversity?.[university.id] || [];
              const uniEssayCount = uniPrograms.reduce(
                (acc, p) => acc + (p.essays?.length || 0),
                0
              );

              return (
                <button
                  key={university.id}
                  onClick={() => {
                    onSelect(university.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors active:bg-gray-100 ${
                    selectedUniversityId === university.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: university.color || "#002147" }}
                  >
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-[#002147]">
                      {university.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {university.programCount} programs • {uniEssayCount}{" "}
                      essays
                    </p>
                  </div>
                  {selectedUniversityId === university.id && (
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// Program Card Component - FIXED
function ProgramCard({
  program,
  isExpanded,
  onToggle,
  activeEssayPromptId,
  onEssaySelect,
  onDeleteEssay,
  onCreateEssay,
  onToggleCompletion, // Add this prop
}) {
  const completedEssays =
    program.essays?.filter((e) => e.userEssay?.isCompleted).length || 0;
  const totalEssays = program.essays?.length || 0;
  const progress = totalEssays > 0 ? (completedEssays / totalEssays) * 100 : 0;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow">
      {/* Program Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors active:bg-gray-100"
      >
        <div className="flex items-center space-x-3">
          <div
            className="w-2 h-10 rounded-full shadow-sm"
            style={{ backgroundColor: program.universityColor || "#002147" }}
          />
          <div className="text-left">
            <p className="text-sm font-semibold text-[#002147] line-clamp-1">
              {program.name}
            </p>
            <p className="text-xs text-gray-500">{program.universityName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {completedEssays}/{totalEssays}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Progress Bar */}
      <div className="px-3 pb-2">
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-green-500 shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Essays List */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-2 space-y-1">
          {program.essays?.map((essayData) => (
            <div
              key={essayData.promptId}
              className={`w-full p-2 rounded-lg text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group ${
                activeEssayPromptId === essayData.promptId
                  ? "bg-blue-100 border border-blue-300 shadow-sm"
                  : "bg-white hover:bg-gray-100 border border-transparent hover:border-gray-200"
              }`}
              onClick={() => onEssaySelect(program.id, essayData.promptId)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onEssaySelect(program.id, essayData.promptId);
                }
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2 flex-1">
                  {essayData.userEssay?.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : essayData.userEssay ? (
                    <Circle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#002147] line-clamp-2">
                      {essayData.promptTitle}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {essayData.userEssay?.wordCount || 0}/
                        {essayData.wordLimit}
                      </span>
                      {essayData.isMandatory && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded shadow-sm">
                          Required
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {essayData.userEssay && (
                  <div className="flex items-center space-x-1">
                    {/* Completion Toggle Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCompletion(
                          essayData.userEssay.id,
                          essayData.userEssay.isCompleted
                        );
                      }}
                      className={`p-1 rounded transition-colors ${
                        essayData.userEssay.isCompleted
                          ? "text-green-600 hover:bg-green-50"
                          : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                      }`}
                      title={
                        essayData.userEssay.isCompleted
                          ? "Mark as incomplete"
                          : "Mark as complete"
                      }
                    >
                      {essayData.userEssay.isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Circle className="w-3.5 h-3.5" />
                      )}
                    </button>
                    
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEssay(essayData.userEssay.id);
                      }}
                      className="text-gray-400 hover:text-red-500 p-1 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                      title="Delete essay"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {(!program.essays || program.essays.length === 0) && (
            <p className="text-xs text-gray-500 text-center py-2">
              No essay prompts available
            </p>
          )}
        </div>
      )}
    </div>
  );
}
// Stats Summary Component
function StatsSummary({ stats, selectedUniversityId, universities }) {
  const displayStats = useMemo(() => {
    if (selectedUniversityId === "all") {
      return {
        universities: universities?.length || 0,
        programs: stats?.totalPrograms || 0,
        essays: stats?.totalEssayPrompts || 0,
        completed: stats?.completedEssays || 0,
        words: stats?.totalWords || 0,
        progress: stats?.averageProgress || 0,
      };
    }

    const uniPrograms =
      stats?.programsByUniversity?.[selectedUniversityId] || [];
    const uniEssays = uniPrograms.reduce(
      (acc, p) => acc + (p.essays?.length || 0),
      0
    );
    const uniCompleted = uniPrograms.reduce(
      (acc, p) =>
        acc + (p.essays?.filter((e) => e.userEssay?.isCompleted).length || 0),
      0
    );
    const uniWords = uniPrograms.reduce(
      (acc, p) =>
        acc +
        (p.essays?.reduce((ea, e) => ea + (e.userEssay?.wordCount || 0), 0) ||
          0),
      0
    );

    return {
      universities: 1,
      programs: uniPrograms.length,
      essays: uniEssays,
      completed: uniCompleted,
      words: uniWords,
      progress: uniEssays > 0 ? (uniCompleted / uniEssays) * 100 : 0,
    };
  }, [stats, selectedUniversityId, universities]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-purple-500" />
          <span className="text-xs text-gray-500">Universities</span>
        </div>
        <p className="text-xl font-bold text-[#002147] mt-1">
          {displayStats.universities}
        </p>
      </div>

      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-2">
          <GraduationCap className="w-4 h-4 text-blue-500" />
          <span className="text-xs text-gray-500">Programs</span>
        </div>
        <p className="text-xl font-bold text-[#002147] mt-1">
          {displayStats.programs}
        </p>
      </div>

      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-green-500" />
          <span className="text-xs text-gray-500">Essays</span>
        </div>
        <p className="text-xl font-bold text-[#002147] mt-1">
          {displayStats.completed}/{displayStats.essays}
        </p>
      </div>

      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-orange-500" />
          <span className="text-xs text-gray-500">Total Words</span>
        </div>
        <p className="text-xl font-bold text-[#002147] mt-1">
          {displayStats.words.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export default function IndependentWorkspacePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [workspaceData, setWorkspaceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active selections
  const [selectedUniversityId, setSelectedUniversityId] = useState("all");
  const [activeProgramId, setActiveProgramId] = useState(null);
  const [activeEssayPromptId, setActiveEssayPromptId] = useState(null);
  const [expandedPrograms, setExpandedPrograms] = useState(new Set());

  // UI state
  const [showVersions, setShowVersions] = useState(false);
  const [showAI, setShowAI] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all"); // all, completed, in-progress, not-started

  // Panel order management
  const [panelOrder, setPanelOrder] = useState(['versions', 'analytics', 'ai']); // Default order

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
  const activityTimeoutRef = useRef(null);

  // ==========================================
  // UPDATED enhancedStats USEMEMO
  // ==========================================
  const enhancedStats = useMemo(() => {
    if (!workspaceData) return null;

    // Recalculate stats in real-time from current data
    const freshStats = calculateStats(workspaceData);
    
    return {
      ...freshStats,
      savedUniversitiesCount: workspaceData.universities?.length || 0,
    };
  }, [workspaceData]); // Only depends on workspaceData

  // Filtered programs based on selected university and status filter
  const filteredPrograms = useMemo(() => {
    if (!workspaceData?.programs) return [];

    let programs = workspaceData.programs;

    // Filter by university
    if (selectedUniversityId !== "all") {
      programs = programs.filter(
        (p) => p.universityId === selectedUniversityId
      );
    }

    // Filter by essay status
    if (filterStatus !== "all") {
      programs = programs
        .map((program) => ({
          ...program,
          essays: program.essays?.filter((essay) => {
            if (filterStatus === "completed")
              return essay.userEssay?.isCompleted;
            if (filterStatus === "in-progress")
              return essay.userEssay && !essay.userEssay.isCompleted;
            if (filterStatus === "not-started") return !essay.userEssay;
            return true;
          }),
        }))
        .filter((p) => p.essays?.length > 0);
    }

    // Filter out programs with no essays
    programs = programs.filter((p) => p.essays && p.essays.length > 0);

    return programs;
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

  // Current university for header
  const currentUniversity = useMemo(() => {
    if (selectedUniversityId === "all") {
      return null;
    }
    return workspaceData?.universities?.find(
      (u) => u.id === selectedUniversityId
    );
  }, [workspaceData, selectedUniversityId]);

  // Handle panel clicks for ordering
  const handlePanelToggle = useCallback((panelName, currentState) => {
    if (!currentState) {
      // If turning ON, move to front
      setPanelOrder(prev => [panelName, ...prev.filter(p => p !== panelName)]);
    }
  }, []);

  // Fetch workspace data
  const fetchWorkspaceData = useCallback(async () => {
    if (status === "loading") return;

    if (status !== "authenticated") {
      setError("Please login to view your workspace");
      setLoading(false);
      router.push("/signin");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/essay/independent`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          router.push("/signin");
          return;
        }
        throw new Error(errorData.error || "Failed to fetch data");
      }

      const data = await response.json();
      console.log("Fetched workspace data:", data);
      setWorkspaceData(data);

      // Auto-expand first program and select first essay
      if (data.programs && data.programs.length > 0) {
        const firstProgram = data.programs[0];
        setExpandedPrograms(new Set([firstProgram.id]));
        setActiveProgramId(firstProgram.id);

        if (firstProgram.essays && firstProgram.essays.length > 0) {
          setActiveEssayPromptId(firstProgram.essays[0].promptId);
          lastContentRef.current =
            firstProgram.essays[0].userEssay?.content || "";
        }
      }
    } catch (err) {
      console.error("Error fetching workspace data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status, router]);

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  // Auto-save function
  const autoSaveEssay = useCallback(async () => {
    if (
      !currentEssay ||
      isSaving ||
      !hasUnsavedChanges ||
      isUpdatingRef.current
    ) {
      return false;
    }

    try {
      setIsSaving(true);
      isUpdatingRef.current = true;

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

  // Auto-save timer
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

  // Activity tracking
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

  // ==========================================
  // UPDATED updateEssayContent FUNCTION
  // ==========================================
  const updateEssayContent = useCallback(
    (content, wordCount) => {
      if (isUpdatingRef.current || !currentEssay) return;
      if (content === lastContentRef.current) return;

      try {
        isUpdatingRef.current = true;

        setWorkspaceData((prev) => {
          if (!prev) return prev;

          const updated = {
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

          // Recalculate stats immediately
          updated.stats = calculateStats(updated);
          
          return updated;
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

  // Handle essay selection
  const handleEssaySelect = useCallback(
    (programId, promptId) => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }

      setActiveProgramId(programId);
      setActiveEssayPromptId(promptId);
      setHasUnsavedChanges(false);
      setLastSaved(null);
      setError(null);

      // Auto-expand the program
      setExpandedPrograms((prev) => new Set([...prev, programId]));

      const program = workspaceData?.programs?.find((p) => p.id === programId);
      const essayData = program?.essays?.find((e) => e.promptId === promptId);
      lastContentRef.current = essayData?.userEssay?.content || "";
    },
    [workspaceData]
  );

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

  // Manual save
  const manualSave = useCallback(async () => {
    if (!currentEssay || isSaving) return false;
    return await autoSaveEssay();
  }, [currentEssay, isSaving, autoSaveEssay]);

  // ==========================================
  // UPDATED saveVersion FUNCTION
  // ==========================================
  const saveVersion = useCallback(
    async (label) => {
      if (!currentEssay || isSaving || isSavingVersion) return false;

      try {
        setIsSavingVersion(true);

        if (hasUnsavedChanges) {
          const autoSaved = await autoSaveEssay();
          if (!autoSaved) {
            setError("Failed to save current changes");
            return false;
          }
        }

        const response = await fetch(`/api/essay/independent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            action: "save_version",
            essayId: currentEssay.id,
            content: currentEssay.content,
            wordCount: currentEssay.wordCount,
            label: label || `Version ${new Date().toLocaleString()}`,
          }),
        });

        if (response.ok) {
          const result = await response.json();

          if (result.version) {
            setWorkspaceData((prev) => {
              if (!prev) return prev;

              const updated = {
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
                                  versions: [
                                    result.version,
                                    ...(essayData.userEssay?.versions || []),
                                  ],
                                  lastModified: new Date(),
                                },
                              }
                            : essayData
                        ),
                      }
                    : program
                ),
              };

              // Recalculate stats
              updated.stats = calculateStats(updated);
              
              return updated;
            });
          }

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
      activeProgramId,
      activeEssayPromptId,
    ]
  );

  // ==========================================
  // UPDATED handleCreateEssay FUNCTION
  // ==========================================
  const handleCreateEssay = async (programId, essayPromptId) => {
    try {
      setIsCreatingEssay(true);
      setError(null);

      const response = await fetch(`/api/essay/independent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "create_essay",
          programId,
          essayPromptId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create essay");
      }

      const result = await response.json();

      if (result.essay) {
        setWorkspaceData((prev) => {
          if (!prev) return prev;

          const updated = {
            ...prev,
            programs: prev.programs.map((program) =>
              program.id === programId
                ? {
                    ...program,
                    essays: program.essays.map((essayData) =>
                      essayData.promptId === essayPromptId
                        ? {
                            ...essayData,
                            userEssay: result.essay,
                          }
                        : essayData
                    ),
                  }
                : program
            ),
          };

          // Recalculate stats
          updated.stats = calculateStats(updated);
          
          return updated;
        });

        lastContentRef.current = result.essay.content || "";
        setHasUnsavedChanges(false);
        setLastSaved(new Date());

        handleEssaySelect(programId, essayPromptId);
      }
    } catch (error) {
      console.error("Error creating essay:", error);
      setError(error.message);
    } finally {
      setIsCreatingEssay(false);
    }
  };

  // ==========================================
  // UPDATED handleDeleteEssay FUNCTION
  // ==========================================
  const handleDeleteEssay = async (essayId) => {
    if (!confirm("Are you sure you want to delete this essay?")) return;

    try {
      const response = await fetch(`/api/essay/independent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "delete_essay",
          essayId,
        }),
      });

      if (!response.ok) throw new Error("Failed to delete essay");

      // Update local state instead of full refresh
      setWorkspaceData((prev) => {
        if (!prev) return prev;

        const updated = {
          ...prev,
          programs: prev.programs.map((program) => ({
            ...program,
            essays: program.essays.map((essayData) =>
              essayData.userEssay?.id === essayId
                ? {
                    ...essayData,
                    userEssay: null, // Remove the user essay
                  }
                : essayData
            ),
          })),
        };

        // Recalculate stats
        updated.stats = calculateStats(updated);
        
        return updated;
      });

      if (currentEssay?.id === essayId) {
        setActiveEssayPromptId(null);
        lastContentRef.current = "";
      }
    } catch (error) {
      setError(error.message);
    }
  };

  // ==========================================
  // ADDED toggleEssayCompletion FUNCTION (NEW)
  // ==========================================
  const toggleEssayCompletion = useCallback(
    async (essayId, currentStatus) => {
      try {
        // Optimistically update UI
        setWorkspaceData((prev) => {
          if (!prev) return prev;

          const updated = {
            ...prev,
            programs: prev.programs.map((program) => ({
              ...program,
              essays: program.essays.map((essayData) =>
                essayData.userEssay?.id === essayId
                  ? {
                      ...essayData,
                      userEssay: {
                        ...essayData.userEssay,
                        isCompleted: !currentStatus,
                      },
                    }
                  : essayData
              ),
            })),
          };

          // Recalculate stats immediately
          updated.stats = calculateStats(updated);
          
          return updated;
        });

        // Make API call
        const response = await fetch(`/api/essay/independent`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            essayId,
            isCompleted: !currentStatus,
          }),
        });

        if (!response.ok) {
          // Revert on error
          setWorkspaceData((prev) => {
            if (!prev) return prev;

            const updated = {
              ...prev,
              programs: prev.programs.map((program) => ({
                ...program,
                essays: program.essays.map((essayData) =>
                  essayData.userEssay?.id === essayId
                    ? {
                        ...essayData,
                        userEssay: {
                          ...essayData.userEssay,
                          isCompleted: currentStatus,
                        },
                      }
                    : essayData
                ),
              })),
            };

            updated.stats = calculateStats(updated);
            return updated;
          });

          throw new Error("Failed to update completion status");
        }
      } catch (error) {
        console.error("Error toggling completion:", error);
        setError(error.message);
      }
    },
    []
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Loading state
  if (loading || status === "loading") {
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
                Fetching essays from saved universities...
              </p>
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
            Error Loading Workspace
          </h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-[#3598FE] hover:bg-[#2563EB] shadow-md hover:shadow-lg active:scale-95"
          >
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  // No saved universities
  if (
    workspaceData &&
    (!workspaceData.universities || workspaceData.universities.length === 0)
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <Card className="p-8 bg-white/70 backdrop-blur-sm shadow-xl max-w-md text-center">
          <Building2 className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#002147] mb-2">
            No Saved Universities
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Save universities to start working on their essays
          </p>
          <Button
            onClick={() => router.push("/dashboard/search")}
            className="bg-[#3598FE] hover:bg-[#2563EB] shadow-md hover:shadow-lg active:scale-95"
          >
            Browse Universities
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      {/* Dynamic Header */}
      <header
        className="backdrop-blur-lg border-b sticky top-0 z-50 shadow-sm transition-all duration-300"
        style={{
          backgroundColor: currentUniversity
            ? `${currentUniversity.color}15`
            : "rgba(255, 255, 255, 0.8)",
          borderColor: currentUniversity?.color || "#e5e7eb",
        }}
      >
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105"
                style={{
                  background: currentUniversity
                    ? `linear-gradient(135deg, ${currentUniversity.color}, ${currentUniversity.color}CC)`
                    : "linear-gradient(135deg, #002147, #003366)",
                }}
              >
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#002147]">
                  {currentUniversity?.name || "Essay Workspace"}
                </h1>
                <p className="text-sm text-[#6C7280]">
                  {selectedUniversityId === "all"
                    ? `${
                        workspaceData?.universities?.length || 0
                      } universities • ${
                        workspaceData?.stats?.totalPrograms || 0
                      } programs`
                    : `${currentProgram?.name || "Select a program"}`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* University Selector */}
              <UniversitySelector
                universities={workspaceData?.universities}
                selectedUniversityId={selectedUniversityId}
                onSelect={setSelectedUniversityId}
                stats={enhancedStats}
              />

              {/* Word Count Display */}
              {currentEssay && (
                <div className="flex items-center space-x-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
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
                          className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-sm"
                          title="Unsaved changes"
                        />
                      ) : (
                        <div
                          className="w-2 h-2 bg-green-500 rounded-full shadow-sm"
                          title="Saved"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Toggle Buttons - FIXED UI */}
              <div className="flex items-center space-x-2">
                <Button
                  variant={showAnalytics ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    handlePanelToggle('analytics', showAnalytics);
                    setShowAnalytics(!showAnalytics);
                  }}
                  className={`
                    transition-all duration-200 font-medium shadow-sm
                    ${showAnalytics
                      ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-purple-200 hover:shadow-lg hover:scale-105 active:scale-95"
                      : "bg-white border-2 border-purple-500 text-purple-600 hover:bg-purple-50 hover:border-purple-600 hover:shadow-md active:scale-95"
                    }
                  `}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analytics
                </Button>

                <Button
                  variant={showAI ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    handlePanelToggle('ai', showAI);
                    setShowAI(!showAI);
                  }}
                  className={`
                    transition-all duration-200 font-medium shadow-sm
                    ${showAI
                      ? "bg-gradient-to-r from-[#3598FE] to-[#2563EB] text-white border-0 shadow-blue-200 hover:shadow-lg hover:scale-105 active:scale-95"
                      : "bg-white border-2 border-[#3598FE] text-[#3598FE] hover:bg-blue-50 hover:border-[#2563EB] hover:shadow-md active:scale-95"
                    }
                  `}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Assistant
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

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
                  <h3 className="font-bold text-[#002147]">
                    Programs & Essays
                  </h3>

                  {/* Status Filter */}
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

                {/* Programs List */}
                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
                  {filteredPrograms.map((program) => (
                    <ProgramCard
                      key={program.id}
                      program={program}
                      isExpanded={expandedPrograms.has(program.id)}
                      onToggle={() => toggleProgramExpansion(program.id)}
                      activeEssayPromptId={activeEssayPromptId}
                      onEssaySelect={handleEssaySelect}
                      onDeleteEssay={handleDeleteEssay}
                      onCreateEssay={handleCreateEssay}
                      onToggleCompletion={toggleEssayCompletion} // Pass the toggle function
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
        {/* Main Editor Area */}
<div className="col-span-12 lg:col-span-6">
  <Card className="min-h-[600px] shadow-xl border-0 bg-white/70 backdrop-blur-sm hover:shadow-2xl transition-shadow">
    <div className="p-6">
      {currentEssayData && currentEssay ? (
        <>
          {/* Essay Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 pr-4">
              <div className="flex items-center space-x-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full shadow-sm flex-shrink-0"
                  style={{
                    backgroundColor:
                      currentProgram?.universityColor || "#002147",
                  }}
                />
                <span className="text-xs text-gray-500">
                  {currentProgram?.universityName} •{" "}
                  {currentProgram?.name}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#002147]">
                {currentEssayData.promptTitle}
              </h2>
              
              {/* FIXED: Full prompt text without truncation */}
              <div className="mt-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700 font-medium mb-1">
                  Essay Prompt:
                </p>
                <p 
                  className="text-sm text-gray-700 leading-relaxed"
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflow: 'visible',
                  }}
                >
                  {currentEssayData.promptText}
                </p>
                <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                  <span>Word limit: {currentEssayData.wordLimit}</span>
                  {currentEssayData.isMandatory && (
                    <span className="text-red-600 font-medium">• Required</span>
                  )}
                </div>
              </div>
            </div>

            {/* Versions Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handlePanelToggle('versions', showVersions);
                setShowVersions(!showVersions);
              }}
              className={`
                transition-all duration-200 font-medium shadow-sm flex-shrink-0
                ${showVersions
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-blue-200 hover:shadow-lg hover:scale-105 active:scale-95"
                  : "bg-white border-2 border-[#3598FE] text-[#3598FE] hover:bg-blue-50 hover:border-[#2563EB] hover:shadow-md active:scale-95"
                }
              `}
            >
              <Clock className="w-4 h-4 mr-2" />
              Versions ({currentEssay.versions?.length || 0})
            </Button>
          </div>

          {/* Editor */}
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

          {/* Footer Actions */}
          <div className="mt-6 flex justify-between items-center">
            <div className="flex items-center space-x-4 text-xs text-[#6C7280]">
              <span>
                Last modified:{" "}
                {new Date(currentEssay.lastModified).toLocaleString()}
              </span>
              {lastSaved && (
                <span className="text-green-600">
                  Saved: {lastSaved.toLocaleTimeString()}
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
              className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700 hover:bg-green-100 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm"
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
      ) : currentEssayData && !currentEssay ? (
        /* Start Essay State - FIXED */
        <div className="h-full flex flex-col items-center justify-center py-16">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
            style={{
              backgroundColor: `${
                currentProgram?.universityColor || "#002147"
              }20`,
            }}
          >
            <FileText
              className="w-8 h-8"
              style={{
                color: currentProgram?.universityColor || "#002147",
              }}
            />
          </div>
          <h3 className="text-lg font-semibold text-[#002147] mb-4">
            {currentEssayData.promptTitle}
          </h3>
          
          {/* FIXED: Full prompt text without truncation */}
          <div className="w-full max-w-2xl px-4 mb-6">
            <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700 font-medium mb-2">
                Essay Prompt:
              </p>
              <p 
                className="text-sm text-gray-700 leading-relaxed"
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflow: 'visible',
                }}
              >
                {currentEssayData.promptText}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 text-xs text-gray-500 mb-6">
            <span>{currentEssayData.wordLimit} words max</span>
            {currentEssayData.isMandatory && (
              <>
                <span>•</span>
                <span className="text-red-600 font-medium">Required</span>
              </>
            )}
          </div>
          <Button
            onClick={() =>
              handleCreateEssay(
                currentProgram.id,
                currentEssayData.promptId
              )
            }
            disabled={isCreatingEssay}
            className="bg-[#3598FE] hover:bg-[#2563EB] shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
          >
            {isCreatingEssay ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Start Writing
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center py-16">
          <GraduationCap className="w-16 h-16 text-gray-300 mb-6" />
          <h3 className="text-lg font-semibold text-[#002147] mb-2">
            Select an Essay
          </h3>
          <p className="text-sm text-gray-600 text-center max-w-md">
            Choose a program and essay from the sidebar to start
            editing
          </p>
        </div>
      )}
    </div>
  </Card>
</div>

          {/* Right Sidebar - Panels in Order */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            {/* Render panels based on order */}
            {panelOrder.map((panelName) => {
              // Versions Panel
              if (panelName === 'versions' && showVersions && currentEssay) {
                return (
                  <VersionManager
                    key={`versions-${currentEssay.id}`}
                    versions={currentEssay.versions || []}
                    currentContent={currentEssay.content}
                    onRestoreVersion={async (versionId) => {
                      try {
                        setError(null);
                        const response = await fetch(`/api/essay/independent`, {
                          method: "POST",
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({
                            action: "restore_version",
                            essayId: currentEssay.id,
                            versionId,
                          }),
                        });

                        if (response.ok) {
                          const result = await response.json();
                          
                          // Update local state with restored content
                          if (result.essay) {
                            setWorkspaceData((prev) => {
                              if (!prev) return prev;

                              const updated = {
                                ...prev,
                                programs: prev.programs.map((program) =>
                                  program.id === activeProgramId
                                    ? {
                                        ...program,
                                        essays: program.essays.map((essayData) =>
                                          essayData.promptId === activeEssayPromptId
                                            ? {
                                                ...essayData,
                                                userEssay: result.essay,
                                              }
                                            : essayData
                                        ),
                                      }
                                    : program
                                ),
                              };

                              updated.stats = calculateStats(updated);
                              return updated;
                            });

                            lastContentRef.current = result.essay.content || "";
                          }

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
                        const response = await fetch(`/api/essay/independent`, {
                          method: "POST",
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({
                            action: "delete_version",
                            versionId,
                            essayId: currentEssay.id,
                          }),
                        });

                        if (response.ok) {
                          // Update local state to remove the version
                          setWorkspaceData((prev) => {
                            if (!prev) return prev;

                            const updated = {
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
                                                versions: essayData.userEssay?.versions?.filter(
                                                  (v) => v.id !== versionId
                                                ) || [],
                                              },
                                            }
                                          : essayData
                                      ),
                                    }
                                  : program
                              ),
                            };

                            updated.stats = calculateStats(updated);
                            return updated;
                          });
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
                    universityName={currentProgram?.universityName || "University"}
                    isLoading={loading}
                  />
                );
              }

              // Analytics Panel
              if (panelName === 'analytics' && showAnalytics && currentEssay) {
                return (
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
                    userId={session?.userId}
                    universityName={currentProgram?.universityName || "University"}
                  />
                );
              }

              // AI Panel
              if (panelName === 'ai' && showAI && currentEssay) {
                return (
                  <AISuggestions
                    key={`ai-${currentEssay.id}`}
                    content={currentEssay.content}
                    prompt={currentEssayData.promptText}
                    wordCount={currentEssay.wordCount}
                    wordLimit={currentEssayData.wordLimit}
                    essayId={currentEssay.id}
                    universityName={currentProgram?.universityName || "University"}
                  />
                );
              }

              return null;
            })}

            {/* Empty state for right sidebar */}
            {!currentEssay && (
              <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm p-6 hover:shadow-2xl transition-shadow">
                <div className="text-center">
                  <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">
                    AI Analysis & Versions
                  </h3>
                  <p className="text-xs text-gray-500">
                    Select an essay to view analytics, AI suggestions, and
                    version history
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200/50">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>
                {workspaceData?.universities?.length || 0}{" "}
                saved universities
              </span>
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