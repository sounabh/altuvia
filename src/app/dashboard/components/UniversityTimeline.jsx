"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Calendar, Clock, CheckCircle2, AlertCircle, Award, ChevronDown, ChevronUp,
  Sparkles, Target, Loader2, BookOpen, Lightbulb, AlertTriangle, Check, Circle,
  RefreshCw, GraduationCap, FileText, Users, Send, ExternalLink, Info, Zap,
  MapPin, BarChart3, ClipboardList, Timer, Star, XCircle, Building2, TrendingUp,
  Flame, Trophy, Rocket, Flag
} from 'lucide-react';

// ✅ Updated Phase color configurations with brand colors
const PHASE_COLORS = {
  0: { // Phase 1: Research - Brand Blue/Navy
    bg: 'bg-[#EFF6FF]',
    border: 'border-[#BFDBFE]',
    headerBg: 'bg-[#002147]',
    icon: 'bg-[#DBEAFE] text-[#002147]',
    iconActive: 'bg-[#002147] text-white',
    progress: 'bg-[#002147]',
    badge: 'bg-[#DBEAFE] text-[#1E40AF] border-[#BFDBFE]',
    light: 'bg-[#EFF6FF]',
    accent: 'text-[#002147]',
    ring: 'ring-[#002147]'
  },
  1: { // Phase 2: Testing - Purple (secondary accent)
    bg: 'bg-[#F5F3FF]',
    border: 'border-[#DDD6FE]',
    headerBg: 'bg-[#5B21B6]',
    icon: 'bg-[#EDE9FE] text-[#5B21B6]',
    iconActive: 'bg-[#5B21B6] text-white',
    progress: 'bg-[#5B21B6]',
    badge: 'bg-[#EDE9FE] text-[#5B21B6] border-[#DDD6FE]',
    light: 'bg-[#F5F3FF]',
    accent: 'text-[#5B21B6]',
    ring: 'ring-[#5B21B6]'
  },
  2: { // Phase 3: Essays - Rose
    bg: 'bg-[#FDF2F8]',
    border: 'border-[#FBCFE8]',
    headerBg: 'bg-[#BE123C]',
    icon: 'bg-[#FCE7F3] text-[#BE123C]',
    iconActive: 'bg-[#BE123C] text-white',
    progress: 'bg-[#BE123C]',
    badge: 'bg-[#FCE7F3] text-[#BE123C] border-[#FBCFE8]',
    light: 'bg-[#FDF2F8]',
    accent: 'text-[#BE123C]',
    ring: 'ring-[#BE123C]'
  },
  3: { // Phase 4: Recommendations - Amber/Warning
    bg: 'bg-[#FFFBEB]',
    border: 'border-[#FDE68A]',
    headerBg: 'bg-[#D97706]',
    icon: 'bg-[#FEF3C7] text-[#D97706]',
    iconActive: 'bg-[#D97706] text-white',
    progress: 'bg-[#D97706]',
    badge: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
    light: 'bg-[#FFFBEB]',
    accent: 'text-[#D97706]',
    ring: 'ring-[#D97706]'
  },
  4: { // Phase 5: Submission - Green/Success
    bg: 'bg-[#ECFDF5]',
    border: 'border-[#A7F3D0]',
    headerBg: 'bg-[#047857]',
    icon: 'bg-[#D1FAE5] text-[#047857]',
    iconActive: 'bg-[#047857] text-white',
    progress: 'bg-[#047857]',
    badge: 'bg-[#D1FAE5] text-[#047857] border-[#A7F3D0]',
    light: 'bg-[#ECFDF5]',
    accent: 'text-[#047857]',
    ring: 'ring-[#047857]'
  }
};

const getPhaseColor = (index) => PHASE_COLORS[index % 5];

// ✅ Helper function to validate task ID is a proper CUID
const isValidTaskId = (id) => {
  return id && typeof id === 'string' && id.length >= 20;
};

