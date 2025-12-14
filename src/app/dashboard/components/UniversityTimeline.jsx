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

// ✅ Phase color configurations - Each phase has unique colors
const PHASE_COLORS = {
  0: { // Phase 1: Research - Blue
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    headerBg: 'bg-gradient-to-r from-blue-500 to-blue-600',
    icon: 'bg-blue-100 text-blue-600',
    iconActive: 'bg-blue-500 text-white',
    progress: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    light: 'bg-blue-50',
    accent: 'text-blue-600',
    ring: 'ring-blue-500'
  },
  1: { // Phase 2: Testing - Purple
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    headerBg: 'bg-gradient-to-r from-purple-500 to-purple-600',
    icon: 'bg-purple-100 text-purple-600',
    iconActive: 'bg-purple-500 text-white',
    progress: 'bg-purple-500',
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
    light: 'bg-purple-50',
    accent: 'text-purple-600',
    ring: 'ring-purple-500'
  },
  2: { // Phase 3: Essays - Pink/Rose
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    headerBg: 'bg-gradient-to-r from-rose-500 to-pink-600',
    icon: 'bg-rose-100 text-rose-600',
    iconActive: 'bg-rose-500 text-white',
    progress: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
    light: 'bg-rose-50',
    accent: 'text-rose-600',
    ring: 'ring-rose-500'
  },
  3: { // Phase 4: Recommendations - Orange/Amber
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    headerBg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    icon: 'bg-amber-100 text-amber-600',
    iconActive: 'bg-amber-500 text-white',
    progress: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    light: 'bg-amber-50',
    accent: 'text-amber-600',
    ring: 'ring-amber-500'
  },
  4: { // Phase 5: Submission - Green/Emerald
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    headerBg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    icon: 'bg-emerald-100 text-emerald-600',
    iconActive: 'bg-emerald-500 text-white',
    progress: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    light: 'bg-emerald-50',
    accent: 'text-emerald-600',
    ring: 'ring-emerald-500'
  }
};

const getPhaseColor = (index) => PHASE_COLORS[index % 5];

