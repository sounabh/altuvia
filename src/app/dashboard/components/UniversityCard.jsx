"use client"

import React, { useState } from 'react';
import {
  MapPin, Calendar, FileText, CheckCircle2, Clock, TrendingUp, Heart,
  Sparkles, Target, Zap, Brain, ListChecks
} from 'lucide-react';
import Link from 'next/link';
import { toast } from "sonner";
import { useSession } from "next-auth/react";

// ─── Nearest deadline finder ──────────────────────────────────────────────────
function findNearestDeadlineIndex(processedDeadlines) {
  const now = new Date();
  let nearestIndex = -1;
  let minDiff = Infinity;
  processedDeadlines.forEach((deadline, idx) => {
    let d = new Date(deadline.date);
    if (isNaN(d.getTime())) d = new Date(`${deadline.date}, ${now.getFullYear()}`);
    if (isNaN(d.getTime())) return;
    const diff = Math.abs(d - now);
    if (diff < minDiff) { minDiff = diff; nearestIndex = idx; }
  });
  return nearestIndex;
}

// ─── Deadline block ───────────────────────────────────────────────────────────
function DeadlineBlock({ formattedDeadlines, hasMultipleRounds, showAllDeadlines, onToggle }) {
  if (!formattedDeadlines || formattedDeadlines.length === 0) return null;

  const processedDeadlines = formattedDeadlines.map((d, i) => ({ ...d, originalIndex: i }));
  const nearestIndex = findNearestDeadlineIndex(processedDeadlines);
  const displayDeadlines = showAllDeadlines
    ? processedDeadlines
    : nearestIndex !== -1
      ? [processedDeadlines[nearestIndex]]
      : processedDeadlines.slice(0, 1);

  return (
    <div className="bg-white/60 rounded-lg p-3 mb-2 border border-white/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase text-gray-400">Deadlines</span>
        {hasMultipleRounds && (
          <button 
            type="button" 
            onClick={onToggle} 
            className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full hover:bg-blue-200 active:bg-blue-300 transition-colors font-medium cursor-pointer select-none"
            aria-label={showAllDeadlines ? "Show fewer deadlines" : `Show all ${formattedDeadlines.length} deadlines`}
          >
            {showAllDeadlines ? "Show Less" : `Show All ${formattedDeadlines.length} Rounds`}
          </button>
        )}
      </div>
      <div className="space-y-2.5">
        {displayDeadlines.map((deadline, idx) => {
          const isNearest = deadline.originalIndex === nearestIndex;
          return (
            <div key={idx} className="flex items-start gap-2">
              <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${isNearest ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
              <div className="flex flex-col">
                <span className={`text-[12px] font-bold leading-none ${isNearest ? 'text-red-600' : 'text-gray-600'}`}>
                  {deadline.round}
                </span>
                <span className={`text-[11px] mt-0.5 ${isNearest ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                  {deadline.date}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Card inner content ───────────────────────────────────────────────────────
// Defined OUTSIDE UniversityCard so React doesn't remount it on every render
function CardInner({
  university, universityUrl, headless,
  hasAITimeline, aiTimeline, timelineProgress,
  completedTimelineTasks, totalTimelineTasks, timelineStatusConfig,
  hasAnyContent, hasEssays, hasTasks,
  essaysFullyComplete, tasksFullyComplete,
  completedEssays, totalEssays, completedTasks, totalTasks,
  essayProgressPercentage, taskProgressPercentage,
  formattedDeadlines, hasMultipleRounds,
  showAllDeadlines, onDeadlineToggle,
}) {
  return (
    <div className="flex flex-col">
      {/* Clickable header — name + location navigate to university page */}
      <Link href={universityUrl} className="block group/link cursor-pointer">
        <h3 className={`text-[#002147] font-bold leading-tight mb-1 group-hover/link:text-[#3598FE] transition-colors ${headless ? 'text-[15px]' : 'text-[17px]'}`}>
          {university.name || university.universityName}
        </h3>
        <div className={`flex items-center mb-4 ${headless ? 'text-[12px] text-gray-400' : 'text-[13px] text-gray-500'}`}>
          <MapPin className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
          {university.location}
        </div>
      </Link>

      {/* AI Timeline */}
      {hasAITimeline && (
        <div className="mb-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-3 border border-purple-100/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                <Brain className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">AI Timeline</span>
            </div>
            <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${timelineStatusConfig.bg} ${timelineStatusConfig.text_color} flex items-center gap-1`}>
              <timelineStatusConfig.icon className="w-3 h-3" />
              {timelineStatusConfig.text}
            </div>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-[11px] font-medium text-purple-700 mb-1">
              <span>Overall Progress</span>
              <span>{timelineProgress}%</span>
            </div>
            <div className="w-full bg-white/60 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500 relative"
                style={{ width: `${timelineProgress}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-purple-700">
              <ListChecks className="w-3.5 h-3.5" />
              <span className="font-semibold">{completedTimelineTasks}/{totalTimelineTasks}</span>
              <span className="text-purple-500">tasks done</span>
            </div>
            {aiTimeline?.targetDeadline && (
              <div className="flex items-center gap-1 text-[10px] text-purple-600">
                <Target className="w-3 h-3" />
                <span>Target: {new Date(aiTimeline.targetDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            )}
          </div>
          {aiTimeline?.totalPhases > 0 && (
            <div className="mt-2 pt-2 border-t border-purple-100/50">
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(aiTimeline.totalPhases, 5) }).map((_, i) => {
                  const phaseProgress = (timelineProgress / 100) * aiTimeline.totalPhases;
                  const isComplete = i < Math.floor(phaseProgress);
                  const isCurrent = i === Math.floor(phaseProgress);
                  return (
                    <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                      isComplete ? 'bg-gradient-to-r from-purple-500 to-indigo-600'
                        : isCurrent ? 'bg-purple-300' : 'bg-white/60'
                    }`} />
                  );
                })}
              </div>
              <div className="text-[10px] text-purple-500 mt-1 text-center">{aiTimeline.totalPhases} phases total</div>
            </div>
          )}
        </div>
      )}

      {/* Progress Summary */}
      {hasAnyContent && !essaysFullyComplete && !tasksFullyComplete && !hasAITimeline && (
        <div className="mb-3 bg-blue-50/50 rounded-lg p-2.5 border border-blue-100">
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block mb-1.5">Analysis</span>
          <div className="space-y-1">
            {hasEssays && !essaysFullyComplete && (
              <div className="text-[11px] text-blue-700 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                {totalEssays - completedEssays} essays remaining
              </div>
            )}
            {hasTasks && !tasksFullyComplete && (
              <div className="text-[11px] text-blue-700 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                {totalTasks - completedTasks} tasks remaining
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Bars */}
      <div className="space-y-3 mb-4">
        {hasEssays && (
          <div>
            <div className="flex justify-between text-[12px] font-semibold text-gray-600 mb-1">
              <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Essays</span>
              <span className={essaysFullyComplete ? "text-green-600" : ""}>{completedEssays}/{totalEssays}</span>
            </div>
            <div className="w-full bg-white/50 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full ${essaysFullyComplete ? 'bg-green-500' : 'bg-[#3598FE]'}`} style={{ width: `${essayProgressPercentage}%` }} />
            </div>
          </div>
        )}
        {hasTasks && (
          <div>
            <div className="flex justify-between text-[12px] font-semibold text-gray-600 mb-1">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Events</span>
              <span className={tasksFullyComplete ? "text-green-600" : ""}>{completedTasks}/{totalTasks}</span>
            </div>
            <div className="w-full bg-white/50 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full ${tasksFullyComplete ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${taskProgressPercentage}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Deadlines — outside Link, fully interactive */}
      <DeadlineBlock
        formattedDeadlines={formattedDeadlines}
        hasMultipleRounds={hasMultipleRounds}
        showAllDeadlines={showAllDeadlines}
        onToggle={onDeadlineToggle}
      />

      {/* CTA */}
      <Link href={universityUrl} className="mt-2 flex items-center justify-end cursor-pointer group/cta">
        <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#3598FE] transition-all">
          View Details
          <div className="w-6 h-6 rounded-full bg-[#3598FE]/10 flex items-center justify-center group-hover/cta:bg-[#3598FE] group-hover/cta:scale-110 transition-all duration-300">
            <TrendingUp className="w-3.5 h-3.5 text-[#3598FE] group-hover/cta:text-white transition-colors" />
          </div>
        </div>
      </Link>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export const UniversityCard = ({ university, index = 0, onRemove, onUpdate, headless = false }) => {
  const [isAdded, setIsAdded] = useState(Boolean(university.isAdded));
  const [showAllDeadlines, setShowAllDeadlines] = useState(true);
  const { data: session, status } = useSession();

  const variations = [
    { border: "border-blue-100", bg: "bg-blue-50/30" },
    { border: "border-purple-100", bg: "bg-purple-50/30" },
    { border: "border-emerald-100", bg: "bg-emerald-50/30" },
    { border: "border-rose-100", bg: "bg-rose-50/30" },
  ];
  const style = variations[index % variations.length];

  const aiTimeline = university.aiTimeline;
  const hasAITimeline = !!aiTimeline;
  const timelineProgress = aiTimeline?.overallProgress || 0;
  const completedTimelineTasks = aiTimeline?.completedTasks || 0;
  const totalTimelineTasks = aiTimeline?.totalTasks || 0;
  const timelineStatus = aiTimeline?.completionStatus || 'not_started';

  const getFormattedDeadlines = () => {
    let result = [];
    if (Array.isArray(university?.roundDeadlines) && university.roundDeadlines.length > 0) {
      result = university.roundDeadlines.map((d, idx) => {
        const trimmed = d.trim();
        const match = trimmed.match(/^(Round\s*\d+|Deferred)\s*:\s*(.+)$/i);
        if (match) return { round: match[1].replace(/\s+/g, ' ').trim(), date: match[2].trim() };
        return { round: `Round ${idx + 1}`, date: trimmed };
      });
    } else if (typeof university?.averageDeadlines === 'string' && university.averageDeadlines.trim()) {
      const parts = university.averageDeadlines.trim().split(/(?=(?:Round\s*\d+|Deferred)\s*:)/gi).filter(Boolean);
      parts.forEach((part, idx) => {
        const trimmedPart = part.trim().replace(/,\s*$/, '').replace(/\s*,$/, '');
        const match = trimmedPart.match(/(Round\s*\d+|Deferred)\s*:\s*(.+)/i);
        if (match) {
          result.push({
            round: match[1].replace(/round\s*/i, 'Round ').trim(),
            date: match[2].trim().replace(/,\s*$/, '').replace(/\s+/g, ' '),
          });
        } else if (trimmedPart && !trimmedPart.match(/^\s*$/)) {
          result.push({ round: `Round ${idx + 1}`, date: trimmedPart.replace(/,\s*$/, '') });
        }
      });
    }
    result.sort((a, b) => {
      const aNum = parseInt(a.round.match(/\d+/)?.[0] || '999');
      const bNum = parseInt(b.round.match(/\d+/)?.[0] || '999');
      return aNum - bNum;
    });
    return result.length > 0 ? result : null;
  };

  const formattedDeadlines = getFormattedDeadlines();
  const hasMultipleRounds = formattedDeadlines && formattedDeadlines.length > 1;

  const totalEssays = university.totalEssays || 0;
  const completedEssays = university.completedEssays || 0;
  const totalTasks = university.totalTasks || 0;
  const completedTasks = university.tasks || 0;
  const essayProgressPercentage = totalEssays > 0 ? Math.round((completedEssays / totalEssays) * 100) : 0;
  const taskProgressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const essaysFullyComplete = university.stats?.applicationHealth?.essaysFullyComplete;
  const tasksFullyComplete = university.stats?.applicationHealth?.tasksFullyComplete;
  const readyForSubmission = university.stats?.applicationHealth?.readyForSubmission;

  const hasEssays = totalEssays > 0;
  const hasTasks = totalTasks > 0;
  const hasAnyContent = hasEssays || hasTasks;

  const universityUrl = university.slug
    ? `/dashboard/university/${university.slug}`
    : `/dashboard/university/${university.id}`;
  const isAuthenticated = status === "authenticated" && !!session?.token;

  const toggleHeart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) return;

    // Store the previous state BEFORE changing it
    const previousState = isAdded;
    
    // Optimistically update UI
    setIsAdded(!previousState);

    // Remove from dashboard if already added
    if (onRemove && previousState) {
      onRemove(university.id);
      toast("University removed from dashboard", {
        style: { background: '#002147', color: 'white', border: 'none' },
        duration: 2000,
      });
    } 
    // Add to dashboard if not added
    else {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
        await fetch(`${API_BASE_URL}/api/university/toggleSaved`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${session.token}` 
          },
          body: JSON.stringify({ universityId: university?.id }),
        });
      } catch (err) {
        // Rollback state on error - use previousState, not isAdded
        setIsAdded(previousState);
        toast("Failed to update university", {
          style: { background: '#E11D48', color: 'white', border: 'none' },
          duration: 2000,
        });
      }
    }
  };

  const getStatusText = (s) => {
    switch (s) {
      case 'submitted': return 'Submitted';
      case 'in-progress':
        if (essaysFullyComplete && !tasksFullyComplete) return 'Essays Done';
        if (!essaysFullyComplete && tasksFullyComplete) return 'Events Done';
        return 'In Progress';
      default: return 'Not Started';
    }
  };

  const getTimelineStatusConfig = (s) => {
    switch (s) {
      case 'completed': return { text: 'Completed', bg: 'bg-green-100', text_color: 'text-green-700', icon: CheckCircle2 };
      case 'in_progress': return { text: 'In Progress', bg: 'bg-blue-100', text_color: 'text-blue-700', icon: Zap };
      case 'on_track': return { text: 'On Track', bg: 'bg-emerald-100', text_color: 'text-emerald-700', icon: Target };
      case 'behind': return { text: 'Behind', bg: 'bg-amber-100', text_color: 'text-amber-700', icon: Clock };
      case 'at_risk': return { text: 'At Risk', bg: 'bg-red-100', text_color: 'text-red-700', icon: Clock };
      default: return { text: 'Not Started', bg: 'bg-gray-100', text_color: 'text-gray-600', icon: Brain };
    }
  };

  const timelineStatusConfig = getTimelineStatusConfig(timelineStatus);

  const handleDeadlineToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAllDeadlines(prev => !prev);
  };

  const innerProps = {
    university, universityUrl, headless,
    hasAITimeline, aiTimeline, timelineProgress,
    completedTimelineTasks, totalTimelineTasks, timelineStatusConfig,
    hasAnyContent, hasEssays, hasTasks,
    essaysFullyComplete, tasksFullyComplete,
    completedEssays, totalEssays, completedTasks, totalTasks,
    essayProgressPercentage, taskProgressPercentage,
    formattedDeadlines, hasMultipleRounds,
    showAllDeadlines,
    onDeadlineToggle: handleDeadlineToggle,
  };

  // ─── Headless mode ────────────────────────────────────────────────────────
  if (headless) {
    return (
      <div className={`flex flex-col ${style.bg} p-4 relative overflow-hidden rounded-2xl border ${style.border}`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50/50 to-transparent rounded-bl-[4rem] -z-10" />
        <CardInner {...innerProps} />
      </div>
    );
  }

  // ─── Full mode ────────────────────────────────────────────────────────────
  return (
    <div className="group relative flex flex-col w-full break-inside-avoid">
      {/* Image */}
      <div className="relative h-52 w-full mb-3 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300">
        <img
          src={university.image || '/default-university.jpg'}
          alt={`${university.name || "University"} campus`}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          onError={(e) => { e.target.src = '/default-university.jpg'; }}
        />
        <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:opacity-0" />

        {/* Status Badge - Top Right Corner */}
        <div className="absolute top-3 right-3 z-20 pointer-events-none">
          <div className="px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-lg text-[11px] font-bold tracking-wide uppercase text-[#002147] shadow-sm flex items-center gap-1">
            {readyForSubmission && university.status !== 'submitted' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
            {getStatusText(university.status)}
          </div>
        </div>

        {/* Remove/Save Button - Top Left Corner */}
        <button
          type="button"
          onClick={toggleHeart}
          className="absolute top-3 left-3 z-30 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide uppercase transition-all duration-300 shadow-md backdrop-blur-md flex items-center gap-1.5 bg-white text-[#E11D48] hover:bg-red-50 cursor-pointer active:scale-95 pointer-events-auto"
          aria-label={isAdded ? "Remove university from dashboard" : "Save university to dashboard"}
        >
          <Heart className="w-3 h-3 fill-current" />
          <span>Added</span>
        </button>

        {/* AI Timeline Badge - Bottom Right (Conditional) */}
        {hasAITimeline && (
          <div className="absolute bottom-3 right-3 z-20 pointer-events-none">
            <div className="px-2.5 py-1 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg text-[10px] font-bold tracking-wide uppercase text-white shadow-md flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              AI Timeline Active
            </div>
          </div>
        )}

        {/* Completion Status Icons - Bottom Left */}
        {(essaysFullyComplete || tasksFullyComplete) && university.status !== 'submitted' && (
          <div className="absolute bottom-3 left-3 z-20 flex gap-1 pointer-events-none">
            {essaysFullyComplete && hasEssays && (
              <div className="bg-green-500 text-white rounded-full p-1 shadow-sm" title="Essays Complete">
                <FileText className="w-3.5 h-3.5" />
              </div>
            )}
            {tasksFullyComplete && hasTasks && (
              <div className="bg-blue-500 text-white rounded-full p-1 shadow-sm" title="Tasks Complete">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`flex flex-col ${style.bg} rounded-2xl p-4 border ${style.border} shadow-sm transition-all duration-300 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50/50 to-transparent rounded-bl-[4rem] -z-10" />
        <CardInner {...innerProps} />
      </div>
    </div>
  );
};