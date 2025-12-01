// src/app/workspace/independent/page.jsx

"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EssayEditor } from "../components/EssayEditor";
import { VersionManager } from "../components/VersionManager";
import { AISuggestions } from "../components/AiSuggestion";
import { EssayAnalytics } from "../components/EssayAnalytics";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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

// University Selector Component
function UniversitySelector({ universities, selectedUniversityId, onSelect, stats }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedUniversity = universities?.find(u => u.id === selectedUniversityId);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-all min-w-[250px]"
      >
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: selectedUniversity?.color || '#002147' }}
        >
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-[#002147] truncate">
            {selectedUniversityId === 'all' 
              ? 'All Universities' 
              : selectedUniversity?.name || 'Select University'}
          </p>
          <p className="text-xs text-gray-500">
            {selectedUniversityId === 'all' 
              ? `${universities?.length || 0} universities` 
              : `${selectedUniversity?.programCount || 0} programs`}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
                onSelect('all');
                setIsOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                selectedUniversityId === 'all' ? 'bg-blue-50' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-[#002147]">All Universities</p>
                <p className="text-xs text-gray-500">
                  {stats?.totalPrograms || 0} programs • {stats?.totalEssayPrompts || 0} essays
                </p>
              </div>
              {selectedUniversityId === 'all' && (
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
              )}
            </button>

            <div className="border-t border-gray-100" />

            {/* Individual Universities */}
            {universities?.map((university) => {
              const uniPrograms = stats?.programsByUniversity?.[university.id] || [];
              const uniEssayCount = uniPrograms.reduce((acc, p) => acc + (p.essays?.length || 0), 0);
              
              return (
                <button
                  key={university.id}
                  onClick={() => {
                    onSelect(university.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                    selectedUniversityId === university.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: university.color || '#002147' }}
                  >
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-[#002147]">{university.name}</p>
                    <p className="text-xs text-gray-500">
                      {university.programCount} programs • {uniEssayCount} essays
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

// Program Card Component
function ProgramCard({ program, isExpanded, onToggle, activeEssayPromptId, onEssaySelect, onDeleteEssay, onCreateEssay }) {
  const completedEssays = program.essays?.filter(e => e.userEssay?.isCompleted).length || 0;
  const totalEssays = program.essays?.length || 0;
  const progress = totalEssays > 0 ? (completedEssays / totalEssays) * 100 : 0;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Program Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div 
            className="w-2 h-10 rounded-full"
            style={{ backgroundColor: program.universityColor || '#002147' }}
          />
          <div className="text-left">
            <p className="text-sm font-semibold text-[#002147] line-clamp-1">
              {program.name}
            </p>
            <p className="text-xs text-gray-500">
              {program.universityName}
            </p>
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
        <div className="w-full bg-gray-100 rounded-full h-1">
          <div
            className="h-1 rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-green-500"
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
              className={`p-2 rounded-lg cursor-pointer transition-all ${
                activeEssayPromptId === essayData.promptId
                  ? "bg-blue-100 border border-blue-300"
                  : "bg-white hover:bg-gray-100 border border-transparent"
              }`}
              onClick={() => onEssaySelect(program.id, essayData.promptId)}
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
                        {essayData.userEssay?.wordCount || 0}/{essayData.wordLimit}
                      </span>
                      {essayData.isMandatory && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded">
                          Required
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {essayData.userEssay && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteEssay(essayData.userEssay.id);
                    }}
                    className="text-gray-400 hover:text-red-500 ml-2"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
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
    if (selectedUniversityId === 'all') {
      return {
        universities: universities?.length || 0,
        programs: stats?.totalPrograms || 0,
        essays: stats?.totalEssayPrompts || 0,
        completed: stats?.completedEssays || 0,
        words: stats?.totalWords || 0,
        progress: stats?.averageProgress || 0,
      };
    }

    const uniPrograms = stats?.programsByUniversity?.[selectedUniversityId] || [];
    const uniEssays = uniPrograms.reduce((acc, p) => acc + (p.essays?.length || 0), 0);
    const uniCompleted = uniPrograms.reduce((acc, p) => 
      acc + (p.essays?.filter(e => e.userEssay?.isCompleted).length || 0), 0
    );
    const uniWords = uniPrograms.reduce((acc, p) => 
      acc + (p.essays?.reduce((ea, e) => ea + (e.userEssay?.wordCount || 0), 0) || 0), 0
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
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200">
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-purple-500" />
          <span className="text-xs text-gray-500">Universities</span>
        </div>
        <p className="text-xl font-bold text-[#002147] mt-1">{displayStats.universities}</p>
      </div>

      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200">
        <div className="flex items-center space-x-2">
          <GraduationCap className="w-4 h-4 text-blue-500" />
          <span className="text-xs text-gray-500">Programs</span>
        </div>
        <p className="text-xl font-bold text-[#002147] mt-1">{displayStats.programs}</p>
      </div>

      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-green-500" />
          <span className="text-xs text-gray-500">Essays</span>
        </div>
        <p className="text-xl font-bold text-[#002147] mt-1">
          {displayStats.completed}/{displayStats.essays}
        </p>
      </div>

      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200">
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
  const [selectedUniversityId, setSelectedUniversityId] = useState('all');
  const [activeProgramId, setActiveProgramId] = useState(null);
  const [activeEssayPromptId, setActiveEssayPromptId] = useState(null);
  const [expandedPrograms, setExpandedPrograms] = useState(new Set());

  // UI state
  const [showVersions, setShowVersions] = useState(false);
  const [showAI, setShowAI] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // all, completed, in-progress, not-started

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

  // Enhanced stats with per-university grouping
  const enhancedStats = useMemo(() => {
    if (!workspaceData) return null;

    const programsByUniversity = {};
    workspaceData.programs?.forEach(program => {
      if (!programsByUniversity[program.universityId]) {
        programsByUniversity[program.universityId] = [];
      }
      programsByUniversity[program.universityId].push(program);
    });

    return {
      ...workspaceData.stats,
      programsByUniversity,
    };
  }, [workspaceData]);

  // Filtered programs based on selected university and status filter
  const filteredPrograms = useMemo(() => {
    if (!workspaceData?.programs) return [];

    let programs = workspaceData.programs;

    // Filter by university
    if (selectedUniversityId !== 'all') {
      programs = programs.filter(p => p.universityId === selectedUniversityId);
    }

    // Filter by essay status
    if (filterStatus !== 'all') {
      programs = programs.map(program => ({
        ...program,
        essays: program.essays?.filter(essay => {
          if (filterStatus === 'completed') return essay.userEssay?.isCompleted;
          if (filterStatus === 'in-progress') return essay.userEssay && !essay.userEssay.isCompleted;
          if (filterStatus === 'not-started') return !essay.userEssay;
          return true;
        }),
      })).filter(p => p.essays?.length > 0);
    }

    return programs;
  }, [workspaceData, selectedUniversityId, filterStatus]);

  // Current program and essay
  const currentProgram = useMemo(() => {
    return workspaceData?.programs?.find((p) => p.id === activeProgramId);
  }, [workspaceData, activeProgramId]);

  const currentEssayData = useMemo(() => {
    return currentProgram?.essays?.find((e) => e.promptId === activeEssayPromptId);
  }, [currentProgram, activeEssayPromptId]);

  const currentEssay = useMemo(() => {
    return currentEssayData?.userEssay;
  }, [currentEssayData]);

  // Current university for header
  const currentUniversity = useMemo(() => {
    if (selectedUniversityId === 'all') {
      return null;
    }
    return workspaceData?.universities?.find(u => u.id === selectedUniversityId);
  }, [workspaceData, selectedUniversityId]);

  // Fetch workspace data
  const fetchWorkspaceData = useCallback(async () => {
    if (status === "loading") return;

    if (status !== "authenticated") {
      setError("Please login to view your workspace");
      setLoading(false);
      router.push('/signin');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/essay/independent`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          router.push('/signin');
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
          lastContentRef.current = firstProgram.essays[0].userEssay?.content || "";
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
    if (!currentEssay || isSaving || !hasUnsavedChanges || isUpdatingRef.current) {
      return false;
    }

    try {
      setIsSaving(true);
      isUpdatingRef.current = true;

      const response = await fetch(`/api/essay/independent`, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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

  // Update essay content
  const updateEssayContent = useCallback(
    (content, wordCount) => {
      if (isUpdatingRef.current || !currentEssay) return;

      if (content === lastContentRef.current) return;

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

  // Handle essay selection
  const handleEssaySelect = useCallback((programId, promptId) => {
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
    setExpandedPrograms(prev => new Set([...prev, programId]));

    const program = workspaceData?.programs?.find(p => p.id === programId);
    const essayData = program?.essays?.find(e => e.promptId === promptId);
    lastContentRef.current = essayData?.userEssay?.content || "";
  }, [workspaceData]);

  // Toggle program expansion
  const toggleProgramExpansion = useCallback((programId) => {
    setExpandedPrograms(prev => {
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

  // Save version
  const saveVersion = useCallback(async (label) => {
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
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
  }, [currentEssay, isSaving, isSavingVersion, hasUnsavedChanges, autoSaveEssay, fetchWorkspaceData]);

  // Create essay
  const handleCreateEssay = async (programId, essayPromptId) => {
    try {
      setIsCreatingEssay(true);
      setError(null);

      const response = await fetch(`/api/essay/independent`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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

      await fetchWorkspaceData();
      handleEssaySelect(programId, essayPromptId);
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
      const response = await fetch(`/api/essay/independent`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: "delete_essay",
          essayId,
        }),
      });

      if (!response.ok) throw new Error("Failed to delete essay");

      await fetchWorkspaceData();

      if (currentEssay?.id === essayId) {
        setActiveEssayPromptId(null);
        lastContentRef.current = "";
      }
    } catch (error) {
      setError(error.message);
    }
  };

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
              <h3 className="text-lg font-semibold text-[#002147]">Loading Workspace</h3>
              <p className="text-sm text-[#6C7280]">Fetching essays from saved universities...</p>
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
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Workspace</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push("/dashboard")} className="bg-[#3598FE] hover:bg-[#2563EB]">
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  // No saved universities
  if (workspaceData && (!workspaceData.universities || workspaceData.universities.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <Card className="p-8 bg-white/70 backdrop-blur-sm shadow-xl max-w-md text-center">
          <Building2 className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#002147] mb-2">No Saved Universities</h3>
          <p className="text-sm text-gray-600 mb-4">
            Save universities to start working on their essays
          </p>
          <Button onClick={() => router.push("/dashboard/search")} className="bg-[#3598FE] hover:bg-[#2563EB]">
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
            : 'rgba(255, 255, 255, 0.8)',
          borderColor: currentUniversity?.color || '#e5e7eb',
        }}
      >
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300"
                style={{ 
                  background: currentUniversity 
                    ? `linear-gradient(135deg, ${currentUniversity.color}, ${currentUniversity.color}CC)`
                    : 'linear-gradient(135deg, #002147, #003366)'
                }}
              >
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#002147]">
                  {currentUniversity?.name || "Essay Workspace"}
                </h1>
                <p className="text-sm text-[#6C7280]">
                  {selectedUniversityId === 'all' 
                    ? `${workspaceData?.universities?.length || 0} universities • ${workspaceData?.stats?.totalPrograms || 0} programs`
                    : `${currentProgram?.name || 'Select a program'}`
                  }
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

              {/* Toggle Buttons */}
              <div className="flex items-center space-x-2">
                <Button
                  variant={showAnalytics ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className={showAnalytics
                    ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0"
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
                  className={showAI
                    ? "bg-gradient-to-r from-[#3598FE] to-[#2563EB] text-white border-0"
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

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Programs & Essays List */}
          <div className="col-span-12 lg:col-span-3">
            <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm sticky top-28">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#002147]">Programs & Essays</h3>
                  
                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="text-xs px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    />
                  ))}

                  {filteredPrograms.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        {filterStatus !== 'all' 
                          ? `No ${filterStatus.replace('-', ' ')} essays`
                          : 'No programs available'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Main Editor Area */}
          <div className="col-span-12 lg:col-span-6">
            <Card className="min-h-[600px] shadow-xl border-0 bg-white/70 backdrop-blur-sm">
              <div className="p-6">
                {currentEssayData && currentEssay ? (
                  <>
                    {/* Essay Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: currentProgram?.universityColor || '#002147' }}
                          />
                          <span className="text-xs text-gray-500">
                            {currentProgram?.universityName} • {currentProgram?.name}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-[#002147]">
                          {currentEssayData.promptTitle}
                        </h2>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {currentEssayData.promptText}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowVersions(!showVersions)}
                        className="border-[#3598FE] text-[#3598FE] hover:bg-[#3598FE] hover:text-white"
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
                        <span>Last modified: {new Date(currentEssay.lastModified).toLocaleString()}</span>
                        {lastSaved && (
                          <span className="text-green-600">
                            Saved: {lastSaved.toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => saveVersion(`Manual Save ${new Date().toLocaleTimeString()}`)}
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
                ) : currentEssayData && !currentEssay ? (
                  <div className="h-full flex flex-col items-center justify-center py-16">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                      style={{ backgroundColor: `${currentProgram?.universityColor || '#002147'}20` }}
                    >
                      <FileText 
                        className="w-8 h-8"
                        style={{ color: currentProgram?.universityColor || '#002147' }}
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-[#002147] mb-2">
                      Start This Essay
                    </h3>
                    <p className="text-sm text-gray-600 text-center max-w-md mb-6">
                      {currentEssayData.promptText}
                    </p>
                    <div className="flex items-center space-x-3 text-xs text-gray-500 mb-6">
                      <span>{currentEssayData.wordLimit} words max</span>
                      {currentEssayData.isMandatory && (
                        <>
                          <span>•</span>
                          <span className="text-red-600">Required</span>
                        </>
                      )}
                    </div>
                    <Button
                      onClick={() => handleCreateEssay(currentProgram.id, currentEssayData.promptId)}
                      disabled={isCreatingEssay}
                      className="bg-[#3598FE] hover:bg-[#2563EB]"
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
                      Choose a program and essay from the sidebar to start editing
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            {showVersions && currentEssay && (
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
                universityName={currentProgram?.universityName || "University"}
                isLoading={loading}
              />
            )}

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
                userId={session?.userId}
                universityName={currentProgram?.universityName || "University"}
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
                universityName={currentProgram?.universityName || "University"}
              />
            )}

            {/* Empty state for right sidebar */}
            {!currentEssay && (
              <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm p-6">
                <div className="text-center">
                  <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">
                    AI Analysis & Versions
                  </h3>
                  <p className="text-xs text-gray-500">
                    Select an essay to view analytics, AI suggestions, and version history
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
                {workspaceData?.stats?.savedUniversitiesCount || workspaceData?.universities?.length || 0} saved universities
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