const UniversityTimeline = ({ 
  universities, 
  stats, 
  userProfile,
  timelineCache,      // ✅ NEW: Receive cache from parent
  setTimelineCache    // ✅ NEW: Receive setter from parent
}) => {
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [generatingTimeline, setGeneratingTimeline] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState({});
  const [expandedTasks, setExpandedTasks] = useState({});
  const [savingTasks, setSavingTasks] = useState({});
  const [error, setError] = useState(null);
  const [loadingTimelines, setLoadingTimelines] = useState({});
  const [debugMode, setDebugMode] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [invalidTasksCount, setInvalidTasksCount] = useState(0);
  const [hoveredEventCard, setHoveredEventCard] = useState(null);
  const { data: session } = useSession();

  // ✅ NEW: Load timeline from cache when university changes
  useEffect(() => {
    if (selectedUniversity?.id && timelineCache[selectedUniversity.id]) {
      const cached = timelineCache[selectedUniversity.id];
      console.log('📦 Loading timeline from cache for:', selectedUniversity.universityName);
      setTimeline(cached.timeline);
      setMetadata(cached.metadata);
      setExpandedPhases(cached.expandedPhases || {});
      setExpandedTasks(cached.expandedTasks || {});
      setInvalidTasksCount(cached.invalidTasksCount || 0);
    }
  }, [selectedUniversity?.id, timelineCache]);

  // ✅ Helper function to get essay counts - Prioritizes fresh metadata from API
  const getEssayCounts = useCallback(() => {
    if (metadata && typeof metadata.essaysRequired === 'number') {
      return {
        completed: metadata.essaysCompleted ?? 0,
        total: metadata.essaysRequired ?? 0,
        remaining: metadata.essaysRemaining ?? 0,
        rate: metadata.essayCompletionRate ?? 0,
        notStarted: metadata.essaysNotStarted ?? 0
      };
    }

    if (selectedUniversity) {
      const completed = selectedUniversity.completedEssays ?? 0;
      const total = selectedUniversity.totalEssays ?? 0;

      if (total > 0) {
        return {
          completed: completed,
          total: total,
          remaining: Math.max(0, total - completed),
          rate: Math.round((completed / total) * 100),
          notStarted: Math.max(0, total - (selectedUniversity.startedEssays ?? completed))
        };
      }
    }

    return { completed: 0, total: 0, remaining: 0, rate: 0, notStarted: 0 };
  }, [metadata, selectedUniversity]);

  // ✅ Helper function to get test status with scores
  const getTestStatus = useCallback(() => {
    const testsNeeded = [];
    const testsCompleted = [];

    const requiresGMAT = selectedUniversity?.requiresGMAT || metadata?.requiresGMAT;
    const requiresGRE = selectedUniversity?.requiresGRE || metadata?.requiresGRE;
    const requiresIELTS = selectedUniversity?.requiresIELTS || metadata?.requiresIELTS;
    const requiresTOEFL = selectedUniversity?.requiresTOEFL || metadata?.requiresTOEFL;

    const hasGMAT = metadata?.userHasGMAT;
    const hasGRE = metadata?.userHasGRE;
    const hasIELTS = metadata?.userHasIELTS;
    const hasTOEFL = metadata?.userHasTOEFL;

    if (requiresGMAT) {
      if (hasGMAT) {
        testsCompleted.push({
          name: 'GMAT',
          score: metadata?.gmatScore,
          display: `GMAT${metadata?.gmatScore ? `: ${metadata.gmatScore}` : ''}`
        });
      } else {
        testsNeeded.push('GMAT');
      }
    }

    if (requiresGRE) {
      if (hasGRE) {
        testsCompleted.push({
          name: 'GRE',
          score: metadata?.greScore,
          display: `GRE${metadata?.greScore ? `: ${metadata.greScore}` : ''}`
        });
      } else {
        testsNeeded.push('GRE');
      }
    }

    if (requiresIELTS) {
      if (hasIELTS) {
        testsCompleted.push({
          name: 'IELTS',
          score: metadata?.ieltsScore,
          display: `IELTS${metadata?.ieltsScore ? `: ${metadata.ieltsScore}` : ''}`
        });
      } else {
        testsNeeded.push('IELTS');
      }
    }

    if (requiresTOEFL) {
      if (hasTOEFL) {
        testsCompleted.push({
          name: 'TOEFL',
          score: metadata?.toeflScore,
          display: `TOEFL${metadata?.toeflScore ? `: ${metadata.toeflScore}` : ''}`
        });
      } else {
        testsNeeded.push('TOEFL');
      }
    }

    const hasAnyRequirement = requiresGMAT || requiresGRE || requiresIELTS || requiresTOEFL;

    return {
      needed: testsNeeded,
      completed: testsCompleted,
      allComplete: testsNeeded.length === 0 && hasAnyRequirement,
      noRequirements: !hasAnyRequirement
    };
  }, [selectedUniversity, metadata]);

  // ✅ Helper function to get calendar event stats
  const getCalendarStats = useCallback(() => {
    return {
      total: metadata?.calendarEventsTotal ?? 0,
      completed: metadata?.calendarEventsCompleted ?? 0,
      pending: metadata?.calendarEventsPending ?? 0,
      overdue: metadata?.calendarEventsOverdue ?? 0,
      rate: metadata?.calendarEventsTotal > 0
        ? Math.round((metadata.calendarEventsCompleted / metadata.calendarEventsTotal) * 100)
        : 0
    };
  }, [metadata]);

  const getProgressStats = useCallback(() => {
    // Calculate essay progress from metadata
    const essayProgress = metadata?.essayCompletionRate ??
      (metadata?.essaysRequired > 0
        ? Math.round((metadata.essaysCompleted / metadata.essaysRequired) * 100)
        : 0);

    // Calculate event progress from metadata
    const eventProgress = metadata?.calendarEventsTotal > 0
      ? Math.round((metadata.calendarEventsCompleted / metadata.calendarEventsTotal) * 100)
      : 0;

    // Calculate test progress
    const testProgress = (() => {
      const testsNeeded = [];
      const testsCompleted = [];

      if (metadata?.requiresGMAT) {
        testsNeeded.push('GMAT');
        if (metadata?.userHasGMAT) testsCompleted.push('GMAT');
      }
      if (metadata?.requiresGRE) {
        testsNeeded.push('GRE');
        if (metadata?.userHasGRE) testsCompleted.push('GRE');
      }
      if (metadata?.requiresIELTS) {
        testsNeeded.push('IELTS');
        if (metadata?.userHasIELTS) testsCompleted.push('IELTS');
      }
      if (metadata?.requiresTOEFL) {
        testsNeeded.push('TOEFL');
        if (metadata?.userHasTOEFL) testsCompleted.push('TOEFL');
      }

      return testsNeeded.length > 0 
        ? Math.round((testsCompleted.length / testsNeeded.length) * 100)
        : 0;
    })();

    return {
      overall: metadata?.overallProgress ?? metadata?.currentProgress ?? 0,
      essays: essayProgress,
      events: eventProgress,
      tests: testProgress
    };
  }, [metadata]);

  // ✅ Count completed tasks from timeline (UPDATED: Use timeline state directly)
  const getTimelineTaskStats = useCallback(() => {
    if (!timeline?.phases) return { total: 0, completed: 0 };

    let total = 0;
    let completed = 0;

    timeline.phases.forEach((phase) => {
      phase.tasks?.forEach((task) => {
        total++;
        if (task.completed === true || task.status === 'completed') {
          completed++;
        }
      });
    });

    return { total, completed };
  }, [timeline]);

  // ✅ FIX 1: Only set first university as selected, DON'T auto-generate
  useEffect(() => {
    if (universities && universities.length > 0 && !selectedUniversity) {
      setSelectedUniversity(universities[0]);
    }
  }, [universities, selectedUniversity]);

  const calculateUniversityProgress = (uni) => {
    if (!uni) return 0;
    return uni.overallProgress || uni.stats?.applicationHealth?.overallProgress || 0;
  };

  // ✅ FIX 3: Fix generateTimeline function with abort controller
  const generateTimeline = useCallback(async (university, forceRegenerate = false) => {
    if (!university || !session?.token) return;

    if (abortController) {
      abortController.abort();
      console.log('🚫 Aborted previous timeline request');
    }

    const newAbortController = new AbortController();
    setAbortController(newAbortController);

    setGeneratingTimeline(true);
    setLoadingTimelines(prev => ({ ...prev, [university.id]: true }));
    setError(null);
    setInvalidTasksCount(0);

    setTimeline(null);
    setMetadata(null);
    setExpandedPhases({});
    setExpandedTasks({});

    try {
      const userId = session?.user?.id || session?.userId || session?.user?.sub;

      if (!userId) {
        throw new Error('User ID not found in session');
      }

      const enhancedUniversity = {
        id: university.id,
        name: university.universityName || university.name,
        universityName: university.universityName || university.name,
        location: university.location,
        programs: university.programs || [],
        deadlines: university.deadlines || [],
        admissionRequirements: university.admissionRequirements,
        requiresGMAT: university.requiresGMAT || false,
        requiresGRE: university.requiresGRE || false,
        requiresIELTS: university.requiresIELTS || false,
        requiresTOEFL: university.requiresTOEFL || false,
        ftGlobalRanking: university.ftGlobalRanking,
        acceptanceRate: university.acceptanceRate,
        tuitionFees: university.tuitionFees,
        websiteUrl: university.websiteUrl,
        images: university.images || []
      };

      console.log(`🎯 Fetching timeline for: ${university.id} - ${university.universityName}`);

      const response = await fetch('/api/generate-timeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        },
        body: JSON.stringify({
          university: enhancedUniversity,
          userProfile: userProfile || {},
          userId: userId,
          forceRegenerate: forceRegenerate
        }),
        signal: newAbortController.signal
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to generate timeline');
      }

      if (data.success && data.timeline) {
        console.log(`✅ Timeline loaded for: ${university.id}`);

        setTimeline(data.timeline);
        setMetadata(data.metadata || null);

        console.log('📊 Timeline Data Sync Check:', {
          essaysFromMetadata: data.metadata?.essaysCompleted,
          essaysTotal: data.metadata?.essaysRequired,
          tasksSynced: data.metadata?.tasksSynced,
          fromDatabase: data.metadata?.fromDatabase
        });

        const initialExpanded = {};
        data.timeline.phases?.forEach((phase, idx) => {
          if (phase.status === 'in-progress' || idx === 0) {
            initialExpanded[idx] = true;
          }
        });
        setExpandedPhases(initialExpanded);

        // ✅ FIX: Validate tasks and count invalid IDs
        const invalidTasks = [];
        let validTaskCount = 0;
        let completedCount = 0;

        data.timeline.phases?.forEach((phase, phaseIdx) => {
          phase.tasks?.forEach((task, taskIdx) => {
            if (!isValidTaskId(task.id)) {
              invalidTasks.push({ 
                phaseIdx, 
                taskIdx, 
                title: task.title?.substring(0, 40),
                id: task.id,
                idType: typeof task.id
              });
              console.warn(`⚠️ Task missing valid ID: Phase ${phaseIdx + 1}, Task ${taskIdx + 1} - "${task.title?.substring(0, 30)}"`);
            }

            if (isValidTaskId(task.id)) {
              validTaskCount++;
            }

            // Count completed tasks from timeline data
            if (task.completed === true || task.status === 'completed') {
              completedCount++;
            }
          });
        });

        // ✅ Track invalid tasks count for UI warning
        if (invalidTasks.length > 0) {
          setInvalidTasksCount(invalidTasks.length);
          console.warn(`⚠️ ${invalidTasks.length} tasks have invalid IDs:`, invalidTasks);
          
          // Only show error if ALL tasks are invalid (timeline wasn't saved to DB)
          if (validTaskCount === 0 && data.timeline.phases?.length > 0) {
            setError(`Timeline tasks don't have database IDs. Task completion cannot be saved. Please regenerate the timeline.`);
          }
        }

        console.log('✅ Task Completion Initialized:', {
          university: university.universityName,
          totalCompletedTasks: completedCount,
          validTasks: validTaskCount,
          invalidTasks: invalidTasks.length,
          essaysCompleted: data.metadata?.essaysCompleted,
          eventsCompleted: data.metadata?.calendarEventsCompleted
        });
        
        // ✅ NEW: Save to parent cache
        setTimelineCache(prev => ({
          ...prev,
          [university.id]: {
            timeline: data.timeline,
            metadata: data.metadata || null,
            expandedPhases: initialExpanded,
            expandedTasks: {},
            invalidTasksCount: invalidTasks.length,
            cachedAt: new Date().toISOString()
          }
        }));
        console.log('💾 Timeline cached in parent for:', university.universityName);
      } else {
        throw new Error(data.error || 'Failed to generate timeline');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('⏸️ Request aborted');
        return;
      }

      console.error('Error generating timeline:', err);
      setError(err.message || 'Failed to generate timeline. Please try again.');
    } finally {
      setGeneratingTimeline(false);
      setLoadingTimelines(prev => ({ ...prev, [university.id]: false }));
      setAbortController(null);
    }
  }, [session, userProfile, setTimelineCache]);

  const togglePhase = (phaseIndex) => {
    setExpandedPhases(prev => {
      const newExpanded = {
        ...prev,
        [phaseIndex]: !prev[phaseIndex]
      };
      
      // ✅ NEW: Update parent cache
      if (selectedUniversity?.id && timelineCache[selectedUniversity.id]) {
        setTimelineCache(prevCache => ({
          ...prevCache,
          [selectedUniversity.id]: {
            ...prevCache[selectedUniversity.id],
            expandedPhases: newExpanded
          }
        }));
      }
      
      return newExpanded;
    });
  };

  const toggleTask = (phaseIndex, taskIndex) => {
    const key = `${phaseIndex}-${taskIndex}`;
    setExpandedTasks(prev => {
      const newExpanded = {
        ...prev,
        [key]: !prev[key]
      };
      
      // ✅ NEW: Update parent cache
      if (selectedUniversity?.id && timelineCache[selectedUniversity.id]) {
        setTimelineCache(prevCache => ({
          ...prevCache,
          [selectedUniversity.id]: {
            ...prevCache[selectedUniversity.id],
            expandedTasks: newExpanded
          }
        }));
      }
      
      return newExpanded;
    });
  };

  // ✅ CRITICAL FIX: Updated toggleTaskComplete function to use timeline state directly
  const toggleTaskComplete = async (phaseIndex, taskIndex) => {
    const task = timeline?.phases?.[phaseIndex]?.tasks?.[taskIndex];

    if (!task) {
      console.error('❌ Task not found');
      setError('Task not found');
      return;
    }

    if (!session?.token) {
      console.error('❌ No session token');
      setError('Please log in to save changes');
      return;
    }

    const taskId = task.id;

    // ✅ Validate ID is a proper CUID string (at least 20 characters)
    if (!isValidTaskId(taskId)) {
      console.error('❌ Invalid task ID:', {
        id: taskId,
        type: typeof taskId,
        length: taskId?.length,
        taskNumber: task.taskNumber,
        title: task.title?.substring(0, 40)
      });

      // ✅ Show user-friendly error
      setError('Cannot save task: Invalid task ID. Please click "Regenerate" to fix this issue.');
      setTimeout(() => setError(null), 8000);
      return;
    }

    const newCompletedState = !task.completed;
    const taskKey = `${phaseIndex}-${taskIndex}`;

    // Mark as saving
    setSavingTasks(prev => ({ ...prev, [taskKey]: true }));

    // ✅ CRITICAL: Update timeline state immediately for UI (single source of truth)
    setTimeline(prevTimeline => {
      const newTimeline = JSON.parse(JSON.stringify(prevTimeline));
      const targetTask = newTimeline.phases[phaseIndex].tasks[taskIndex];
      targetTask.completed = newCompletedState;
      targetTask.status = newCompletedState ? 'completed' : 'pending';
      
      // ✅ FIX: Update parent cache with the NEW timeline immediately
      if (selectedUniversity?.id && timelineCache[selectedUniversity.id]) {
        setTimelineCache(prev => ({
          ...prev,
          [selectedUniversity.id]: {
            ...prev[selectedUniversity.id],
            timeline: newTimeline, // ✅ Use newTimeline instead of stale timeline
            metadata: metadata,
            expandedPhases: expandedPhases,
            expandedTasks: expandedTasks,
            cachedAt: new Date().toISOString()
          }
        }));
      }
      
      return newTimeline;
    });

    try {
      const userId = session?.user?.id || session?.userId || session?.user?.sub;

      if (!userId) {
        throw new Error('User ID not found');
      }

      console.log('💾 Saving task completion:', {
        taskId: taskId,
        title: task.title?.substring(0, 40),
        newState: newCompletedState
      });

      // ✅ Save to database with validated CUID
      const response = await fetch('/api/update-task-completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        },
        body: JSON.stringify({
          taskId: taskId,
          isCompleted: newCompletedState,
          userId: userId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update task');
      }

      console.log('✅ Task completion saved to database:', {
        taskId,
        title: task.title?.substring(0, 40),
        isCompleted: newCompletedState,
        newProgress: data.newProgress
      });

      // Update metadata with new progress if returned
      if (data.newProgress !== undefined) {
        setMetadata(prev => ({
          ...prev,
          currentProgress: data.newProgress,
          overallProgress: data.newProgress
        }));
      }
      
    
    } catch (error) {
      console.error('❌ Failed to save task completion:', error);

      // ✅ Revert optimistic update on error
      setTimeline(prevTimeline => {
        const newTimeline = JSON.parse(JSON.stringify(prevTimeline));
        const targetTask = newTimeline.phases[phaseIndex].tasks[taskIndex];
        targetTask.completed = !newCompletedState;
        targetTask.status = !newCompletedState ? 'completed' : 'pending';
        return newTimeline;
      });

      // Show error to user
      setError(`Failed to save: ${error.message}`);
      setTimeout(() => setError(null), 5000);

    } finally {
      // Remove saving state
      setSavingTasks(prev => {
        const newState = { ...prev };
        delete newState[taskKey];
        return newState;
      });
    }
  };

  // ✅ FIX 4: Fix handleUniversityChange - Don't auto-generate
  const handleUniversityChange = (university) => {
    console.log(`🔄 User selected: ${university.id} - ${university.universityName}`);

    if (abortController) {
      abortController.abort();
    }

    setSelectedUniversity(university);
    
    // ✅ NEW: Check if timeline exists in parent cache
    if (timelineCache[university.id]) {
      console.log('📦 Loading from parent cache, skipping state reset');
      // Timeline will be loaded by the useEffect hook
    } else {
      // Only reset if no cache exists
      setTimeline(null);
      setMetadata(null);
      setExpandedTasks({});
      setExpandedPhases({});
      setError(null);
      setInvalidTasksCount(0);
    }
  };

  const handleRegenerate = () => {
    if (selectedUniversity) {
      // ✅ NEW: Clear parent cache for this university
      setTimelineCache(prev => {
        const newCache = { ...prev };
        delete newCache[selectedUniversity.id];
        return newCache;
      });
      console.log('🗑️ Parent cache cleared for regeneration');
      
      generateTimeline(selectedUniversity, true);
    }
  };

  const getStatusColor = (status, phaseIndex = 0) => {
    const colors = getPhaseColor(phaseIndex);
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'in-progress': return `${colors.badge}`;
      case 'upcoming': return 'bg-gray-100 text-gray-600 border-gray-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-[#BE123C] bg-rose-50 border-rose-200';
      case 'critical': return 'text-[#BE123C] bg-rose-100 border-rose-300 font-bold';
      case 'medium': return 'text-[#D97706] bg-amber-50 border-amber-200';
      case 'low': return 'text-[#047857] bg-emerald-50 border-emerald-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return <Zap className="w-3 h-3" />;
      case 'high': return <Flame className="w-3 h-3" />;
      case 'medium': return <Clock className="w-3 h-3" />;
      case 'low': return <Circle className="w-3 h-3" />;
      default: return null;
    }
  };

  const getPhaseIcon = (phaseIndex) => {
    const icons = [
      <Target key="target" className="w-6 h-6" />,
      <GraduationCap key="grad" className="w-6 h-6" />,
      <FileText key="file" className="w-6 h-6" />,
      <Users key="users" className="w-6 h-6" />,
      <Rocket key="rocket" className="w-6 h-6" />
    ];
    return icons[phaseIndex] || <Circle className="w-6 h-6" />;
  };

  // ✅ UPDATED: Calculate phase progress using timeline state directly
  const calculatePhaseProgress = (phase, phaseIndex) => {
    if (!phase.tasks || phase.tasks.length === 0) return 0;
    const completed = phase.tasks.filter(task =>
      task.completed === true || task.status === 'completed'
    ).length;
    return Math.round((completed / phase.tasks.length) * 100);
  };

  // ✅ UPDATED: Calculate overall progress using timeline state directly
  const calculateOverallProgress = () => {
    if (!timeline?.phases) return metadata?.currentProgress || metadata?.overallProgress || 0;

    let totalTasks = 0;
    let completedCount = 0;

    timeline.phases.forEach((phase) => {
      if (phase.tasks) {
        totalTasks += phase.tasks.length;
        completedCount += phase.tasks.filter(task => 
          task.completed === true || task.status === 'completed'
        ).length;
      }
    });

    return totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDeadlineUrgency = (daysUntilDeadline) => {
    if (daysUntilDeadline <= 0) return { color: 'text-[#BE123C]', label: 'Passed', bg: 'bg-rose-50', border: 'border-rose-200' };
    if (daysUntilDeadline <= 14) return { color: 'text-[#BE123C]', label: 'Urgent', bg: 'bg-rose-50', border: 'border-rose-200' };
    if (daysUntilDeadline <= 30) return { color: 'text-[#D97706]', label: 'Soon', bg: 'bg-amber-50', border: 'border-amber-200' };
    if (daysUntilDeadline <= 60) return { color: 'text-[#D97706]', label: 'Approaching', bg: 'bg-amber-50', border: 'border-amber-200' };
    return { color: 'text-[#047857]', label: 'On Track', bg: 'bg-emerald-50', border: 'border-emerald-200' };
  };

  // Get computed values
  const essayCounts = getEssayCounts();
  const testStatus = getTestStatus();
  const calendarStats = getCalendarStats();
  const progressStats = getProgressStats();
  const taskStats = getTimelineTaskStats();

  // ✅ UPDATED: Helper to check if task is completed (from timeline state)
  const isTaskCompleted = (phaseIndex, taskIndex) => {
    return timeline?.phases?.[phaseIndex]?.tasks?.[taskIndex]?.completed === true;
  };

  // ✅ UPDATED: Helper to get completed tasks count per phase
  const getCompletedTasksCount = (phase) => {
    if (!phase.tasks) return 0;
    return phase.tasks.filter(task => task.completed === true || task.status === 'completed').length;
  };

  // Empty state
  if (!universities || universities.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <div className="w-20 h-20 bg-[#EFF6FF] rounded-full flex items-center justify-center mx-auto mb-6">
          <Calendar className="w-10 h-10 text-[#002147]" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">No Universities Saved</h3>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          Save universities to your profile to generate personalized AI-powered application timelines
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ✅ Error Toast Notification */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-[#BE123C] text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top max-w-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-2 hover:bg-rose-700 rounded-lg p-1 transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ✅ NEW: Invalid Tasks Warning Banner */}
      {invalidTasksCount > 0 && timeline && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-800">
                {invalidTasksCount} task{invalidTasksCount > 1 ? 's have' : ' has'} invalid ID{invalidTasksCount > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-amber-700">
                Task completion for these items won't be saved. Click Regenerate to fix.
              </p>
            </div>
          </div>
          <button onClick={handleRegenerate} disabled={generatingTimeline} className="px-4 py-2 bg-[#D97706] text-white rounded-lg hover:bg-[#B45309] transition-colors font-medium flex items-center gap-2 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${generatingTimeline ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
        </div>
      )}

      {/* ✅ UPDATED: Header Section - Clean Minimalist Design */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <Sparkles className="w-5 h-5 text-[#002147]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">AI Application Timeline</h1>
              <p className="text-sm text-gray-600">
                Personalized step-by-step guide
              </p>
            </div>
          </div>
          {timeline && (
            <button
              onClick={handleRegenerate}
              disabled={generatingTimeline}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-gray-700"
            >
              <RefreshCw className={`w-4 h-4 ${generatingTimeline ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          )}
        </div>
      </div>

      {/* ✅ UPDATED: University Selector - Stats Overview Style */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Select University</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
            {universities.length} saved
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {universities.map((uni) => {
            const isSelected = selectedUniversity?.id === uni.id;
            const progress = calculateUniversityProgress(uni);

            return (
              <button
                key={uni.id}
                onClick={() => handleUniversityChange(uni)}
                disabled={generatingTimeline}
                className={`relative overflow-hidden rounded-xl border transition-all duration-300 disabled:opacity-50 text-left ${
                  isSelected
                    ? 'border-[#002147] bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-[#002147]'
                }`}
              >
                <div className="p-5 flex flex-col h-full justify-between">
                  <div className="flex justify-between items-start mb-4">
                    {/* University Logo/Icon */}
                    <div className={`p-2.5 rounded-xl ${
                      isSelected ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {uni.images?.[0]?.imageUrl ? (
                        <img
                          src={uni.images[0].imageUrl}
                          alt={uni.images[0].imageAltText || uni.universityName}
                          className="w-5 h-5 rounded object-cover"
                        />
                      ) : (
                        <Building2 className={`w-5 h-5 ${isSelected ? 'text-[#002147]' : 'text-gray-500'}`} />
                      )}
                    </div>
                    
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-[#002147]" />
                    )}
                  </div>
                  
                  <div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {progress}%
                    </div>
                    <div className="text-sm font-semibold text-gray-900 tracking-tight mb-1">
                      {uni.universityName || uni.name}
                    </div>
                    <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {uni.location}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              isSelected 
                                ? 'bg-[#002147]'
                                : 'bg-gray-400'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ✅ Generate Timeline Button */}
        {selectedUniversity && !timeline && !generatingTimeline && (
          <div className="flex justify-center">
            <button
              onClick={() => generateTimeline(selectedUniversity)}
              disabled={generatingTimeline}
              className="px-6 py-3 bg-[#002147] text-white rounded-lg hover:bg-[#001122] transition-all font-semibold inline-flex items-center justify-center gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              Generate Timeline for {selectedUniversity.universityName || selectedUniversity.name}
            </button>
          </div>
        )}
      </div>

      {/* Timeline Content */}
      {generatingTimeline ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 bg-[#DBEAFE] rounded-full animate-ping opacity-50" />
            <div className="absolute inset-2 bg-[#BFDBFE] rounded-full animate-pulse" />
            <div className="relative w-24 h-24 bg-[#002147] rounded-full flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Generating Your Timeline</h3>
          <p className="text-gray-600 max-w-lg mx-auto mb-6">
            AI is analyzing <strong className="text-[#002147]">{selectedUniversity?.universityName || selectedUniversity?.name}</strong>'s
            requirements and your profile...
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Analyzing
            </span>
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#002147]" />
              Creating phases
            </span>
            <span className="flex items-center gap-2">
              <Circle className="w-5 h-5 text-gray-300" />
              Building tasks
            </span>
          </div>
        </div>
      ) : error && !timeline ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-10 text-center">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-[#BE123C]" />
          </div>
          <h3 className="text-2xl font-bold text-rose-900 mb-3">Error Generating Timeline</h3>
          <p className="text-rose-700 mb-8 max-w-md mx-auto">{error}</p>
          <button onClick={handleRegenerate} className="px-8 py-3 bg-[#BE123C] text-white rounded-xl hover:bg-[#9F1239] transition-colors font-semibold inline-flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        </div>
      ) : timeline ? (
        <div className="space-y-6">
          {/* Stats Cards - Enhanced */}
          {(metadata || selectedUniversity) && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Deadline Card - PROPERLY FIXED */}
              <div className={`bg-white rounded-xl shadow-sm border-2 p-5 transition-all hover:shadow-md border-gray-200 relative group`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-amber-100">
                    <Timer className="w-5 h-5 text-[#D97706]" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Deadlines</span>
                </div>
                
                {(() => {
                  // ============================================
                  // PROPERLY FIXED DEADLINE PARSER
                  // ============================================
                  
                  const parseAllDeadlines = () => {
                    const deadlines = [];
                    
                    // Get the raw string
                    let deadlineString = '';
                    
                    if (Array.isArray(selectedUniversity?.roundDeadlines) && selectedUniversity.roundDeadlines.length > 0) {
                      deadlineString = selectedUniversity.roundDeadlines.join('; ');
                    } else if (typeof selectedUniversity?.averageDeadlines === 'string') {
                      deadlineString = selectedUniversity.averageDeadlines.trim();
                    }
                    
                    if (!deadlineString) return deadlines;
                    
                    console.log('Original deadline string:', deadlineString);
                    
                    // ============================================
                    // STEP 1: Split by "Round" keyword using lookahead
                    // This splits BEFORE each "Round" but keeps "Round" in the result
                    // ============================================
                    const segments = deadlineString
                      .split(/(?=Round\s*\d+)/gi)
                      .map(s => s.trim())
                      .filter(Boolean);
                    
                    console.log('Segments after split:', segments);
                    
                    // ============================================
                    // STEP 2: Parse each segment
                    // ============================================
                    segments.forEach((segment, idx) => {
                      // Clean up trailing punctuation
                      segment = segment.replace(/[,;|]+$/, '').trim();
                      
                      // Extract round name and date
                      // Pattern: "Round 1 : (September 3, 2025)" or "Round 1: September 3, 2025"
                      const colonIndex = segment.indexOf(':');
                      
                      let roundName = `Round ${idx + 1}`;
                      let dateStr = segment;
                      
                      if (colonIndex !== -1) {
                        roundName = segment.substring(0, colonIndex).trim();
                        dateStr = segment.substring(colonIndex + 1).trim();
                      }
                      
                      // Clean up date string - remove parentheses, periods, extra spaces
                      dateStr = dateStr
                        .replace(/[()]/g, '')  // Remove parentheses
                        .replace(/\./g, '')     // Remove periods
                        .replace(/\s+/g, ' ')   // Normalize spaces
                        .trim();
                      
                      console.log(`Segment ${idx}: Round="${roundName}", DateStr="${dateStr}"`);
                      
                      // ============================================
                      // STEP 3: Parse the date
                      // ============================================
                      const parseDate = (str) => {
                        if (!str) return { date: null, isMonthYearOnly: false };
                        
                        const months = {
                          'january': 0, 'jan': 0,
                          'february': 1, 'feb': 1,
                          'march': 2, 'mar': 2,
                          'april': 3, 'apr': 3,
                          'may': 4,
                          'june': 5, 'jun': 5,
                          'july': 6, 'jul': 6,
                          'august': 7, 'aug': 7,
                          'september': 8, 'sep': 8, 'sept': 8,
                          'october': 9, 'oct': 9,
                          'november': 10, 'nov': 10,
                          'december': 11, 'dec': 11
                        };
                        
                        let match;
                        
                        // Format: "September 3, 2025" or "September 3 2025"
                        match = str.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})$/i);
                        if (match) {
                          const monthNum = months[match[1].toLowerCase()];
                          if (monthNum !== undefined) {
                            return {
                              date: new Date(parseInt(match[3]), monthNum, parseInt(match[2])),
                              isMonthYearOnly: false
                            };
                          }
                        }
                        
                        // Format: "3 September, 2025" or "3 September 2025"
                        match = str.match(/^(\d{1,2})\s+([A-Za-z]+),?\s*(\d{4})$/i);
                        if (match) {
                          const monthNum = months[match[2].toLowerCase()];
                          if (monthNum !== undefined) {
                            return {
                              date: new Date(parseInt(match[3]), monthNum, parseInt(match[1])),
                              isMonthYearOnly: false
                            };
                          }
                        }
                        
                        // Format: "September 2025" (month year only)
                        match = str.match(/^([A-Za-z]+)\s+(\d{4})$/i);
                        if (match) {
                          const monthNum = months[match[1].toLowerCase()];
                          if (monthNum !== undefined) {
                            return {
                              date: new Date(parseInt(match[2]), monthNum, 1),
                              isMonthYearOnly: true
                            };
                          }
                        }
                        
                        // Format: "September 3" (no year - use current/next year)
                        match = str.match(/^([A-Za-z]+)\s+(\d{1,2})$/i);
                        if (match) {
                          const monthNum = months[match[1].toLowerCase()];
                          if (monthNum !== undefined) {
                            const now = new Date();
                            let year = now.getFullYear();
                            const testDate = new Date(year, monthNum, parseInt(match[2]));
                            if (testDate < now) {
                              year++;
                            }
                            return {
                              date: new Date(year, monthNum, parseInt(match[2])),
                              isMonthYearOnly: false
                            };
                          }
                        }
                        
                        // Format: "3 September" (no year)
                        match = str.match(/^(\d{1,2})\s+([A-Za-z]+)$/i);
                        if (match) {
                          const monthNum = months[match[2].toLowerCase()];
                          if (monthNum !== undefined) {
                            const now = new Date();
                            let year = now.getFullYear();
                            const testDate = new Date(year, monthNum, parseInt(match[1]));
                            if (testDate < now) {
                              year++;
                            }
                            return {
                              date: new Date(year, monthNum, parseInt(match[1])),
                              isMonthYearOnly: false
                            };
                          }
                        }
                        
                        // Fallback: try native Date parsing
                        const fallback = new Date(str);
                        if (!isNaN(fallback.getTime())) {
                          return { date: fallback, isMonthYearOnly: false };
                        }
                        
                        return { date: null, isMonthYearOnly: false };
                      };
                      
                      const { date, isMonthYearOnly } = parseDate(dateStr);
                      
                      console.log(`Parsed date for ${roundName}:`, date);
                      
                      deadlines.push({
                        round: roundName,
                        date: date,
                        dateString: dateStr,
                        isMonthYearOnly: isMonthYearOnly,
                        parseError: date === null
                      });
                    });
                    
                    return deadlines;
                  };
                  
                  // ============================================
                  // MAIN RENDER LOGIC
                  // ============================================
                  
                  const allDeadlines = parseAllDeadlines();
                  
                  console.log('Final deadlines:', allDeadlines);
                  
                  if (allDeadlines.length === 0) {
                    return <div className="text-gray-400 text-sm">No deadline set</div>;
                  }
                  
                  // Sort by date (null dates go to the end)
                  allDeadlines.sort((a, b) => {
                    if (!a.date && !b.date) return 0;
                    if (!a.date) return 1;
                    if (!b.date) return -1;
                    return a.date - b.date;
                  });
                  
                  const now = new Date();
                  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  
                  // Find next upcoming deadline
                  const nextUpcomingIndex = allDeadlines.findIndex(d => d.date && d.date >= todayStart);
                  const nextDeadline = nextUpcomingIndex >= 0 ? allDeadlines[nextUpcomingIndex] : allDeadlines[0];
                  
                  // Helper functions
                  const getDaysUntil = (date) => {
                    if (!date) return null;
                    return Math.ceil((date - now) / (1000 * 60 * 60 * 24));
                  };
                  
                  const formatDate = (deadline) => {
                    if (!deadline.date) return deadline.dateString || 'Date TBD';
                    
                    const options = deadline.isMonthYearOnly 
                      ? { month: 'long', year: 'numeric' }
                      : { month: 'long', day: 'numeric', year: 'numeric' };
                    
                    return deadline.date.toLocaleDateString('en-US', options);
                  };
                  
                  const formatDateShort = (deadline) => {
                    if (!deadline.date) return deadline.dateString || 'TBD';
                    
                    const options = deadline.isMonthYearOnly 
                      ? { month: 'short', year: 'numeric' }
                      : { month: 'short', day: 'numeric', year: 'numeric' };
                    
                    return deadline.date.toLocaleDateString('en-US', options);
                  };
                  
                  const daysUntil = getDaysUntil(nextDeadline?.date);
                  const isPast = daysUntil !== null && daysUntil < 0;
                  const isToday = daysUntil === 0;
                  
                  return (
                    <>
                      <div className="text-xs text-gray-500 mb-1">
                        {nextDeadline.round}
                        {isPast && <span className="ml-2 text-gray-400">(Passed)</span>}
                      </div>
                      <div className={`text-lg font-bold ${isPast ? 'text-gray-400' : 'text-gray-900'}`}>
                        {formatDate(nextDeadline)}
                      </div>
                      {daysUntil !== null && (
                        <div className={`text-sm mt-1 font-semibold flex items-center gap-1 ${
                          isPast ? 'text-gray-400' :
                          isToday ? 'text-rose-600' :
                          daysUntil <= 14 ? 'text-rose-600' : 
                          daysUntil <= 30 ? 'text-amber-600' : 'text-gray-600'
                        }`}>
                          {!isPast && daysUntil <= 14 && daysUntil > 0 && <AlertCircle className="w-4 h-4" />}
                          {isToday ? 'Today!' : 
                          isPast ? `${Math.abs(daysUntil)} days ago` : 
                          `${daysUntil} days left`}
                        </div>
                      )}
                      {allDeadlines.length > 1 && (
                        <div className="text-xs text-gray-500 mt-2">
                          +{allDeadlines.length - 1} more round{allDeadlines.length > 2 ? 's' : ''}
                        </div>
                      )}

                      {/* Hover Tooltip */}
                      <div className="absolute z-50 top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-2xl border-2 border-[#D97706] p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                            <span className="text-sm font-bold text-gray-900">All Deadlines</span>
                            <span className="text-xs font-semibold text-[#D97706] bg-amber-100 px-2 py-1 rounded-full">
                              {allDeadlines.length} round{allDeadlines.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {allDeadlines.map((deadline, idx) => {
                              const daysUntilThis = getDaysUntil(deadline.date);
                              const isThisPast = daysUntilThis !== null && daysUntilThis < 0;
                              const isThisNext = nextUpcomingIndex === idx;
                              
                              return (
                                <div 
                                  key={idx} 
                                  className={`text-xs p-3 rounded-lg border transition-colors ${
                                    isThisNext 
                                      ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200' 
                                      : isThisPast 
                                        ? 'bg-gray-50 border-gray-200 opacity-60' 
                                        : 'bg-gray-50 border-gray-200 hover:bg-amber-50'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-gray-700">{deadline.round}</span>
                                    {isThisNext && (
                                      <span className="text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                                        Next
                                      </span>
                                    )}
                                    {isThisPast && (
                                      <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">
                                        Passed
                                      </span>
                                    )}
                                  </div>
                                  <div className={`mb-1 ${isThisPast ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {formatDateShort(deadline)}
                                    {deadline.isMonthYearOnly && (
                                      <span className="text-gray-400 ml-1">(Month only)</span>
                                    )}
                                  </div>
                                  {daysUntilThis !== null && (
                                    <div className={`text-xs font-medium ${
                                      isThisPast ? 'text-gray-400' :
                                      daysUntilThis === 0 ? 'text-rose-600' :
                                      daysUntilThis <= 14 ? 'text-rose-600' : 
                                      daysUntilThis <= 30 ? 'text-amber-600' : 'text-gray-500'
                                    }`}>
                                      {daysUntilThis === 0 ? 'Today!' :
                                      isThisPast ? `${Math.abs(daysUntilThis)} days ago` :
                                      `${daysUntilThis} days away`}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Essays Card - Color coded by completion */}
              <div className={`bg-white rounded-xl shadow-sm border-2 p-5 transition-all hover:shadow-md ${
                essayCounts.rate === 100
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : essayCounts.rate >= 50
                    ? 'border-purple-200'
                    : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl ${
                    essayCounts.rate === 100 ? 'bg-emerald-100' : 'bg-purple-100'
                  }`}>
                    <FileText className={`w-5 h-5 ${
                      essayCounts.rate === 100 ? 'text-emerald-600' : 'text-purple-600'
                    }`} />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Essays</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900">{essayCounts.completed}</span>
                  <span className="text-gray-400">/</span>
                  <span className="text-lg text-gray-600">{essayCounts.total}</span>
                </div>
                {essayCounts.notStarted > 0 && (
                  <div className="text-xs text-amber-600 mt-1 font-medium">
                    {essayCounts.notStarted} not started
                  </div>
                )}
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          essayCounts.rate === 100 ? 'bg-emerald-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${essayCounts.rate}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-600">{essayCounts.rate}%</span>
                  </div>
                </div>
              </div>

              {/* Tests Card */}
              <div className={`bg-white rounded-xl shadow-sm border-2 p-5 transition-all hover:shadow-md ${
                testStatus.allComplete
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : testStatus.needed.length > 0
                    ? 'border-amber-200'
                    : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl ${
                    testStatus.allComplete ? 'bg-emerald-100' : 'bg-blue-100'
                  }`}>
                    <GraduationCap className={`w-5 h-5 ${
                      testStatus.allComplete ? 'text-emerald-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Tests</span>
                </div>
                {testStatus.noRequirements ? (
                  <div className="text-sm text-gray-400">No tests required</div>
                ) : testStatus.allComplete ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <span className="text-lg font-bold text-emerald-600">Complete!</span>
                  </div>
                ) : (
                  <>
                    <div className="text-lg font-bold text-gray-900">
                      {testStatus.needed.length} Needed
                    </div>
                    <div className="text-xs text-amber-600 mt-1 font-medium">
                      {testStatus.needed.join(', ')}
                    </div>
                  </>
                )}
                {testStatus.completed.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {testStatus.completed.map((test, idx) => (
                      <span key={idx} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                        ✓ {test.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Calendar Events Card */}
              <div className={`bg-white rounded-xl shadow-sm border-2 p-5 transition-all hover:shadow-md relative ${
                calendarStats.overdue > 0 ? 'border-rose-200 bg-rose-50/50' : 'border-gray-200'
              }`}
                onMouseEnter={() => setHoveredEventCard('calendar')}
                onMouseLeave={() => setHoveredEventCard(null)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl ${
                    calendarStats.overdue > 0 ? 'bg-rose-100' : 'bg-blue-100'
                  }`}>
                    <Calendar className={`w-5 h-5 ${
                      calendarStats.overdue > 0 ? 'text-[#BE123C]' : 'text-[#002147]'
                    }`} />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Events</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900">{calendarStats.completed}</span>
                  <span className="text-gray-400">/</span>
                  <span className="text-lg text-gray-600">{calendarStats.total}</span>
                </div>
                {calendarStats.overdue > 0 && (
                  <div className="text-xs text-[#BE123C] mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {calendarStats.overdue} overdue!
                  </div>
                )}
                {calendarStats.total > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#002147] h-2 rounded-full transition-all"
                          style={{ width: `${calendarStats.rate}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-600">{calendarStats.rate}%</span>
                    </div>
                  </div>
                )}

                {/* Hover Tooltip Popup for Calendar Events */}
                {hoveredEventCard === 'calendar' && calendarStats.total > 0 && (
                  <div className="absolute z-50 top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-2xl border-2 border-[#002147] p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-2 border-b-2 border-gray-100">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#002147]" />
                          <span className="text-sm font-bold text-gray-900">Calendar Events</span>
                        </div>
                        <span className="text-xs font-semibold text-[#002147] bg-[#DBEAFE] px-2 py-1 rounded-full">
                          {calendarStats.total} total
                        </span>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-200">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span className="text-xs text-emerald-700 font-medium">Completed</span>
                          </div>
                          <div className="text-lg font-bold text-emerald-700">{calendarStats.completed}</div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-xs text-blue-700 font-medium">Pending</span>
                          </div>
                          <div className="text-lg font-bold text-blue-700">{calendarStats.pending}</div>
                        </div>

                        {calendarStats.overdue > 0 && (
                          <div className="col-span-2 bg-rose-50 rounded-lg p-2 border-2 border-rose-300">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-[#BE123C] rounded-full animate-pulse"></div>
                                <span className="text-xs text-[#BE123C] font-medium">Overdue</span>
                              </div>
                              <div className="text-lg font-bold text-[#BE123C]">{calendarStats.overdue}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer Note */}
                      <div className="pt-2 border-t border-gray-100">
                        <div className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                          <Info className="w-3 h-3" />
                          <span>View full calendar details in Events tab</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Acceptance Rate Card */}
              <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-5 transition-all hover:shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-emerald-100 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Acceptance</span>
                </div>
                {(metadata?.acceptanceRate || selectedUniversity?.acceptanceRate) ? (
                  <>
                    <div className="text-2xl font-bold text-gray-900">
                      {metadata?.acceptanceRate || selectedUniversity?.acceptanceRate}%
                    </div>
                    <div className={`text-xs mt-1 font-semibold px-2 py-0.5 rounded-full inline-block ${
                      (metadata?.acceptanceRate || selectedUniversity?.acceptanceRate) < 15
                        ? 'text-[#BE123C] bg-rose-100'
                        : (metadata?.acceptanceRate || selectedUniversity?.acceptanceRate) < 30
                          ? 'text-[#D97706] bg-amber-100'
                          : 'text-emerald-700 bg-emerald-100'
                    }`}>
                      {(metadata?.acceptanceRate || selectedUniversity?.acceptanceRate) < 15 ? 'Highly Selective' :
                        (metadata?.acceptanceRate || selectedUniversity?.acceptanceRate) < 30 ? 'Competitive' : 'Moderate'}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400 text-sm">Not available</div>
                )}
              </div>
            </div>
          )}

          {/* ✅ UPDATED: Timeline Overview - Clean Minimalist Design */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center md:text-left">
                <div className="text-gray-500 text-sm mb-1 flex items-center gap-2 justify-center md:justify-start">
                  <Clock className="w-4 h-4" />
                  Duration
                </div>
                <div className="text-2xl font-bold text-gray-900">{timeline.totalDuration || '4-6 months'}</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-gray-500 text-sm mb-1 flex items-center gap-2 justify-center md:justify-start">
                  <TrendingUp className="w-4 h-4" />
                  Progress
                </div>
                <div className="text-2xl font-bold text-gray-900">{calculateOverallProgress()}%</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-gray-500 text-sm mb-1 flex items-center gap-2 justify-center md:justify-start">
                  <Flag className="w-4 h-4" />
                  Phases
                </div>
                <div className="text-2xl font-bold text-gray-900">{timeline.phases?.length || 0}</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-gray-500 text-sm mb-1 flex items-center gap-2 justify-center md:justify-start">
                  <ClipboardList className="w-4 h-4" />
                  Tasks
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  <span className="text-emerald-600">{taskStats.completed}</span>
                  <span className="text-gray-400">/</span>
                  {taskStats.total}
                </div>
              </div>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-700 font-medium">Overall Progress</span>
                <span className="text-sm font-bold text-gray-900">{calculateOverallProgress()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-[#002147] h-3 rounded-full transition-all duration-700"
                  style={{ width: `${calculateOverallProgress()}%` }}
                />
              </div>
            </div>

            {/* Progress Breakdown */}
            {metadata && (
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <FileText className="w-5 h-5 mx-auto mb-2 text-purple-600" />
                  <div className="text-gray-500 text-xs mb-1">Essays</div>
                  <div className="text-xl font-bold text-gray-900">{progressStats.essays}%</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <Calendar className="w-5 h-5 mx-auto mb-2 text-blue-600" />
                  <div className="text-gray-500 text-xs mb-1">Events</div>
                  <div className="text-xl font-bold text-gray-900">{progressStats.events}%</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <GraduationCap className="w-5 h-5 mx-auto mb-2 text-emerald-600" />
                  <div className="text-gray-500 text-xs mb-1">Tests</div>
                  <div className="text-xl font-bold text-gray-900">{progressStats.tests}%</div>
                </div>
              </div>
            )}

            {timeline.overview && (
              <p className="text-gray-600 leading-relaxed mt-6 pt-6 border-t border-gray-200 text-center md:text-left">
                {timeline.overview}
              </p>
            )}
          </div>

          {/* Phase Progress Overview - Color Coded */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
              <Flag className="w-5 h-5 text-[#002147]" />
              Phase Progress Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {timeline.phases?.map((phase, idx) => {
                const progress = calculatePhaseProgress(phase, idx);
                const colors = getPhaseColor(idx);
                const isCompleted = progress === 100;
                const isInProgress = phase.status === 'in-progress';

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setExpandedPhases(prev => ({ ...prev, [idx]: true }));
                      document.getElementById(`phase-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={`relative p-4 rounded-xl border-2 transition-all hover:shadow-md group ${
                      isCompleted
                        ? 'bg-emerald-50 border-emerald-300'
                        : isInProgress
                          ? `${colors.bg} ${colors.border} shadow-sm`
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {isInProgress && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#002147] rounded-full animate-pulse"></div>
                    )}

                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 mx-auto transition-transform ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isInProgress
                          ? colors.iconActive
                          : colors.icon
                    }`}>
                      {isCompleted ? <Trophy className="w-5 h-5" /> : getPhaseIcon(idx)}
                    </div>

                    <div className="text-center">
                      <div className={`text-xs font-bold mb-1 ${
                        isCompleted ? 'text-emerald-600' : isInProgress ? colors.accent : 'text-gray-500'
                      }`}>
                        Phase {idx + 1}
                      </div>
                      <div className="text-sm font-semibold text-gray-900 line-clamp-1 mb-2">
                        {phase.name?.replace(/Phase \d+:?\s*/i, '').split(' ').slice(0, 2).join(' ')}
                      </div>
                      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            isCompleted ? 'bg-emerald-500' : colors.progress
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className={`text-xs font-bold mt-1 ${
                        isCompleted ? 'text-emerald-600' : 'text-gray-600'
                      }`}>
                        {progress}%
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timeline Phases - Color Coded */}
          <div className="space-y-6">
            {timeline.phases?.map((phase, phaseIndex) => {
              const phaseProgress = calculatePhaseProgress(phase, phaseIndex);
              const colors = getPhaseColor(phaseIndex);
              const isCompleted = phaseProgress === 100;
              const isInProgress = phase.status === 'in-progress';
              const completedTasksCount = getCompletedTasksCount(phase);

              return (
                <div
                  key={phase.id || phaseIndex}
                  id={`phase-${phaseIndex}`}
                  className={`bg-white rounded-xl border-2 overflow-hidden transition-all ${
                    isCompleted
                      ? 'border-emerald-300'
                      : isInProgress
                        ? `${colors.border} shadow-md`
                        : 'border-gray-200'
                  }`}
                >
                  {/* Phase Header - Color Solid */}
                  <div className={`${
                    isCompleted
                      ? 'bg-emerald-500'
                      : isInProgress
                        ? colors.headerBg
                        : 'bg-gray-500'
                  }`}>
                    <button
                      onClick={() => togglePhase(phaseIndex)}
                      className="w-full p-6 flex items-center justify-between text-white"
                    >
                      <div className="flex items-center gap-5 flex-1">
                        <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center bg-white/20`}>
                          {isCompleted ? (
                            <Trophy className="w-8 h-8 text-white" />
                          ) : (
                            getPhaseIcon(phaseIndex)
                          )}
                          {isInProgress && !isCompleted && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-[#002147] rounded-full animate-pulse"></div>
                            </div>
                          )}
                        </div>

                        <div className="text-left flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="text-white/70 text-sm font-medium">Phase {phaseIndex + 1}</span>
                            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                              isCompleted
                                ? 'bg-white/30 text-white'
                                : isInProgress
                                  ? 'bg-white/30 text-white'
                                  : 'bg-white/20 text-white/80'
                            }`}>
                              {isCompleted ? '✓ Completed' : isInProgress ? '● In Progress' : '○ Upcoming'}
                            </span>
                          </div>

                          <h3 className="text-xl font-bold text-white mb-2">{phase.name}</h3>

                          <div className="flex items-center gap-4 text-sm text-white/80 flex-wrap">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              {phase.duration}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span className="hidden sm:flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              {phase.timeframe}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              {completedTasksCount}/{phase.tasks?.length || 0} tasks
                            </span>
                          </div>

                          <div className="mt-4 max-w-md">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-white/20 rounded-full h-2.5 overflow-hidden">
                                <div
                                  className="bg-white h-2.5 rounded-full transition-all duration-500"
                                  style={{ width: `${phaseProgress}%` }}
                                />
                              </div>
                              <span className="text-sm font-bold text-white min-w-[40px]">
                                {phaseProgress}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 p-3 bg-white/20 rounded-xl transition-all hover:bg-white/30">
                        {expandedPhases[phaseIndex] ? (
                          <ChevronUp className="w-5 h-5 text-white" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-white" />
                        )}
                      </div>
                    </button>
                  </div>

                  {expandedPhases[phaseIndex] && (
                    <div className="border-t border-gray-200">
                      {phase.description && (
                        <div className={`p-6 ${colors.light} border-b border-gray-200`}>
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${colors.icon}`}>
                              <Info className="w-5 h-5" />
                            </div>
                            <p className="text-gray-700 leading-relaxed">{phase.description}</p>
                          </div>
                        </div>
                      )}

                      <div className="p-6 space-y-8">
                        {/* Objectives */}
                        {phase.objectives && phase.objectives.length > 0 && (
                          <div>
                            <h4 className={`font-bold text-gray-900 mb-4 flex items-center gap-2 ${colors.accent}`}>
                              <Target className="w-5 h-5" />
                              Key Objectives
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {phase.objectives.map((obj, idx) => (
                                <div key={idx} className={`flex items-start gap-3 ${colors.light} rounded-xl border ${colors.border} p-4 hover:shadow-md transition-all`}>
                                  <div className={`w-7 h-7 ${colors.icon} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                    <span className="text-xs font-bold">{idx + 1}</span>
                                  </div>
                                  <span className="text-sm text-gray-700">{obj}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tasks */}
                        {phase.tasks && phase.tasks.length > 0 && (
                          <div>
                            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <BookOpen className={`w-5 h-5 ${colors.accent}`} />
                              Tasks
                              <span className={`text-sm font-normal ml-2 px-2 py-0.5 rounded-full ${colors.badge}`}>
                                {completedTasksCount}/{phase.tasks.length} completed
                              </span>
                            </h4>
                            <div className="space-y-3">
                              {phase.tasks.map((task, taskIndex) => {
                                const taskKey = `${phaseIndex}-${taskIndex}`;
                                const isTaskCompleted = task.completed === true || task.status === 'completed';
                                const isExpanded = expandedTasks[taskKey];
                                const isSaving = savingTasks[taskKey];
                                const hasValidId = isValidTaskId(task.id);

                                return (
                                  <div
                                    key={task.id || taskIndex}
                                    className={`rounded-xl border-2 transition-all ${
                                      isTaskCompleted
                                        ? 'bg-emerald-50/50 border-emerald-200'
                                        : `bg-white ${colors.border} hover:shadow-md`
                                    }`}
                                  >
                                    <div className="p-5">
                                      <div className="flex items-start gap-4">
                                        {/* Checkbox button with loading state and invalid ID indicator */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleTaskComplete(phaseIndex, taskIndex);
                                          }}
                                          disabled={isSaving}
                                          title={!hasValidId ? 'Task cannot be saved (invalid ID). Click Regenerate to fix.' : ''}
                                          className={`mt-0.5 w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                            isSaving
                                              ? 'border-gray-300 bg-gray-100'
                                              : isTaskCompleted
                                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                                                : !hasValidId
                                                  ? 'border-amber-400 bg-amber-50 hover:bg-amber-100'
                                                  : `border-gray-300 hover:border-[#002147] hover:bg-blue-50`
                                          }`}
                                        >
                                          {isSaving ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                                          ) : isTaskCompleted ? (
                                            <Check className="w-4 h-4" />
                                          ) : !hasValidId ? (
                                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                                          ) : null}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <h5 className={`font-semibold ${isTaskCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                                {task.title}
                                              </h5>
                                              {/* Show warning badge if task has invalid ID */}
                                              {!hasValidId && (
                                                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-lg font-medium flex items-center gap-1">
                                                  <AlertTriangle className="w-3 h-3" />
                                                  Can't save
                                                </span>
                                              )}
                                              {/* Test badges */}
                                              {task.requiresGMAT && (
                                                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-lg font-medium">GMAT</span>
                                              )}
                                              {task.requiresGRE && (
                                                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-lg font-medium">GRE</span>
                                              )}
                                              {task.requiresIELTS && (
                                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-lg font-medium">IELTS</span>
                                              )}
                                              {task.requiresTOEFL && (
                                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-lg font-medium">TOEFL</span>
                                              )}
                                              {task.relatedEssayId && (
                                                <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-700 rounded-lg font-medium flex items-center gap-1">
                                                  <FileText className="w-3 h-3" />
                                                  Essay Linked
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          <p className={`text-sm mb-4 ${isTaskCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {task.description}
                                          </p>

                                          <div className="flex items-center gap-3 flex-wrap">
                                            <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg ${
                                              isTaskCompleted ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                              <Clock className="w-3 h-3" />
                                              {task.estimatedTime}
                                            </span>
                                            <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border ${getPriorityColor(task.priority)}`}>
                                              {getPriorityIcon(task.priority)}
                                              {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
                                            </span>
                                            {isTaskCompleted && (
                                              <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 font-medium">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Completed
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <button
                                          onClick={() => toggleTask(phaseIndex, taskIndex)}
                                          className={`p-2.5 rounded-xl transition-colors ${
                                            isExpanded ? colors.icon : 'hover:bg-gray-100'
                                          }`}
                                        >
                                          {isExpanded ? (
                                            <ChevronUp className={`w-5 h-5 ${colors.accent}`} />
                                          ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                          )}
                                        </button>
                                      </div>

                                      {isExpanded && (
                                        <div className="mt-5 pt-5 border-t border-gray-200 space-y-4">
                                          {/* Action Steps */}
                                          {task.actionSteps && task.actionSteps.length > 0 && (
                                            <div className={`${colors.light} rounded-xl p-5 border ${colors.border}`}>
                                              <div className={`flex items-center gap-2 text-sm font-bold ${colors.accent} mb-4`}>
                                                <ClipboardList className="w-4 h-4" />
                                                Action Steps
                                              </div>
                                              <ol className="space-y-3">
                                                {task.actionSteps.map((step, idx) => (
                                                  <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                                                    <span className={`w-6 h-6 ${colors.icon} rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold`}>
                                                      {idx + 1}
                                                    </span>
                                                    <span>{step}</span>
                                                  </li>
                                                ))}
                                              </ol>
                                            </div>
                                          )}

                                          {/* Tips */}
                                          {task.tips && task.tips.length > 0 && (
                                            <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
                                              <div className="flex items-center gap-2 text-sm font-bold text-[#D97706] mb-4">
                                                <Lightbulb className="w-4 h-4" />
                                                Pro Tips
                                              </div>
                                              <ul className="space-y-3">
                                                {task.tips.map((tip, idx) => (
                                                  <li key={idx} className="flex items-start gap-3 text-sm text-[#92400E]">
                                                    <Star className="w-4 h-4 text-[#D97706] flex-shrink-0 mt-0.5" />
                                                    <span>{tip}</span>
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}

                                          {/* Resources */}
                                          {task.resources && task.resources.length > 0 && (
                                            <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
                                              <div className="flex items-center gap-2 text-sm font-bold text-[#047857] mb-4">
                                                <ExternalLink className="w-4 h-4" />
                                                Resources
                                              </div>
                                              <div className="flex flex-wrap gap-2">
                                                {task.resources.map((resource, idx) => (
                                                  <span key={idx} className="text-xs px-3 py-2 bg-white text-[#047857] rounded-lg border border-emerald-200 hover:bg-emerald-100 cursor-pointer transition-colors font-medium">
                                                    {resource}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Milestones */}
                        {phase.milestones && phase.milestones.length > 0 && (
                          <div>
                            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <Award className={`w-5 h-5 ${colors.accent}`} />
                              Key Milestones
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {phase.milestones.map((milestone, idx) => (
                                <div key={idx} className={`flex items-start gap-3 ${colors.light} rounded-xl border ${colors.border} p-4`}>
                                  <Trophy className={`w-5 h-5 ${colors.accent} flex-shrink-0 mt-0.5`} />
                                  <span className="text-sm text-gray-700">{milestone}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Pro Tips & Common Mistakes */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {phase.proTips && phase.proTips.length > 0 && (
                            <div>
                              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Lightbulb className="w-5 h-5 text-[#5B21B6]" />
                                Expert Tips
                              </h4>
                              <div className="bg-purple-50 rounded-xl border border-purple-200 p-5">
                                <ul className="space-y-3">
                                  {phase.proTips.map((tip, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm text-[#5B21B6]">
                                      <Sparkles className="w-4 h-4 text-[#5B21B6] flex-shrink-0 mt-0.5" />
                                      <span>{tip}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}

                          {phase.commonMistakes && phase.commonMistakes.length > 0 && (
                            <div>
                              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-[#BE123C]" />
                                Avoid These Mistakes
                              </h4>
                              <div className="bg-rose-50 rounded-xl border border-rose-200 p-5">
                                <ul className="space-y-3">
                                  {phase.commonMistakes.map((mistake, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm text-[#BE123C]">
                                      <XCircle className="w-4 h-4 text-[#BE123C] flex-shrink-0 mt-0.5" />
                                      <span>{mistake}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Metadata */}
          {metadata && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between flex-wrap gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {new Date(metadata.generatedAt).toLocaleString()}
                  </span>
                  {metadata.fromDatabase && (
                    <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Synced from database
                    </span>
                  )}
                  {metadata.tasksSynced > 0 && (
                    <span className="flex items-center gap-1.5 text-[#002147] font-medium">
                      <RefreshCw className="w-4 h-4" />
                      {metadata.tasksSynced} tasks updated
                    </span>
                  )}
                  {invalidTasksCount > 0 && (
                    <span className="flex items-center gap-1.5 text-[#D97706] font-medium">
                      <AlertTriangle className="w-4 h-4" />
                      {invalidTasksCount} tasks need fix
                    </span>
                  )}
                  {metadata.processingTime && (
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4" />
                      {metadata.processingTime}ms
                    </span>
                  )}
                </div>
                <button
                  onClick={handleRegenerate}
                  disabled={generatingTimeline}
                  className="text-[#002147] hover:text-[#001122] font-semibold flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[#EFF6FF] transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${generatingTimeline ? 'animate-spin' : ''}`} />
                  Regenerate Timeline
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="w-24 h-24 bg-[#EFF6FF] rounded-full flex items-center justify-center mx-auto mb-8">
            <Sparkles className="w-12 h-12 text-[#002147]" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Generate Your Timeline</h3>
          <p className="text-gray-600 max-w-lg mx-auto mb-8">
            Select a university above to generate a personalized AI-powered timeline with actionable steps for your application
          </p>
          {selectedUniversity && (
            <button
              onClick={() => generateTimeline(selectedUniversity)}
              disabled={generatingTimeline}
              className="px-8 py-4 bg-[#002147] text-white rounded-xl hover:bg-[#001122] transition-all font-semibold inline-flex items-center gap-3 disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5" />
              Generate Timeline for {selectedUniversity.universityName || selectedUniversity.name}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default UniversityTimeline;