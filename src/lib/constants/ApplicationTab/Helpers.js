import {
  CheckCircle,
  Clock,
  FileText,
  CheckCircle2,
  ClockIcon,
  CalendarIcon,
  CalendarDays,
  Calendar,
  Flame,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

// Format date helper
export const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

// Get status colors for tasks/events
export const getStatusColors = (status, priority = "medium") => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "overdue":
    case "missed":
      return "bg-red-100 text-red-700";
    case "due-today":
    case "today":
      return "bg-orange-100 text-orange-700";
    case "in-progress":
      return "bg-blue-100 text-blue-700";
    default:
      return priority === "high"
        ? "bg-red-100 text-red-700"
        : priority === "medium"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-gray-100 text-gray-700";
  }
};

// Get icon for task/event items
export const getItemIcon = (item) => {
  if (item.status === "completed")
    return <CheckCircle className="h-5 w-5 text-green-600" />;
  if (item.type === "event")
    return <CalendarDays className="h-5 w-5 text-purple-600" />;
  return (
    <Calendar
      className={`h-5 w-5 ${
        item.priority === "high"
          ? "text-red-600"
          : item.priority === "medium"
          ? "text-yellow-600"
          : "text-blue-600"
      }`}
    />
  );
};

// Calculate essay progress percentage
export const getEssayProgress = (essay) => {
  const hasContent = essay.wordCount && essay.wordCount > 0;
  const hasUserEssay = essay.userEssayId || essay.hasUserContent;

  if (!hasContent && !hasUserEssay) {
    return 0;
  }

  if (
    essay.status === "COMPLETED" ||
    essay.status === "completed" ||
    essay.isComplete
  ) {
    return 100;
  }

  if (essay.wordCount > 0 && essay.wordLimit > 0) {
    return Math.min(
      Math.round((essay.wordCount / essay.wordLimit) * 100),
      100
    );
  }

  return 0;
};

// Get essay status configuration
export const getEssayStatus = (essay) => {
  const hasContent = essay.wordCount && essay.wordCount > 0;

  if (
    essay.status === "COMPLETED" ||
    essay.status === "completed" ||
    essay.isComplete
  ) {
    return {
      bg: "bg-gradient-to-r from-emerald-500 to-teal-500",
      text: "text-white",
      label: "Completed",
      icon: CheckCircle,
      shadow: "shadow-lg shadow-emerald-500/30",
    };
  }

  if (
    essay.status === "IN_PROGRESS" ||
    essay.status === "in-progress" ||
    hasContent
  ) {
    return {
      bg: "bg-gradient-to-r from-blue-500 to-indigo-500",
      text: "text-white",
      label: "In Progress",
      icon: Clock,
      shadow: "shadow-lg shadow-blue-500/30",
    };
  }

  if (essay.status === "DRAFT") {
    return {
      bg: "bg-gradient-to-r from-amber-500 to-orange-500",
      text: "text-white",
      label: "Draft",
      icon: FileText,
      shadow: "shadow-lg shadow-amber-500/30",
    };
  }

  return {
    bg: "bg-gradient-to-r from-slate-600 to-slate-700",
    text: "text-white",
    label: "Not Started",
    icon: FileText,
    shadow: "shadow-lg shadow-slate-500/30",
  };
};

// Get application status info
export const getStatusInfo = (applicationStatus) => {
  switch (applicationStatus) {
    case "submitted":
      return {
        text: "Application Complete",
        color: "text-green-600 bg-green-50",
        icon: CheckCircle2,
      };
    case "in-progress":
      return {
        text: "In Progress",
        color: "text-blue-600 bg-blue-50",
        icon: ClockIcon,
      };
    default:
      return {
        text: "Not Started",
        color: "text-gray-500 bg-gray-50",
        icon: CalendarIcon,
      };
  }
};

