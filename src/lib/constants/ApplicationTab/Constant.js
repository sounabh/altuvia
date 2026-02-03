import { Brain, CalendarIcon, CheckCircle, CheckCircle2, Clock, ClockIcon, FileText, Flame, Layers, PieChart, TrendingDown, TrendingUp } from "lucide-react";

// Priority configuration
export const PRIORITY_CONFIG = {
  high: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    border: "border-red-400/30",
    dot: "bg-red-500",
    icon: Flame,
  },
  medium: {
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    border: "border-amber-400/30",
    dot: "bg-amber-500",
    icon: TrendingUp,
  },
  low: {
    bg: "bg-green-500/20",
    text: "text-green-400",
    border: "border-green-400/30",
    dot: "bg-green-500",
    icon: TrendingDown,
  },
};

// Panel configuration
export const PANEL_CONFIG = {
  versions: {
    title: "Version History",
    icon: Layers,
    iconColor: "from-blue-500/20 to-cyan-500/20",
  },
  analytics: {
    title: "Essay Analytics",
    icon: PieChart,
    iconColor: "from-purple-500/20 to-pink-500/20",
  },
  ai: {
    title: "AI Assistant",
    icon: Brain,
    iconColor: "from-amber-500/20 to-orange-500/20",
  },
};

// API routes
export const API_ROUTES = {
  essayIndependent: "/api/essay/independent",
  userToggleAdd: "/api/user/toggle-add",
};

// Essay status configuration
export const ESSAY_STATUS = {
  completed: {
    bg: "bg-gradient-to-r from-emerald-500 to-teal-500",
    text: "text-white",
    label: "Completed",
    icon: CheckCircle,
    shadow: "shadow-lg shadow-emerald-500/30",
  },
  inProgress: {
    bg: "bg-gradient-to-r from-blue-500 to-indigo-500",
    text: "text-white",
    label: "In Progress",
    icon: Clock,
    shadow: "shadow-lg shadow-blue-500/30",
  },
  draft: {
    bg: "bg-gradient-to-r from-amber-500 to-orange-500",
    text: "text-white",
    label: "Draft",
    icon: FileText,
    shadow: "shadow-lg shadow-amber-500/30",
  },
  notStarted: {
    bg: "bg-gradient-to-r from-slate-600 to-slate-700",
    text: "text-white",
    label: "Not Started",
    icon: FileText,
    shadow: "shadow-lg shadow-slate-500/30",
  },
};

// Application status configuration
export const APP_STATUS = {
  submitted: {
    text: "Application Complete",
    color: "text-green-600 bg-green-50",
    icon: CheckCircle2,
  },
  "in-progress": {
    text: "In Progress",
    color: "text-blue-600 bg-blue-50",
    icon: ClockIcon,
  },
  "not-started": {
    text: "Not Started",
    color: "text-gray-500 bg-gray-50",
    icon: CalendarIcon,
  },
};