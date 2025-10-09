import React, { useState } from 'react';
import { MapPin, Calendar, FileText, MoreHorizontal, Trash2, CheckCircle2, Heart } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import Link from 'next/link';
import { toast } from "sonner";

/**
 * Enhanced University card component with remove functionality
 */
export const UniversityCard = ({ university, onRemove, onUpdate }) => {
  const [isAdded, setIsAdded] = useState(Boolean(university.isAdded));
  const [isRemoving, setIsRemoving] = useState(false);

  // Debug: Log the university data
  console.log('Enhanced University data in card:', {
    id: university.id,
    name: university.name,
    status: university.status,
    isAdded: university.isAdded,
    tasks: university.tasks,
    totalTasks: university.totalTasks,
    completedEssays: university.completedEssays,
    totalEssays: university.totalEssays,
    applicationHealth: university.stats?.applicationHealth,
  });

  /**
   * Toggle heart - Add/Remove from saved universities
   */
  const toggleHeart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    let authData, token;

    try {
      authData = localStorage.getItem("authData");
      if (!authData) {
        toast.error("Please login to save universities");
        return;
      }

      const parsedAuth = JSON.parse(authData);
      token = parsedAuth.token;

      if (!token) {
        toast.error("Authentication expired, please login again");
        return;
      }
    } catch (error) {
      toast.error("Authentication error, please try again");
      return;
    }

    const previousState = isAdded;
    const newState = !isAdded;

    setIsAdded(newState);

    if (newState) {
      toast.success("University added to dashboard", {
        style: {
          background: '#ec4899',
          color: 'white',
          border: 'none',
        },
        duration: 2000,
      });
    } else {
      toast("University removed from dashboard", {
        style: {
          background: '#6b7280',
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ universityId: university?.id }),
      });

      if (response.ok) {
        if (onUpdate) {
          onUpdate();
        }
      } else {
        setIsAdded(previousState);
        toast.error(`Failed to ${newState ? 'save' : 'remove'} university. Please try again.`);
      }
    } catch (error) {
      setIsAdded(previousState);
      toast.error("Network error. Please check your connection and try again.");
    }
  };

  /**
   * Handle remove from context menu
   */
  const handleRemoveFromSaved = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isRemoving) return;

    let authData, token;

    try {
      authData = localStorage.getItem("authData");
      if (!authData) {
        toast.error("Please login first");
        return;
      }

      const parsedAuth = JSON.parse(authData);
      token = parsedAuth.token;

      if (!token) {
        toast.error("Authentication expired, please login again");
        return;
      }
    } catch (error) {
      toast.error("Authentication error, please try again");
      return;
    }

    setIsRemoving(true);

    toast("Removing university...", {
      style: {
        background: '#6b7280',
        color: 'white',
        border: 'none',
      },
      duration: 1500,
    });

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

      const response = await fetch(`${API_BASE_URL}/api/university/toggleSaved`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ universityId: university?.id }),
      });

      if (response.ok) {
        toast.success("University successfully removed", {
          style: {
            background: '#ef4444',
            color: 'white',
            border: 'none',
          },
          duration: 2000,
        });

        setIsAdded(false);

        if (onUpdate) {
          setTimeout(() => {
            onUpdate();
          }, 300);
        }

        if (onRemove) {
          onRemove(university.id);
        }
      } else {
        toast.error("Failed to remove university. Please try again.");
        setIsRemoving(false);
      }
    } catch (error) {
      toast.error("Network error. Please check your connection and try again.");
      setIsRemoving(false);
    }
  };

  /**
   * Enhanced status color determination
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'from-green-500 to-green-600';
      case 'in-progress':
        return 'from-blue-500 to-blue-600';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  /**
   * Enhanced status text
   */
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

  /**
   * Get status badge styling
   */
  const getStatusBadgeStyle = (status) => {
    const readyForSubmission = university.stats?.applicationHealth?.readyForSubmission;

    let baseStyle = `absolute bottom-4 left-4 px-3 py-1 rounded-full text-white text-sm font-medium bg-gradient-to-r ${getStatusColor(status)}`;

    if (readyForSubmission && status !== 'submitted') {
      baseStyle += ' animate-pulse ring-2 ring-white/50';
    }

    return baseStyle;
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

  return (
    <Link href={universityUrl}>
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group cursor-pointer">
        {/* University Image Section */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={university.image || '/default-university.jpg'}
            alt={university.name || university.universityName}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.target.src = '/default-university.jpg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

          {/* Heart Button - Top Left */}
          <button
            onClick={toggleHeart}
            className={`absolute top-4 left-4 p-2 rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-110 active:scale-95 z-20 ${
              isAdded
                ? "bg-rose-500 text-white shadow-md"
                : "bg-white/90 text-gray-600 hover:text-rose-500 shadow-sm"
            }`}
          >
            <Heart className={`w-4 h-4 transition-all ${isAdded ? 'fill-current' : ''}`} />
          </button>

          {/* Context Menu for Remove - Top Right */}
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <button
                className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors z-10"
                onClick={(e) => e.preventDefault()}
              >
                <MoreHorizontal className="w-4 h-4 text-slate-600" />
              </button>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-56">
              <ContextMenuItem
                onClick={handleRemoveFromSaved}
                disabled={isRemoving}
                className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isRemoving ? 'Removing...' : 'Remove University'}</span>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>

          {/* Enhanced Status Badge */}
          <div className={getStatusBadgeStyle(university.status)}>
            <div className="flex items-center gap-1">
              {readyForSubmission && university.status !== 'submitted' && (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{getStatusText(university.status)}</span>
            </div>
          </div>

          {/* Completion Indicator Icons */}
          {(essaysFullyComplete || tasksFullyComplete) && university.status !== 'submitted' && (
            <div className="absolute top-16 left-4 flex gap-1">
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
        </div>

        {/* Card Content Section */}
        <div className="p-6">
          {/* University Name */}
          <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
            {university.name || university.universityName}
          </h3>

          {/* Location */}
          <div className="flex items-center text-slate-600 mb-4">
            <MapPin className="w-4 h-4 mr-2" />
            <span className="text-sm">{university.location}</span>
          </div>

          <div className="space-y-4">
            {/* Deadline Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-slate-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Deadline</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-slate-900">
                  {university.deadline || 'TBD'}
                </span>
                {readyForSubmission && (
                  <div className="text-xs text-green-600 font-medium">Ready!</div>
                )}
              </div>
            </div>

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
                  <div className="text-xs text-slate-500 mt-1 flex justify-between">
                    <span>{essayProgressPercentage}% Complete</span>
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
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 mt-4">
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
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
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-4">
                <div className="text-sm text-gray-600 text-center">
                  No essays or tasks configured yet
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};