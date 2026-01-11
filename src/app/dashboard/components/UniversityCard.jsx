"use client"

import React, { useState } from 'react';
import { MapPin, Calendar, FileText, CheckCircle2, Clock, TrendingUp, Heart } from 'lucide-react';
import Link from 'next/link';
import Image from "next/image";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/**
 * Enhanced University card component with clean deadline display
 * NOW WITH CUTOUT DESIGN (Similar to Search Page)
 */
export const UniversityCard = ({ university, index = 0, onRemove, onUpdate }) => {
  const [isAdded, setIsAdded] = useState(Boolean(university.isAdded));
  const [showAllDeadlines, setShowAllDeadlines] = useState(true); // Changed to true - show all by default
  const { data: session, status } = useSession();
  const router = useRouter();

  // Color variations for the content block (matches Search Grid)
  const variations = [
    { border: "border-blue-100", bg: "bg-blue-50/30" },
    { border: "border-purple-100", bg: "bg-purple-50/30" },
    { border: "border-emerald-100", bg: "bg-emerald-50/30" },
    { border: "border-rose-100", bg: "bg-rose-50/30" },
  ];
  const style = variations[index % variations.length];

  // Logic: Formatted Deadlines
  const getFormattedDeadlines = () => {
    let formattedDeadlines = [];
    if (Array.isArray(university?.roundDeadlines) && university.roundDeadlines.length > 0) {
      formattedDeadlines = university.roundDeadlines.map((d, idx) => {
        const trimmed = d.trim();
        const match = trimmed.match(/^(Round\s*\d+|Deferred)\s*:\s*(.+)$/i);
        if (match) return { round: match[1].replace(/\s+/g, ' ').trim(), date: match[2].trim() };
        return { round: `Round ${idx + 1}`, date: trimmed };
      });
    } else if (typeof university?.averageDeadlines === 'string' && university.averageDeadlines.trim()) {
      const deadlineStr = university.averageDeadlines.trim();
      const parts = deadlineStr.split(/(?=(?:Round\s*\d+|Deferred)\s*:)/gi).filter(Boolean);
      parts.forEach((part, idx) => {
        const trimmedPart = part.trim().replace(/,\s*$/, '').replace(/\s*,$/, '');
        const match = trimmedPart.match(/(Round\s*\d+|Deferred)\s*:\s*(.+)/i);
        if (match) {
          formattedDeadlines.push({ round: match[1].replace(/round\s*/i, 'Round ').trim(), date: match[2].trim().replace(/,\s*$/, '').replace(/\s+/g, ' ') });
        } else if (trimmedPart && !trimmedPart.match(/^\s*$/)) {
          formattedDeadlines.push({ round: `Round ${idx + 1}`, date: trimmedPart.replace(/,\s*$/, '').trim() });
        }
      });
    }
    formattedDeadlines.sort((a, b) => {
      const aNum = parseInt(a.round.match(/\d+/)?.[0] || '999');
      const bNum = parseInt(b.round.match(/\d+/)?.[0] || '999');
      return aNum - bNum;
    });
    return formattedDeadlines.length > 0 ? formattedDeadlines : null;
  };

  const formattedDeadlines = getFormattedDeadlines();
  const hasMultipleRounds = formattedDeadlines && formattedDeadlines.length > 1;

  // Logic: Stats & Progress
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

  const universityUrl = university.slug ? `/dashboard/university/${university.slug}` : `/dashboard/university/${university.id}`;
  const isAuthenticated = status === "authenticated" && !!session?.token;

  // Logic: Toggle Heart
  const toggleHeart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) return;

    setIsAdded(!isAdded);

    if (onRemove && isAdded) {
      onRemove(university.id);
      toast("University removed from dashboard", {
        style: { background: '#002147', color: 'white', border: 'none' },
        duration: 2000,
      });
    } else {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
        await fetch(`${API_BASE_URL}/api/university/toggleSaved`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` },
          body: JSON.stringify({ universityId: university?.id }),
        });
      } catch (err) {
        setIsAdded(isAdded);
      }
    }
  };

  // Logic: Status Text
  const getStatusText = (status) => {
    switch (status) {
      case 'submitted': return 'Submitted';
      case 'in-progress':
        if (essaysFullyComplete && !tasksFullyComplete) return 'Essays Done';
        if (!essaysFullyComplete && tasksFullyComplete) return 'Tasks Done';
        return 'In Progress';
      default: return 'Not Started';
    }
  };

  return (
    <div className="group relative flex flex-col w-full break-inside-avoid">

      {/* 1. Image Block - Cutout Style */}
      <div className="relative h-52 w-full mb-3 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300">
        <img
          src={university.image || '/default-university.jpg'}
          alt={university.name || "University Image"}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          onError={(e) => { e.target.src = '/default-university.jpg'; }}
        />
        <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:opacity-0" />

        {/* Status Badge - Top Right */}
        <div className="absolute top-3 right-3">
          <div className="px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-lg text-[11px] font-bold tracking-wide uppercase text-[#002147] shadow-sm flex items-center gap-1">
            {readyForSubmission && university.status !== 'submitted' && (
              <CheckCircle2 className="w-3 h-3 text-green-500" />
            )}
            {getStatusText(university.status)}
          </div>
        </div>

        {/* Remove Button - Top Left */}
        <button
          onClick={toggleHeart}
          className={`absolute top-3 left-3 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide uppercase transition-all duration-300 shadow-sm backdrop-blur-md flex items-center gap-1.5 bg-white text-[#E11D48] shadow-md hover:bg-gray-50`}
        >
          <Heart className="w-3 h-3 fill-current" />
          <span>Added</span>
        </button>

        {/* Completion Icons - Bottom Left Overlay */}
        {(essaysFullyComplete || tasksFullyComplete) && university.status !== 'submitted' && (
          <div className="absolute bottom-3 left-3 flex gap-1">
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

      {/* 2. Content Block - Cutout Style with Logic */}
      <div className={`flex flex-col ${style.bg} rounded-2xl p-4 border ${style.border} shadow-sm transition-all duration-300 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden`}>
        {/* Subtle Background Pattern */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50/50 to-transparent rounded-bl-[4rem] -z-10" />

        <Link href={universityUrl} className="block">
          {/* Header */}
          <h3 className="text-[#002147] font-bold text-[17px] leading-tight mb-1.5 group-hover:text-[#3598FE] transition-colors">
            {university.name || university.universityName}
          </h3>
          <div className="flex items-center text-gray-500 text-[13px] mb-4">
            <MapPin className="w-3.5 h-3.5 mr-1" />
            {university.location}
          </div>

          {/* Progress Summary Box */}
          {hasAnyContent && !essaysFullyComplete && !tasksFullyComplete && (
            <div className="mb-3 bg-blue-50/50 rounded-lg p-2.5 border border-blue-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Analysis</span>
              </div>
              <div className="space-y-1">
                {hasEssays && !essaysFullyComplete && (
                  <div className="text-[11px] text-blue-700 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                    {university.totalEssays - completedEssays} essays remaining
                  </div>
                )}
                {hasTasks && !tasksFullyComplete && (
                  <div className="text-[11px] text-blue-700 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                    {totalTasks - completedTasks} tasks remaining
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tracking Section */}
          <div className="space-y-3 mb-4">
            {/* Essays Bar */}
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

            {/* Tasks Bar */}
            {hasTasks && (
              <div>
                <div className="flex justify-between text-[12px] font-semibold text-gray-600 mb-1">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Tasks</span>
                  <span className={tasksFullyComplete ? "text-green-600" : ""}>{completedTasks}/{totalTasks}</span>
                </div>
                <div className="w-full bg-white/50 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${tasksFullyComplete ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${taskProgressPercentage}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Deadlines Section - All Rounds Visible by Default */}
          {formattedDeadlines && formattedDeadlines.length > 0 && (() => {
            const now = new Date();
            let nearestIndex = -1;
            let minDiff = Infinity;

            const processedDeadlines = formattedDeadlines.map((d, i) => ({ ...d, originalIndex: i }));

            processedDeadlines.forEach((deadline, idx) => {
              const dateStr = deadline.date;
              let d = new Date(dateStr);
              if (isNaN(d.getTime())) {
                d = new Date(`${dateStr}, ${now.getFullYear()}`);
              }
              if (isNaN(d.getTime())) return;

              if (d < now) {
                d.setFullYear(d.getFullYear() + 1);
              }

              const diff = d - now;
              if (diff >= 0 && diff < minDiff) {
                minDiff = diff;
                nearestIndex = idx;
              }
            });

            // Always show all deadlines when showAllDeadlines is true (default)
            let displayDeadlines;
            if (showAllDeadlines) {
              displayDeadlines = processedDeadlines;
            } else {
              if (nearestIndex !== -1) {
                displayDeadlines = [processedDeadlines[nearestIndex]];
              } else {
                displayDeadlines = processedDeadlines.slice(0, 1);
              }
            }

            const checkIsUpcoming = (originalIndex) => originalIndex === nearestIndex;

            return (
              <div className="bg-white/60 rounded-lg p-3 mb-2 border border-white/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase text-gray-400">Deadlines</span>
                  {hasMultipleRounds && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowAllDeadlines(!showAllDeadlines);
                      }}
                      className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full hover:bg-blue-200 transition-colors font-medium"
                    >
                      {showAllDeadlines ? "Show Less" : `Show All ${formattedDeadlines.length} Rounds`}
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {displayDeadlines.map((deadline, idx) => {
                    const isUpcoming = checkIsUpcoming(deadline.originalIndex);
                    const isDefaultActive = idx === 0 && nearestIndex === -1;

                    return (
                      <div key={idx} className="flex items-start gap-2">
                        <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${isUpcoming ? 'bg-red-600 animate-pulse' : (isDefaultActive ? 'bg-[#E11D48]' : 'bg-gray-400')}`}></span>
                        <div className="flex flex-col">
                          <span className={`text-[12px] font-bold leading-none ${isUpcoming ? 'text-red-600' : (isDefaultActive ? 'text-[#002147]' : 'text-gray-600')}`}>
                            {deadline.round}
                          </span>
                          <span className={`text-[11px] mt-0.5 ${isUpcoming ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                            {deadline.date}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* View Details */}
          <div className="mt-2 flex items-center justify-end">
            <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#3598FE] group/btn transition-all">
              View Details
              <div className="w-6 h-6 rounded-full bg-[#3598FE]/10 flex items-center justify-center group-hover/btn:bg-[#3598FE] group-hover/btn:scale-110 transition-all duration-300">
                <TrendingUp className="w-3.5 h-3.5 text-[#3598FE] group-hover/btn:text-white transition-colors" />
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default UniversityCard;