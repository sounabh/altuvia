"use client"

import React, { useState } from 'react';
import { MapPin, Calendar, FileText, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/**
 * Enhanced University card component with clean deadline display
 */
export const UniversityCard = ({ university, onRemove, onUpdate }) => {
  const [isAdded, setIsAdded] = useState(Boolean(university.isAdded));
  const [showAllDeadlines, setShowAllDeadlines] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  // FIXED: Improved deadline parsing logic
  const getFormattedDeadlines = () => {
    let formattedDeadlines = [];

    // Case 1: roundDeadlines is already an array
    if (Array.isArray(university?.roundDeadlines) && university.roundDeadlines.length > 0) {
      formattedDeadlines = university.roundDeadlines.map((d, idx) => {
        const trimmed = d.trim();
        // Match patterns like "Round 1: September 2025" or "Round1: September 2025"
        const match = trimmed.match(/^(Round\s*\d+|Deferred)\s*:\s*(.+)$/i);
        if (match) {
          return {
            round: match[1].replace(/\s+/g, ' ').trim(), // Normalize "Round1" to "Round 1"
            date: match[2].trim()
          };
        }
        // If no round label, assign one
        return { round: `Round ${idx + 1}`, date: trimmed };
      });
    } 
    // Case 2: averageDeadlines is a string that needs parsing
    else if (typeof university?.averageDeadlines === 'string' && university.averageDeadlines.trim()) {
      const deadlineStr = university.averageDeadlines.trim();
      
      // Use lookahead to split at each "Round X:" or "Deferred:" while keeping the delimiter
      const parts = deadlineStr.split(/(?=(?:Round\s*\d+|Deferred)\s*:)/gi).filter(Boolean);
      
      parts.forEach((part, idx) => {
        const trimmedPart = part.trim()
          .replace(/,\s*$/, '')  // Remove trailing comma
          .replace(/^\s*,/, ''); // Remove leading comma
        
        // Match the round pattern
        const match = trimmedPart.match(/^(Round\s*\d+|Deferred)\s*:\s*(.+)$/i);
        
        if (match) {
          const roundLabel = match[1].replace(/round\s*/i, 'Round ').trim(); // Normalize to "Round X"
          const dateValue = match[2]
            .trim()
            .replace(/,\s*$/, '')  // Remove trailing comma
            .replace(/\s+/g, ' '); // Normalize whitespace
          
          if (roundLabel && dateValue) {
            formattedDeadlines.push({ 
              round: roundLabel, 
              date: dateValue 
            });
          }
        } else if (trimmedPart && !trimmedPart.match(/^\s*$/)) {
          // Fallback for entries without round label
          formattedDeadlines.push({ 
            round: `Round ${idx + 1}`, 
            date: trimmedPart.replace(/,\s*$/, '').trim() 
          });
        }
      });
    }

    // Sort rounds by number (Round 1, Round 2, etc.)
    formattedDeadlines.sort((a, b) => {
      const aNum = parseInt(a.round.match(/\d+/)?.[0] || '999');
      const bNum = parseInt(b.round.match(/\d+/)?.[0] || '999');
      return aNum - bNum;
    });

    return formattedDeadlines.length > 0 ? formattedDeadlines : null;
  };

  const formattedDeadlines = getFormattedDeadlines();
  const hasMultipleRounds = formattedDeadlines && formattedDeadlines.length > 1;

  /**
   * Toggle heart - Add/Remove from saved universities
   */
  const toggleHeart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Check authentication
    if (status !== "authenticated" || !session?.token) {
      toast.error("Please login to save universities", {
        description: "You need to be logged in to save universities to your dashboard"
      });
      router.push('/');
      return;
    }

    const previousState = isAdded;
    const newState = !isAdded;

    // ✨ INSTANT UI UPDATE
    setIsAdded(newState);

    // Show immediate feedback
    if (newState) {
      toast.success("University added to dashboard", {
        style: {
          background: '#3598FE',
          color: 'white',
          border: 'none',
        },
        duration: 2000,
      });
    } else {
      toast("University removed from dashboard", {
        style: {
          background: '#002147',
          color: 'white',
          border: 'none',
        },
        duration: 2000,
      });
    }

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

      const response = await fetch(`${API_BASE_URL}/api/university/toggleSaved`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ universityId: university?.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsAdded(data.isAdded);
        
        if (onUpdate) {
          onUpdate();
        }
      } else {
        // Revert on failure
        setIsAdded(previousState);
        toast.error(`Failed to ${newState ? 'save' : 'remove'} university. Please try again.`);
      }
    } catch (error) {
      console.error('Toggle saved error:', error);
      // Revert on failure
      setIsAdded(previousState);
      toast.error("Network error. Please check your connection and try again.");
    }
  };

  const getStatusText = (status) => {
    const essaysComplete = university.stats?.applicationHealth?.essaysFullyComplete;
    const tasksComplete = university.stats?.applicationHealth?.tasksFullyComplete;
    const hasEssays = university.totalEssays > 0;
    const hasTasks = university.totalTasks > 0;

    switch (status) {
      case 'submitted':
        return 'Submitted';
      case 'in-progress':
        if (essaysComplete && hasEssays && !tasksComplete && hasTasks) {
          return 'Essays Done';
        } else if (!essaysComplete && hasEssays && tasksComplete && hasTasks) {
          return 'Tasks Done';
        } else if (essaysComplete && hasEssays && !hasTasks) {
          return 'Essays Done';
        } else if (tasksComplete && hasTasks && !hasEssays) {
          return 'Tasks Done';
        } else {
          return 'In Progress';
        }
      default:
        return 'Not Started';
    }
  };

  const essayProgressPercentage = university.totalEssays > 0
    ? Math.round((university.completedEssays / university.totalEssays) * 100)
    : 0;

  const totalTasks = university.totalTasks || 0;
  const completedTasks = university.tasks || 0;
  const taskProgressPercentage = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  const essaysFullyComplete = university.stats?.applicationHealth?.essaysFullyComplete;
  const tasksFullyComplete = university.stats?.applicationHealth?.tasksFullyComplete;
  const readyForSubmission = university.stats?.applicationHealth?.readyForSubmission;

  const hasEssays = university.totalEssays > 0;
  const hasTasks = totalTasks > 0;
  const hasAnyContent = hasEssays || hasTasks;

  const universityUrl = university.slug
    ? `/dashboard/university/${university.slug}`
    : `/dashboard/university/${university.id}`;

  // Check if user is authenticated for conditional rendering
  const isAuthenticated = status === "authenticated" && !!session?.token;

  return (
    <div className="group relative bg-white border border-gray-200 transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col hover:shadow-lg rounded-lg">
      <Link href={universityUrl} className="flex flex-col flex-grow">
        {/* University Image Section */}
        <div className="relative h-64 overflow-hidden">
          <img
            src={university.image || '/default-university.jpg'}
            alt={university.name || university.universityName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.src = '/default-university.jpg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#002147]/90 via-[#002147]/40 to-transparent" />

          {/* University Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
            <h3 className="text-white font-semibold text-xl mb-2 leading-tight">
              {university.name || university.universityName}
            </h3>
            <div className="flex items-center text-white/90 text-sm">
              <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
              <span>{university.location}</span>
            </div>
          </div>
        </div>

        {/* Card Content Section */}
        <div className="p-5 flex-grow flex flex-col bg-gray-50">
          <div className="space-y-4">
            {/* Deadline Section - FIXED: Consistent Format */}
            {formattedDeadlines && formattedDeadlines.length > 0 && (
              <div className="bg-[#002147] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-300" />
                    <span className="text-sm font-semibold text-white">
                      {hasMultipleRounds ? 'Application Rounds' : 'Deadline'}
                    </span>
                  </div>
                  {hasMultipleRounds && (
                    <span className="text-xs bg-[#3598FE] text-white px-2 py-1 rounded-full">
                      {formattedDeadlines.length} Rounds
                    </span>
                  )}
                </div>
                
                {/* FIXED: Each round on its own line with consistent formatting */}
                <div className="space-y-3">
                  {(showAllDeadlines ? formattedDeadlines : formattedDeadlines.slice(0, 1)).map((deadline, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-[#3598FE] rounded-full flex-shrink-0 mt-1.5"></span>
                      <div className="flex flex-col">
                        <span className="text-sm text-white font-semibold">
                          {deadline.round}
                        </span>
                        <span className="text-sm text-blue-200">
                          {deadline.date}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Toggle button for multiple rounds */}
                {hasMultipleRounds && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowAllDeadlines(!showAllDeadlines);
                    }}
                    className="mt-3 w-full text-xs text-blue-300 hover:text-white transition-colors flex items-center justify-center gap-1 py-1 border-t border-blue-800 pt-3"
                  >
                    {showAllDeadlines ? (
                      <>Show Less ▲</>
                    ) : (
                      <>Show All {formattedDeadlines.length} Rounds ▼</>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Essay Progress Section */}
            {hasEssays && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-slate-600">
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Essays</span>
                    {essaysFullyComplete && (
                      <CheckCircle2 className="w-4 h-4 ml-1 text-green-500" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {university.completedEssays || 0}/{university.totalEssays || 0}
                  </span>
                </div>
                <div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        essaysFullyComplete
                          ? 'bg-gradient-to-r from-green-500 to-green-600'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600'
                      }`}
                      style={{ width: `${essayProgressPercentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {essayProgressPercentage}% Complete
                  </div>
                </div>
              </div>
            )}

            {/* Task Progress Section */}
            {hasTasks && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-slate-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Tasks</span>
                    {tasksFullyComplete && (
                      <CheckCircle2 className="w-4 h-4 ml-1 text-green-500" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {completedTasks}/{totalTasks}
                  </span>
                </div>
                <div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        tasksFullyComplete
                          ? 'bg-gradient-to-r from-green-500 to-green-600'
                          : 'bg-gradient-to-r from-amber-500 to-amber-600'
                      }`}
                      style={{ width: `${taskProgressPercentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {taskProgressPercentage}% Complete
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Stats Section */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              {hasTasks ? (
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-1">
                    {completedTasks}/{totalTasks}
                    {tasksFullyComplete && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <div className="text-xs text-slate-600 uppercase tracking-wide">Tasks</div>
                </div>
              ) : hasEssays ? (
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-1">
                    {university.completedEssays}/{university.totalEssays}
                    {essaysFullyComplete && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <div className="text-xs text-slate-600 uppercase tracking-wide">Essays</div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">0</div>
                  <div className="text-xs text-slate-600 uppercase tracking-wide">Items</div>
                </div>
              )}

              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {university.gmatAverage || university.gmatAverageScore || 'N/A'}
                </div>
                <div className="text-xs text-slate-600 uppercase tracking-wide">GMAT Avg</div>
              </div>
            </div>

            {/* Ready for Submission Banner */}
            {readyForSubmission && university.status !== 'submitted' && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-semibold">Ready for Submission!</span>
                </div>
                <div className="text-xs text-green-600 text-center mt-1">
                  {hasEssays && hasTasks
                    ? 'All essays and tasks completed'
                    : hasEssays
                    ? 'All essays completed'
                    : hasTasks
                    ? 'All tasks completed'
                    : 'Ready to submit'}
                </div>
              </div>
            )}

            {/* Progress Summary */}
            {university.status === 'in-progress' &&
              !readyForSubmission &&
              hasAnyContent && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm text-blue-800 font-medium mb-1">
                    Progress Summary
                  </div>
                  <div className="text-xs text-blue-700 space-y-1">
                    {hasEssays && !essaysFullyComplete && (
                      <div>
                        • {university.totalEssays - university.completedEssays} essays
                        remaining
                      </div>
                    )}
                    {hasTasks && !tasksFullyComplete && (
                      <div>• {totalTasks - completedTasks} tasks remaining</div>
                    )}
                  </div>
                </div>
              )}

            {/* No Content Message */}
            {!hasAnyContent && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="text-sm text-gray-600 text-center">
                  No essays or tasks configured yet
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Elements that should NOT be part of the Link */}
      {/* Add Button - Top Left */}
      <button
        onClick={toggleHeart}
        disabled={status === "loading"}
        className={`absolute top-4 left-4 px-3 py-1.5 rounded-md backdrop-blur-sm transition-all duration-200 text-xs font-medium z-20 ${
          isAdded
            ? "bg-[#3598FE] text-white"
            : "bg-white/95 text-[#002147] hover:bg-white"
        } ${status === "loading" ? "opacity-75 cursor-not-allowed" : ""}`}
        title={
          !isAuthenticated
            ? "Login to save universities"
            : isAdded
            ? "Remove from dashboard"
            : "Add to dashboard"
        }
      >
        {isAdded ? "Added" : "Add"}
      </button>

      {/* Status Badge - Top Right */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm z-20">
        {readyForSubmission && university.status !== 'submitted' && (
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
        )}
        <span className="text-xs font-semibold text-[#002147]">{getStatusText(university.status)}</span>
      </div>

      {/* Completion Indicator Icons */}
      {(essaysFullyComplete || tasksFullyComplete) && university.status !== 'submitted' && (
        <div className="absolute top-16 left-4 flex gap-1 z-20">
          {essaysFullyComplete && hasEssays && (
            <div className="bg-green-500 text-white rounded-full p-1" title="Essays Complete">
              <FileText className="w-3 h-3" />
            </div>
          )}
          {tasksFullyComplete && hasTasks && (
            <div className="bg-blue-500 text-white rounded-full p-1" title="Tasks Complete">
              <Calendar className="w-3 h-3" />
            </div>
          )}
        </div>
      )}

      {/* CTA Button - Also outside the Link */}
      <div className="p-5 pt-0 mt-4">
        <Link href={universityUrl} className="block">
          <button className="w-full bg-[#002147] hover:bg-[#3598FE] text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-all duration-700 ease-in-out transform hover:rounded-3xl">
            View Details →
          </button>
        </Link>
      </div>
    </div>
  );
};