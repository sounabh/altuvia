"use client"

import React, { useState } from "react";
import { ArrowLeft, Bell, Settings, Plus, Check, CheckCircle2, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

const Header = ({ university }) => {
  // Get isAdded directly from university prop (backend already provides this)
  const isAddedFromProp = university?.isAdded || false;
  const [isAdded, setIsAdded] = useState(isAddedFromProp);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Enhanced progress calculation using university data (ONLY if university is added)
  const getProgressData = () => {
    if (!university || !isAdded) {
      return {
        overallProgress: 0,
        essayProgress: 0,
        taskProgress: 0,
        completedEssays: 0,
        totalEssays: 0,
        completedTasks: 0,
        totalTasks: 0,
        applicationStatus: 'not-started'
      };
    }

    // Use enhanced stats if available
    if (university.enhancedStats) {
      return {
        overallProgress: university.overallProgress || 0,
        essayProgress: university.essayProgress || 0,
        taskProgress: university.taskProgress || 0,
        completedEssays: university.enhancedStats.essays?.completed || 0,
        totalEssays: university.enhancedStats.essays?.total || 0,
        completedTasks: university.enhancedStats.tasks?.completed || 0,
        totalTasks: university.enhancedStats.tasks?.total || 0,
        applicationStatus: university.status || 'not-started',
        upcomingDeadlines: university.upcomingDeadlines || 0,
        overdueEvents: university.overdueEvents || 0
      };
    }

    // Fallback to basic calculation
    const essayPrompts = university.allEssayPrompts || [];
    const calendarEvents = university.calendarEvents || [];
    
    const completedEssays = essayPrompts.filter(essay => 
      essay.status === 'completed' || essay.progress >= 98
    ).length;
    
    const completedTasks = calendarEvents.filter(event => 
      event.completionStatus === 'completed' || event.status === 'completed'
    ).length;

    const essayProgress = essayPrompts.length > 0 
      ? Math.round((completedEssays / essayPrompts.length) * 100)
      : 0;
    
    const taskProgress = calendarEvents.length > 0 
      ? Math.round((completedTasks / calendarEvents.length) * 100)
      : 0;

    const overallProgress = essayPrompts.length > 0 && calendarEvents.length > 0
      ? Math.round((essayProgress * 0.7) + (taskProgress * 0.3))
      : essayPrompts.length > 0 
      ? essayProgress 
      : taskProgress;

    let applicationStatus = 'not-started';
    if (completedEssays > 0 || completedTasks > 0) {
      if (completedEssays === essayPrompts.length && completedTasks === calendarEvents.length && (essayPrompts.length > 0 || calendarEvents.length > 0)) {
        applicationStatus = 'submitted';
      } else {
        applicationStatus = 'in-progress';
      }
    }

    return {
      overallProgress,
      essayProgress,
      taskProgress,
      completedEssays,
      totalEssays: essayPrompts.length,
      completedTasks,
      totalTasks: calendarEvents.length,
      applicationStatus,
      upcomingDeadlines: 0,
      overdueEvents: 0
    };
  };

  const progressData = getProgressData();

  /**
   * Toggle university saved status with instant UI update
   */
  const toggleSaved = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Check authentication
    if (status !== "authenticated" || !session?.token) {
      toast.error("Please login to save universities", {
        description: "You need to be logged in to save universities to your dashboard"
      });
      router.push('/auth/signin');
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
          background: '#10b981',
          color: 'white',
          border: 'none',
        },
        duration: 2000,
      });
    } else {
      toast.success("University removed from dashboard", {
        style: {
          background: '#6b7280',
          color: 'white',
          border: 'none',
        },
        duration: 2000,
      });
    }

    setIsLoading(true);

    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

      const response = await fetch(
        `${API_BASE_URL}/api/university/toggleSaved`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.token}`,
          },
          body: JSON.stringify({ universityId: university?.id }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsAdded(data.isAdded);
        
        // Reload page to get fresh data with updated isAdded status
        setTimeout(() => {
          window.location.reload();
        }, 1000);
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
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get status text and color
  const getStatusInfo = () => {
    switch (progressData.applicationStatus) {
      case 'submitted':
        return { text: 'Application Complete', color: 'text-green-600 bg-green-50', icon: CheckCircle2 };
      case 'in-progress':
        return { text: 'In Progress', color: 'text-blue-600 bg-blue-50', icon: Clock };
      default:
        return { text: 'Not Started', color: 'text-gray-500 bg-gray-50', icon: Calendar };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Check if user is authenticated for conditional rendering
  const isAuthenticated = status === "authenticated" && !!session?.token;

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section: Back Button */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-[#002147]"
              onClick={() => router.push(`/dashboard`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span>Back</span>
            </Button>
          </div>

          {/* Center Section: School Title & Add Button */}
          <div className="text-center flex-1 mx-4 min-w-0">
            <div className="flex items-center justify-center space-x-3">
              <div className="min-w-0 max-w-2xl">
                <h1 className="text-2xl font-bold tracking-tight text-[#002147] truncate">
                  {university?.name || "University Profile"}
                </h1>
                {university?.location && (
                  <p className="text-sm text-gray-600 truncate">
                    {university.location}
                  </p>
                )}
              </div>

              {/* Add/Added Button with Plus/Check Icon */}
              {university && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSaved}
                  disabled={isLoading || status === "loading"}
                  className={`relative transition-all duration-300 shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg ${
                    isAdded
                      ? "bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"
                      : "bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-gray-200"
                  } ${isLoading || status === "loading" ? "opacity-75" : ""}`}
                  title={
                    !isAuthenticated
                      ? "Login to save universities"
                      : isAdded
                      ? "Added to dashboard"
                      : "Add to dashboard"
                  }
                >
                  {isAdded ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-medium">Added</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span className="text-sm font-medium">Add</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Right Section: Progress Info (ONLY SHOWN IF UNIVERSITY IS ADDED) */}
          <div className="flex items-center space-x-3">
            {/* Progress Card - ONLY SHOW IF ADDED */}
            {isAdded && (
              <div className="bg-gray-50 rounded-lg p-3 min-w-[200px] border">
                {/* Status Row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1">
                    <StatusIcon className="h-3 w-3" />
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusInfo.color}`}>
                      {statusInfo.text}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {progressData.overallProgress}%
                  </span>
                </div>
              </div>
            )}

           
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;