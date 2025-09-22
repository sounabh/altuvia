import React, { useState, useEffect } from "react";
import { ArrowLeft, Bell, Settings, Heart, HeartOff, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";

const Header = ({ university }) => {
  const [isAdded, setIsAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);

  const router = useRouter();

  // Enhanced progress calculation using university data from getUniversityBySlug
  const getProgressData = () => {
    if (!university) {
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

    // Use enhanced stats if available (when user is authenticated)
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

    // Fallback to basic calculation from existing data
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

    // Calculate overall progress (weighted: 70% essays, 30% tasks)
    const overallProgress = essayPrompts.length > 0 && calendarEvents.length > 0
      ? Math.round((essayProgress * 0.7) + (taskProgress * 0.3))
      : essayPrompts.length > 0 
      ? essayProgress 
      : taskProgress;

    // Determine application status
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
   * Effect to initialize saved status by checking if current user has saved this university
   */
  useEffect(() => {
    try {
      const authData = localStorage.getItem("authData");
      if (!authData || !university) return;

      const parsedData = JSON.parse(authData);
      const userId = parsedData.userId;

      // Check if user's id is inside savedByUsers array of objects
      const isSaved =
        Array.isArray(university.savedByUsers) &&
        university.savedByUsers.some((user) => user.id === userId);

      setIsAdded(isSaved);
    } catch (error) {
      console.error("Error initializing saved status:", error);
    }
  }, [university]);

  /**
   * Toggle university saved status with optimistic updates
   */
  const toggleSaved = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Get fresh auth data from localStorage
    const authData =
      typeof window !== "undefined" ? localStorage.getItem("authData") : null;

    if (!authData) {
      console.warn("⚠️ No auth data found in localStorage");
      return;
    }

    const parsedData = JSON.parse(authData);

    // Store what action we're performing BEFORE changing state
    const currentState = isAdded;
    const actionBeingPerformed = currentState ? "removing" : "saving";
    
    // Set loading action based on PREVIOUS state (what we're changing FROM)
    setLoadingAction(actionBeingPerformed);

    // Optimistic update - change UI immediately
    const newState = !isAdded;
    setIsAdded(newState);
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
            Authorization: `Bearer ${parsedData.token}`,
          },
          body: JSON.stringify({ universityId: university?.id }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Confirm the optimistic update was correct
        setIsAdded(data.isAdded);
      } else {
        // Rollback on error
        console.error("Failed to update status:", response.status);
        setIsAdded(currentState); // Use the stored previous state
      }
    } catch (error) {
      // Rollback on error
      console.error("Error toggling save:", error);
      setIsAdded(currentState); // Use the stored previous state
    } finally {
      setIsLoading(false);
      setLoadingAction(null); // Clear loading action
    }
  };

  // Helper function to get the correct loading text
  const getLoadingText = () => {
    if (!isLoading || !loadingAction) return null;
    return loadingAction === "saving" ? "Saving..." : "Removing...";
  };

  // Helper function to get loading state colors
  const getLoadingStateColor = () => {
    if (!isLoading || !loadingAction) {
      return isAdded ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600";
    }
    
    // During loading, show color based on the action being performed
    return loadingAction === "saving" 
      ? "bg-red-100 text-red-800"  // Saving = red (will become saved)
      : "bg-gray-100 text-gray-600"; // Removing = gray (will become unsaved)
  };

  // Helper function to get progress bar color based on status
  const getProgressBarColor = () => {
    if (progressData.applicationStatus === 'submitted') {
      return 'bg-green-500';
    } else if (progressData.applicationStatus === 'in-progress') {
      return 'bg-blue-500';
    }
    return 'bg-gray-400';
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
              onClick={() => router.push(`/search`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span>Back</span>
            </Button>
          </div>

          {/* Center Section: School Title & Save Status */}
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

              {/* Save Status Button */}
              {university && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSaved}
                  disabled={isLoading}
                  className={`relative transition-all duration-300 shrink-0 ${
                    isAdded
                      ? "text-red-500 hover:text-red-600 hover:bg-red-50"
                      : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                  } ${isLoading ? "opacity-75" : ""}`}
                  title={
                    isAdded
                      ? "Remove from saved universities"
                      : "Save this university"
                  }
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isAdded ? (
                    <Heart className="h-5 w-5 fill-current" />
                  ) : (
                    <Heart className="h-5 w-5" />
                  )}
                </Button>
              )}
            </div>

            {/* Save Status Indicator */}
            {university && (
              <div className="mt-1">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${getLoadingStateColor()}`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin mr-1" />
                      {getLoadingText()}
                    </>
                  ) : isAdded ? (
                    <>
                      <Heart className="w-3 h-3 mr-1 fill-current" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Heart className="w-3 h-3 mr-1" />
                      Not Saved
                    </>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Right Section: Enhanced Progress Info */}
          <div className="flex items-center space-x-3">
            {/* Progress Card */}
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

            

              {/* Stats Grid */}
             

              {/* Deadline Indicators */}
            
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-50 cursor-not-allowed" 
                disabled
              >
                <Bell className="h-4 w-4" />
              </Button>

              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-50 cursor-not-allowed" 
                disabled
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;