const UniversityTimeline = ({ universities, stats, userProfile }) => {
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [generatingTimeline, setGeneratingTimeline] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState({});
  const [expandedTasks, setExpandedTasks] = useState({});
  const [completedTasks, setCompletedTasks] = useState({});
  const [error, setError] = useState(null);
  const [loadingTimelines, setLoadingTimelines] = useState({});
  const [debugMode, setDebugMode] = useState(false);
  const { data: session } = useSession();

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

  // ✅ Helper function to get progress stats
  const getProgressStats = useCallback(() => {
    return {
      overall: metadata?.overallProgress ?? metadata?.currentProgress ?? 0,
      essays: metadata?.essayProgress ?? 0,
      events: metadata?.eventProgress ?? 0,
      tests: metadata?.testProgress ?? 0
    };
  }, [metadata]);

  // ✅ Count completed tasks from timeline
  const getTimelineTaskStats = useCallback(() => {
    if (!timeline?.phases) return { total: 0, completed: 0 };
    
    let total = 0;
    let completed = 0;
    
    timeline.phases.forEach((phase, phaseIdx) => {
      phase.tasks?.forEach((task, taskIdx) => {
        total++;
        if (completedTasks[`${phaseIdx}-${taskIdx}`] || task.completed || task.status === 'completed') {
          completed++;
        }
      });
    });
    
    return { total, completed };
  }, [timeline, completedTasks]);

  useEffect(() => {
    if (universities && universities.length > 0 && !selectedUniversity) {
      setSelectedUniversity(universities[0]);
      generateTimeline(universities[0]);
    }
  }, [universities]);

  const calculateUniversityProgress = (uni) => {
    if (!uni) return 0;
    return uni.overallProgress || uni.stats?.applicationHealth?.overallProgress || 0;
  };

  const generateTimeline = useCallback(async (university, forceRegenerate = false) => {
    if (!university || !session?.token) return;

    setGeneratingTimeline(true);
    setLoadingTimelines(prev => ({ ...prev, [university.id]: true }));
    setError(null);
    setTimeline(null);
    setMetadata(null);

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
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to generate timeline');
      }

      if (data.success && data.timeline) {
        setTimeline(data.timeline);
        setMetadata(data.metadata || null);

        // ✅ Debug: Log data sync info
        console.log('📊 Timeline Data Sync Check:', {
          essaysFromMetadata: data.metadata?.essaysCompleted,
          essaysTotal: data.metadata?.essaysRequired,
          tasksSynced: data.metadata?.tasksSynced,
          fromDatabase: data.metadata?.fromDatabase
        });

        // Auto-expand phases that are in-progress or first phase
        const initialExpanded = {};
        data.timeline.phases?.forEach((phase, idx) => {
          if (phase.status === 'in-progress' || idx === 0) {
            initialExpanded[idx] = true;
          }
        });
        setExpandedPhases(initialExpanded);

        // ✅ Initialize completed tasks from API response with validation
        const initialCompleted = {};
        let completedCount = 0;
        
        data.timeline.phases?.forEach((phase, phaseIdx) => {
          phase.tasks?.forEach((task, taskIdx) => {
            const isCompleted = task.completed || task.status === 'completed';
            if (isCompleted) {
              initialCompleted[`${phaseIdx}-${taskIdx}`] = true;
              completedCount++;
            }
          });
        });
        
        setCompletedTasks(initialCompleted);
        
        // ✅ Validation log
        console.log('✅ Task Completion Sync:', {
          totalCompletedTasks: completedCount,
          essaysCompleted: data.metadata?.essaysCompleted,
          eventsCompleted: data.metadata?.calendarEventsCompleted
        });
        
      } else {
        throw new Error(data.error || 'Failed to generate timeline');
      }
    } catch (err) {
      console.error('Error generating timeline:', err);
      setError(err.message || 'Failed to generate timeline. Please try again.');
    } finally {
      setGeneratingTimeline(false);
      setLoadingTimelines(prev => ({ ...prev, [university.id]: false }));
    }
  }, [session, userProfile]);

  const togglePhase = (phaseIndex) => {
    setExpandedPhases(prev => ({
      ...prev,
      [phaseIndex]: !prev[phaseIndex]
    }));
  };

  const toggleTask = (phaseIndex, taskIndex) => {
    const key = `${phaseIndex}-${taskIndex}`;
    setExpandedTasks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleTaskComplete = async (phaseIndex, taskIndex) => {
    const key = `${phaseIndex}-${taskIndex}`;
    const newCompletedState = !completedTasks[key];
    
    setCompletedTasks(prev => ({
      ...prev,
      [key]: newCompletedState
    }));
  };

  const handleUniversityChange = (university) => {
    setSelectedUniversity(university);
    setTimeline(null);
    setMetadata(null);
    setExpandedTasks({});
    setCompletedTasks({});
    generateTimeline(university);
  };

  const handleRegenerate = () => {
    if (selectedUniversity) {
      generateTimeline(selectedUniversity, true);
    }
  };

  const getStatusColor = (status, phaseIndex = 0) => {
    const colors = getPhaseColor(phaseIndex);
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-300';
      case 'in-progress': return `${colors.badge}`;
      case 'upcoming': return 'bg-gray-100 text-gray-600 border-gray-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'critical': return 'text-red-700 bg-red-100 border-red-300 font-bold';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
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

  const calculatePhaseProgress = (phase, phaseIndex) => {
    if (!phase.tasks || phase.tasks.length === 0) return 0;
    const completed = phase.tasks.filter((task, taskIdx) =>
      completedTasks[`${phaseIndex}-${taskIdx}`] || task.completed || task.status === 'completed'
    ).length;
    return Math.round((completed / phase.tasks.length) * 100);
  };

  const calculateOverallProgress = () => {
    if (!timeline?.phases) return metadata?.currentProgress || metadata?.overallProgress || 0;

    let totalTasks = 0;
    let completedCount = 0;

    timeline.phases.forEach((phase, phaseIdx) => {
      if (phase.tasks) {
        totalTasks += phase.tasks.length;
        phase.tasks.forEach((task, taskIdx) => {
          if (completedTasks[`${phaseIdx}-${taskIdx}`] || task.completed || task.status === 'completed') {
            completedCount++;
          }
        });
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
    if (daysUntilDeadline <= 0) return { color: 'text-red-600', label: 'Passed', bg: 'bg-red-50', border: 'border-red-200' };
    if (daysUntilDeadline <= 14) return { color: 'text-red-600', label: 'Urgent', bg: 'bg-red-50', border: 'border-red-200' };
    if (daysUntilDeadline <= 30) return { color: 'text-orange-600', label: 'Soon', bg: 'bg-orange-50', border: 'border-orange-200' };
    if (daysUntilDeadline <= 60) return { color: 'text-amber-600', label: 'Approaching', bg: 'bg-amber-50', border: 'border-amber-200' };
    return { color: 'text-green-600', label: 'On Track', bg: 'bg-green-50', border: 'border-green-200' };
  };

  // Get computed values
  const essayCounts = getEssayCounts();
  const testStatus = getTestStatus();
  const calendarStats = getCalendarStats();
  const progressStats = getProgressStats();
  const taskStats = getTimelineTaskStats();

  // Empty state
  if (!universities || universities.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Calendar className="w-10 h-10 text-indigo-500" />
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
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyek0zNiAyNnYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <Sparkles className="w-8 h-8 text-yellow-300" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">AI Application Timeline</h1>
              <p className="text-indigo-200 text-lg">
                Your personalized step-by-step guide from research to submission
              </p>
            </div>
          </div>
          {timeline && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDebugMode(!debugMode)}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-xs"
              >
                {debugMode ? 'Hide Debug' : 'Debug'}
              </button>
              <button
                onClick={handleRegenerate}
                disabled={generatingTimeline}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <RefreshCw className={`w-4 h-4 ${generatingTimeline ? 'animate-spin' : ''}`} />
                Regenerate
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Debug Panel */}
      {debugMode && metadata && (
        <div className="bg-slate-900 text-green-400 rounded-xl p-4 font-mono text-xs overflow-auto">
          <div className="font-bold text-white mb-2">📊 Data Sync Debug Info:</div>
          <pre className="whitespace-pre-wrap">
{`Essays: ${essayCounts.completed}/${essayCounts.total} (${essayCounts.rate}%)
Tasks in UI: ${taskStats.completed}/${taskStats.total}
Calendar: ${calendarStats.completed}/${calendarStats.total}
Tests Needed: ${testStatus.needed.join(', ') || 'None'}
Tests Complete: ${testStatus.completed.map(t => t.display).join(', ') || 'None'}
From Database: ${metadata.fromDatabase ? 'Yes' : 'No (Fresh Generate)'}
Tasks Synced: ${metadata.tasksSynced || 0}
Timeline ID: ${metadata.timelineId || 'N/A'}`}
          </pre>
        </div>
      )}

      {/* University Selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <label className="text-lg font-bold text-gray-900">
            Select University
          </label>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {universities.length} {universities.length === 1 ? 'university' : 'universities'} saved
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {universities.map((uni) => {
            const isSelected = selectedUniversity?.id === uni.id;
            const isLoading = loadingTimelines[uni.id];
            const progress = calculateUniversityProgress(uni);

            return (
              <button
                key={uni.id}
                onClick={() => handleUniversityChange(uni)}
                disabled={isLoading}
                className={`p-5 rounded-xl border-2 transition-all text-left hover:shadow-lg disabled:opacity-50 group ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 shadow-lg ring-2 ring-indigo-500/20'
                    : 'border-gray-200 hover:border-indigo-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {uni.images?.[0]?.imageUrl ? (
                      <img
                        src={uni.images[0].imageUrl}
                        alt={uni.images[0].imageAltText || uni.universityName}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {uni.universityName || uni.name}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {uni.location}
                      </p>
                    </div>
                  </div>
                  {isSelected ? (
                    <CheckCircle2 className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                  ) : isLoading ? (
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin flex-shrink-0" />
                  ) : null}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      Essays: {uni.completedEssays || 0}/{uni.totalEssays || 0}
                    </span>
                    <span className="font-semibold text-gray-700">{progress}%</span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          isSelected ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-gray-400'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline Content */}
      {generatingTimeline ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-50" />
            <div className="absolute inset-2 bg-indigo-200 rounded-full animate-pulse" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Generating Your Timeline</h3>
          <p className="text-gray-600 max-w-lg mx-auto mb-6">
            AI is analyzing <strong className="text-indigo-600">{selectedUniversity?.universityName || selectedUniversity?.name}</strong>&apos;s
            requirements and your profile...
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Analyzing
            </span>
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              Creating phases
            </span>
            <span className="flex items-center gap-2">
              <Circle className="w-5 h-5 text-gray-300" />
              Building tasks
            </span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-2xl p-10 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-red-900 mb-3">Error Generating Timeline</h3>
          <p className="text-red-700 mb-8 max-w-md mx-auto">{error}</p>
          <button
            onClick={handleRegenerate}
            className="px-8 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold inline-flex items-center gap-2 shadow-lg shadow-red-600/25"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        </div>
      ) : timeline ? (
        <div className="space-y-6">
          {/* Stats Cards - Enhanced */}
          {(metadata || selectedUniversity) && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Deadline Card */}
              <div className={`bg-white rounded-xl shadow-sm border-2 p-5 transition-all hover:shadow-md ${
                metadata?.daysUntilDeadline && metadata.daysUntilDeadline <= 30 
                  ? 'border-red-200 bg-red-50/50' 
                  : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl ${
                    metadata?.daysUntilDeadline && metadata.daysUntilDeadline <= 14 
                      ? 'bg-red-100' 
                      : 'bg-orange-100'
                  }`}>
                    <Timer className={`w-5 h-5 ${
                      metadata?.daysUntilDeadline && metadata.daysUntilDeadline <= 14 
                        ? 'text-red-600' 
                        : 'text-orange-600'
                    }`} />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Deadline</span>
                </div>
                {metadata?.deadline ? (
                  <>
                    <div className="text-lg font-bold text-gray-900">
                      {formatDate(metadata.deadline)}
                    </div>
                    <div className={`text-sm mt-1 font-semibold flex items-center gap-1 ${getDeadlineUrgency(metadata.daysUntilDeadline).color}`}>
                      {metadata.daysUntilDeadline <= 14 && <AlertCircle className="w-4 h-4" />}
                      {metadata.daysUntilDeadline > 0
                        ? `${metadata.daysUntilDeadline} days left`
                        : 'Deadline passed'}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400 text-sm">Check website</div>
                )}
              </div>

              {/* Essays Card - Color coded by completion */}
              <div className={`bg-white rounded-xl shadow-sm border-2 p-5 transition-all hover:shadow-md ${
                essayCounts.rate === 100 
                  ? 'border-green-200 bg-green-50/50' 
                  : essayCounts.rate >= 50 
                    ? 'border-purple-200' 
                    : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl ${
                    essayCounts.rate === 100 ? 'bg-green-100' : 'bg-purple-100'
                  }`}>
                    <FileText className={`w-5 h-5 ${
                      essayCounts.rate === 100 ? 'text-green-600' : 'text-purple-600'
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
                          essayCounts.rate === 100 ? 'bg-green-500' : 'bg-purple-500'
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
                  ? 'border-green-200 bg-green-50/50' 
                  : testStatus.needed.length > 0 
                    ? 'border-amber-200' 
                    : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl ${
                    testStatus.allComplete ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    <GraduationCap className={`w-5 h-5 ${
                      testStatus.allComplete ? 'text-green-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Tests</span>
                </div>
                {testStatus.noRequirements ? (
                  <div className="text-sm text-gray-400">No tests required</div>
                ) : testStatus.allComplete ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    <span className="text-lg font-bold text-green-600">Complete!</span>
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
                      <span key={idx} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        ✓ {test.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Calendar Events Card */}
              <div className={`bg-white rounded-xl shadow-sm border-2 p-5 transition-all hover:shadow-md ${
                calendarStats.overdue > 0 
                  ? 'border-red-200 bg-red-50/50' 
                  : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl ${
                    calendarStats.overdue > 0 ? 'bg-red-100' : 'bg-indigo-100'
                  }`}>
                    <Calendar className={`w-5 h-5 ${
                      calendarStats.overdue > 0 ? 'text-red-600' : 'text-indigo-600'
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
                  <div className="text-xs text-red-600 mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {calendarStats.overdue} overdue!
                  </div>
                )}
                {calendarStats.total > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-2 rounded-full transition-all"
                          style={{ width: `${calendarStats.rate}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-600">{calendarStats.rate}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Acceptance Rate Card */}
              <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-5 transition-all hover:shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-teal-100 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-teal-600" />
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
                        ? 'text-red-700 bg-red-100' 
                        : (metadata?.acceptanceRate || selectedUniversity?.acceptanceRate) < 30 
                          ? 'text-amber-700 bg-amber-100' 
                          : 'text-green-700 bg-green-100'
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

          {/* Timeline Overview - Enhanced */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl"></div>
            
            <div className="relative">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div className="text-center md:text-left">
                  <div className="text-slate-400 text-sm mb-1 flex items-center gap-2 justify-center md:justify-start">
                    <Clock className="w-4 h-4" />
                    Duration
                  </div>
                  <div className="text-3xl font-bold">{timeline.totalDuration || '4-6 months'}</div>
                </div>
                <div className="text-center md:text-left">
                  <div className="text-slate-400 text-sm mb-1 flex items-center gap-2 justify-center md:justify-start">
                    <TrendingUp className="w-4 h-4" />
                    Progress
                  </div>
                  <div className="text-3xl font-bold">{calculateOverallProgress()}%</div>
                </div>
                <div className="text-center md:text-left">
                  <div className="text-slate-400 text-sm mb-1 flex items-center gap-2 justify-center md:justify-start">
                    <Flag className="w-4 h-4" />
                    Phases
                  </div>
                  <div className="text-3xl font-bold">{timeline.phases?.length || 0}</div>
                </div>
                <div className="text-center md:text-left">
                  <div className="text-slate-400 text-sm mb-1 flex items-center gap-2 justify-center md:justify-start">
                    <ClipboardList className="w-4 h-4" />
                    Tasks
                  </div>
                  <div className="text-3xl font-bold">
                    <span className="text-green-400">{taskStats.completed}</span>
                    <span className="text-slate-500">/</span>
                    {taskStats.total}
                  </div>
                </div>
              </div>

              {/* Enhanced Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-300 font-medium">Overall Progress</span>
                  <span className="text-sm font-bold text-white">{calculateOverallProgress()}%</span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-4 overflow-hidden backdrop-blur-sm">
                  <div
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-4 rounded-full transition-all duration-700 relative"
                    style={{ width: `${calculateOverallProgress()}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                  </div>
                </div>
              </div>

              {/* Progress Breakdown */}
              {metadata && (
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-700/50">
                  <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                    <FileText className="w-5 h-5 mx-auto mb-2 text-purple-400" />
                    <div className="text-slate-400 text-xs mb-1">Essays</div>
                    <div className="text-xl font-bold">{progressStats.essays}%</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                    <Calendar className="w-5 h-5 mx-auto mb-2 text-blue-400" />
                    <div className="text-slate-400 text-xs mb-1">Events</div>
                    <div className="text-xl font-bold">{progressStats.events}%</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                    <GraduationCap className="w-5 h-5 mx-auto mb-2 text-green-400" />
                    <div className="text-slate-400 text-xs mb-1">Tests</div>
                    <div className="text-xl font-bold">{progressStats.tests}%</div>
                  </div>
                </div>
              )}

              {timeline.overview && (
                <p className="text-slate-300 leading-relaxed mt-6 pt-6 border-t border-slate-700/50 text-center md:text-left">
                  {timeline.overview}
                </p>
              )}
            </div>
          </div>

          {/* Phase Progress Overview - Color Coded */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
              <Flag className="w-5 h-5 text-indigo-600" />
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
                    className={`relative p-4 rounded-xl border-2 transition-all hover:shadow-lg group ${
                      isCompleted 
                        ? 'bg-green-50 border-green-300' 
                        : isInProgress 
                          ? `${colors.bg} ${colors.border} shadow-md` 
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {isInProgress && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    )}
                    
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 mx-auto transition-transform group-hover:scale-110 ${
                      isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isInProgress 
                          ? colors.iconActive 
                          : colors.icon
                    }`}>
                      {isCompleted ? <Trophy className="w-5 h-5" /> : getPhaseIcon(idx)}
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-xs font-bold mb-1 ${
                        isCompleted ? 'text-green-600' : isInProgress ? colors.accent : 'text-gray-500'
                      }`}>
                        Phase {idx + 1}
                      </div>
                      <div className="text-sm font-semibold text-gray-900 line-clamp-1 mb-2">
                        {phase.name?.replace(/Phase \d+:?\s*/i, '').split(' ').slice(0, 2).join(' ')}
                      </div>
                      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            isCompleted ? 'bg-green-500' : colors.progress
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className={`text-xs font-bold mt-1 ${
                        isCompleted ? 'text-green-600' : 'text-gray-600'
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
              const completedTasksCount = phase.tasks?.filter((t, i) => 
                completedTasks[`${phaseIndex}-${i}`] || t.completed || t.status === 'completed'
              ).length || 0;

              return (
                <div
                  key={phase.id || phaseIndex}
                  id={`phase-${phaseIndex}`}
                  className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all ${
                    isCompleted 
                      ? 'border-green-300' 
                      : isInProgress 
                        ? `${colors.border} shadow-lg ring-2 ${colors.ring}/20` 
                        : 'border-gray-200'
                  }`}
                >
                  {/* Phase Header - Color Gradient */}
                  <div className={`${
                    isCompleted 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                      : isInProgress 
                        ? colors.headerBg 
                        : 'bg-gradient-to-r from-gray-400 to-gray-500'
                  }`}>
                    <button
                      onClick={() => togglePhase(phaseIndex)}
                      className="w-full p-6 flex items-center justify-between text-white"
                    >
                      <div className="flex items-center gap-5 flex-1">
                        <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center bg-white/20 backdrop-blur-sm`}>
                          {isCompleted ? (
                            <Trophy className="w-8 h-8 text-white" />
                          ) : (
                            getPhaseIcon(phaseIndex)
                          )}
                          {isInProgress && !isCompleted && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
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
                                const isTaskCompleted = completedTasks[taskKey] || task.completed || task.status === 'completed';
                                const isExpanded = expandedTasks[taskKey];

                                return (
                                  <div
                                    key={task.id || taskIndex}
                                    className={`rounded-xl border-2 transition-all ${
                                      isTaskCompleted 
                                        ? 'bg-green-50/50 border-green-200' 
                                        : `bg-white ${colors.border} hover:shadow-md`
                                    }`}
                                  >
                                    <div className="p-5">
                                      <div className="flex items-start gap-4">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleTaskComplete(phaseIndex, taskIndex);
                                          }}
                                          className={`mt-0.5 w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                            isTaskCompleted 
                                              ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/25' 
                                              : `border-gray-300 hover:${colors.border} hover:${colors.light}`
                                          }`}
                                        >
                                          {isTaskCompleted && <Check className="w-4 h-4" />}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <h5 className={`font-semibold ${isTaskCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                                {task.title}
                                              </h5>
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
                                              <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-100 text-green-700 font-medium">
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
                                              <div className="flex items-center gap-2 text-sm font-bold text-amber-700 mb-4">
                                                <Lightbulb className="w-4 h-4" />
                                                Pro Tips
                                              </div>
                                              <ul className="space-y-3">
                                                {task.tips.map((tip, idx) => (
                                                  <li key={idx} className="flex items-start gap-3 text-sm text-amber-900">
                                                    <Star className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                                    <span>{tip}</span>
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}

                                          {/* Resources */}
                                          {task.resources && task.resources.length > 0 && (
                                            <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
                                              <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 mb-4">
                                                <ExternalLink className="w-4 h-4" />
                                                Resources
                                              </div>
                                              <div className="flex flex-wrap gap-2">
                                                {task.resources.map((resource, idx) => (
                                                  <span key={idx} className="text-xs px-3 py-2 bg-white text-emerald-700 rounded-lg border border-emerald-200 hover:bg-emerald-100 cursor-pointer transition-colors font-medium">
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
                                <Lightbulb className="w-5 h-5 text-purple-600" />
                                Expert Tips
                              </h4>
                              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-5">
                                <ul className="space-y-3">
                                  {phase.proTips.map((tip, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm text-purple-900">
                                      <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
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
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                                Avoid These Mistakes
                              </h4>
                              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-200 p-5">
                                <ul className="space-y-3">
                                  {phase.commonMistakes.map((mistake, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm text-red-900">
                                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
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
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between flex-wrap gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {new Date(metadata.generatedAt).toLocaleString()}
                  </span>
                  {metadata.fromDatabase && (
                    <span className="flex items-center gap-1.5 text-green-600 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Synced from database
                    </span>
                  )}
                  {metadata.tasksSynced > 0 && (
                    <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                      <RefreshCw className="w-4 h-4" />
                      {metadata.tasksSynced} tasks updated
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
                  className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${generatingTimeline ? 'animate-spin' : ''}`} />
                  Regenerate Timeline
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <Sparkles className="w-12 h-12 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Generate Your Timeline</h3>
          <p className="text-gray-600 max-w-lg mx-auto mb-8">
            Select a university above to generate a personalized AI-powered timeline with actionable steps for your application
          </p>
          {selectedUniversity && (
            <button
              onClick={() => generateTimeline(selectedUniversity)}
              disabled={generatingTimeline}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 transition-all font-semibold inline-flex items-center gap-3 disabled:opacity-50 shadow-lg shadow-indigo-600/25"
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