// Get progress bar color based on application status
export const getProgressBarColor = (applicationStatus) => {
  if (applicationStatus === "submitted") return "bg-green-500";
  if (applicationStatus === "in-progress") return "bg-blue-500";
  return "bg-gray-400";
};

// Validate user and university for actions
export const validateUserAndUniversity = (userId, isUniversityAdded, action = "general") => {
  const errors = [];

  if (!userId) {
    errors.push("Please sign in to continue");
    return { isValid: false, error: errors[0] };
  }

  if (!isUniversityAdded && action !== "addUniversity") {
    errors.push("Please add this university to your dashboard first");
    return { isValid: false, error: errors[0] };
  }

  return { isValid: true };
};

// Calculate progress data from university and custom essays
export const calculateProgressData = (university, customEssays = []) => {
  if (!university) {
    return {
      overallProgress: 0,
      essayProgress: 0,
      taskProgress: 0,
      completedEssays: 0,
      totalEssays: 0,
      completedTasks: 0,
      totalTasks: 0,
      applicationStatus: "not-started",
    };
  }

  if (university.enhancedStats) {
    return {
      overallProgress: university.overallProgress || 0,
      essayProgress: university.essayProgress || 0,
      taskProgress: university.taskProgress || 0,
      completedEssays: university.enhancedStats.essays?.completed || 0,
      totalEssays: university.enhancedStats.essays?.total || 0,
      completedTasks: university.enhancedStats.tasks?.completed || 0,
      totalTasks: university.enhancedStats.tasks?.total || 0,
      applicationStatus: university.status || "not-started",
      upcomingDeadlines: university.upcomingDeadlines || 0,
      overdueEvents: university.overdueEvents || 0,
    };
  }

  const essayPrompts = university.allEssayPrompts || [];
  const calendarEvents = university.calendarEvents || [];
  const tasksEvents = university.tasksAndEvents || [];

  // Include custom essays in total count
  const allEssays = [...essayPrompts, ...customEssays];

  const completedEssays = allEssays.filter(
    (essay) =>
      essay.status === "COMPLETED" ||
      essay.status === "completed" ||
      (essay.wordCount &&
        essay.wordLimit &&
        essay.wordCount >= essay.wordLimit * 0.98) ||
      essay.isCompleted
  ).length;

  const allTasks = [...calendarEvents, ...tasksEvents];
  const completedTasks = allTasks.filter(
    (event) =>
      event.completionStatus === "completed" || event.status === "completed"
  ).length;

  const essayProgress =
    allEssays.length > 0
      ? Math.round((completedEssays / allEssays.length) * 100)
      : 0;

  const taskProgress =
    allTasks.length > 0
      ? Math.round((completedTasks / allTasks.length) * 100)
      : 0;

  const overallProgress =
    allEssays.length > 0 && allTasks.length > 0
      ? Math.round(essayProgress * 0.7 + taskProgress * 0.3)
      : allEssays.length > 0
      ? essayProgress
      : taskProgress;

  let applicationStatus = "not-started";
  if (completedEssays > 0 || completedTasks > 0) {
    if (
      completedEssays === allEssays.length &&
      completedTasks === allTasks.length &&
      (allEssays.length > 0 || allTasks.length > 0)
    ) {
      applicationStatus = "submitted";
    } else {
      applicationStatus = "in-progress";
    }
  }

  return {
    overallProgress,
    essayProgress,
    taskProgress,
    completedEssays,
    totalEssays: allEssays.length,
    completedTasks,
    totalTasks: allTasks.length,
    applicationStatus,
    upcomingDeadlines: allTasks.filter(
      (task) =>
        new Date(task.date) > new Date() &&
        task.status !== "completed" &&
        task.completionStatus !== "completed"
    ).length,
    overdueEvents: allTasks.filter(
      (task) =>
        new Date(task.date) < new Date() &&
        task.status !== "completed" &&
        task.completionStatus !== "completed"
    ).length,
  };
};