"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  lazy,
  Suspense,
} from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  FileText,
  Clock,
  MessageSquare,
  Save,
  CheckCircle,
  AlertCircle,
  Calendar,
  BookOpen,
  Plus,
  X,
  CalendarDays,
  MapPin,
  Timer,
  Target,
  CheckCircle2,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  History,
  BarChart3,
  Loader2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Undo2,
  Trash2,
  Copy,
  RefreshCw,
  Lightbulb,
  AlertTriangle,
  Zap,
  Award,
  Edit3,
  RotateCcw,
  Settings,
  PanelRightOpen,
  PanelRightClose,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Layers,
  Brain,
  PieChart,
  TrendingDown,
  Flame,
  Star,
  Lock,
  BookmarkPlus,
} from "lucide-react";

// ============================================
// LAZY LOADED COMPONENTS FOR PERFORMANCE
// ============================================
import { EssayEditor } from "@/app/workspace/components/EssayEditor";
import { AISuggestions } from "@/app/workspace/components/AiSuggestion";

// Lazy load heavy components
const VersionManager = lazy(() =>
  import("@/app/workspace/components/VersionManager").then((m) => ({
    default: m.VersionManager,
  })),
);
const EssayAnalytics = lazy(() =>
  import("@/app/workspace/components/EssayAnalytics").then((m) => ({
    default: m.EssayAnalytics,
  })),
);

// ============================================
// DELETE CONFIRMATION MODAL COMPONENT
// ============================================

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  essayTitle,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-[#002147] rounded-2xl shadow-2xl max-w-md w-full animate-slideUp border border-white/20">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Delete Essay</h2>
              <p className="text-sm text-white/60">
                This action cannot be undone
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-white mb-1">
                  You are about to delete:
                </p>
                <p className="text-sm font-bold text-white">{essayTitle}</p>
              </div>
            </div>
          </div>

          <p className="text-white/70 text-sm">
            This will permanently delete the essay and all associated data
            including:
          </p>
          <ul className="text-sm text-white/50 space-y-1 mt-2 ml-4">
            <li>• All saved content and drafts</li>
            <li>• Version history</li>
            <li>• AI suggestions and analytics</li>
            <li>• Progress tracking data</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2.5 text-sm font-medium text-white/70 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-orange-500 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Essay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// CUSTOM ESSAY MODAL COMPONENT
// ============================================

const CustomEssayModal = ({
  isOpen,
  onClose,
  onCreateEssay,
  universityName,
  isCreating,
  isUniversityAdded,
}) => {
  const [formData, setFormData] = useState({
    customTitle: "",
    customPrompt: "",
    wordLimit: 500,
    priority: "medium",
  });

  const [errors, setErrors] = useState({});
  const [wordLimitError, setWordLimitError] = useState("");

  const handleWordLimitChange = (value) => {
    const numValue = parseInt(value) || 0;

    if (value === "") {
      setFormData({ ...formData, wordLimit: 500 });
      setWordLimitError("");
      return;
    }

    if (numValue < 100) {
      setWordLimitError("Minimum 100 words required");
      setFormData({ ...formData, wordLimit: numValue });
    } else if (numValue > 5000) {
      setWordLimitError("Maximum 5000 words allowed");
      setFormData({ ...formData, wordLimit: numValue });
    } else {
      setWordLimitError("");
      setFormData({ ...formData, wordLimit: numValue });
    }
  };

  const handleWordLimitBlur = () => {
    const numValue = parseInt(formData.wordLimit) || 0;

    if (numValue < 100) {
      setWordLimitError("Minimum 100 words required");
      setFormData({ ...formData, wordLimit: 100 });
    } else if (numValue > 5000) {
      setWordLimitError("Maximum 5000 words allowed");
      setFormData({ ...formData, wordLimit: 5000 });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customTitle.trim()) {
      newErrors.customTitle = "Essay title is required";
    }

    if (!formData.customPrompt.trim()) {
      newErrors.customPrompt = "Essay prompt/question is required";
    }

    const wordLimit = parseInt(formData.wordLimit);
    if (isNaN(wordLimit) || wordLimit < 100 || wordLimit > 5000) {
      newErrors.wordLimit = "Word limit must be between 100 and 5000";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onCreateEssay(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      customTitle: "",
      customPrompt: "",
      wordLimit: 500,
      priority: "medium",
    });
    setErrors({});
    setWordLimitError("");
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-[#002147] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp border border-white/20">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#002147] z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Create Custom Essay
              </h2>
              <p className="text-sm text-white/60">
                Add a custom essay for {universityName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* University Info */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">University</p>
                <p className="text-sm text-white/70">{universityName}</p>
              </div>
            </div>
          </div>

          {/* Essay Title */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Essay Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.customTitle}
              onChange={(e) =>
                setFormData({ ...formData, customTitle: e.target.value })
              }
              className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white ${
                errors.customTitle
                  ? "border-red-400 bg-red-500/10"
                  : "border-white/20"
              }`}
              placeholder="e.g., Leadership Experience Essay"
              disabled={!isUniversityAdded}
            />
            {errors.customTitle && (
              <p className="mt-1 text-sm text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.customTitle}
              </p>
            )}
          </div>

          {/* Essay Prompt */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Essay Prompt / Question <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.customPrompt}
              onChange={(e) =>
                setFormData({ ...formData, customPrompt: e.target.value })
              }
              className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-white ${
                errors.customPrompt
                  ? "border-red-400 bg-red-500/10"
                  : "border-white/20"
              }`}
              rows={4}
              placeholder="Enter the essay question or topic you're writing about..."
              disabled={!isUniversityAdded}
            />
            {errors.customPrompt && (
              <p className="mt-1 text-sm text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.customPrompt}
              </p>
            )}
            <p className="mt-1.5 text-xs text-white/50">
              This will be your essay prompt that guides your writing
            </p>
          </div>

          {/* Word Limit & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Word Limit <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={formData.wordLimit}
                onChange={(e) => handleWordLimitChange(e.target.value)}
                onBlur={handleWordLimitBlur}
                className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white ${
                  wordLimitError
                    ? "border-red-400 bg-red-500/10"
                    : "border-white/20"
                }`}
                min={100}
                max={5000}
                disabled={!isUniversityAdded}
              />
              {wordLimitError && (
                <p className="mt-1 text-red-400 text-xs flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {wordLimitError}
                </p>
              )}
              <p className="mt-1.5 text-xs text-white/50">
                Valid range: 100 - 5000 words
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white"
                disabled={!isUniversityAdded}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: "right 0.5rem center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "1.5em 1.5em",
                  paddingRight: "2.5rem",
                  appearance: "none",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                }}
              >
                <option value="low" className="bg-[#002147] text-white">
                  Low Priority
                </option>
                <option value="medium" className="bg-[#002147] text-white">
                  Medium Priority
                </option>
                <option value="high" className="bg-[#002147] text-white">
                  High Priority
                </option>
              </select>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white mb-1">
                  Your custom essay will have:
                </p>
                <ul className="text-xs text-white/70 space-y-1">
                  <li>✓ Full version history with restore capabilities</li>
                  <li>✓ AI-powered analysis and writing suggestions</li>
                  <li>✓ Auto-save and manual save options</li>
                  <li>✓ Progress tracking and completion analytics</li>
                  <li>✓ Associated with {universityName}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex justify-end space-x-3 sticky bottom-0 bg-[#002147]">
          <button
            onClick={onClose}
            disabled={isCreating}
            className="px-6 py-2.5 text-sm font-medium text-white/70 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isCreating || !isUniversityAdded}
            className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center space-x-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Create Essay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// HELPER COMPONENTS
// ============================================

const PanelLoader = () => (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="w-6 h-6 animate-spin text-white/50" />
    <span className="ml-3 text-sm text-white/60">Loading...</span>
  </div>
);

// ============================================
// LOCKED TAB CONTENT COMPONENT
// ============================================
const LockedTabContent = ({
  tabName,
  universityName,
  onAddUniversity,
  isAddingUniversity,
}) => (
  <div className="min-h-[400px] flex items-center justify-center">
    <div className="text-center max-w-md mx-auto p-8">
      <div className="relative inline-block mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-2xl rounded-full animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-white/10">
          <Lock className="w-16 h-16 text-white/60" />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-white mb-3">{tabName} Locked</h3>

      <p className="text-white/70 mb-6 leading-relaxed">
        Add <span className="font-semibold text-white">{universityName}</span>{" "}
        to your dashboard to unlock {tabName.toLowerCase()} management and start
        working on your application.
      </p>

      <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
        <p className="text-sm font-semibold text-white/80 mb-3">
          Unlock access to:
        </p>
        <ul className="space-y-2 text-sm text-white/60">
          <li className="flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-blue-400" />
            {tabName === "Essays"
              ? "Essay prompts and writing workspace"
              : "Deadline tracking and calendar"}
          </li>
          <li className="flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-blue-400" />
            {tabName === "Essays"
              ? "AI-powered suggestions and analytics"
              : "Event reminders and notifications"}
          </li>
          <li className="flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-blue-400" />
            {tabName === "Essays"
              ? "Version history and auto-save"
              : "Task completion tracking"}
          </li>
        </ul>
      </div>

      <Button
        onClick={onAddUniversity}
        disabled={isAddingUniversity}
        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/30 px-8 py-6"
      >
        {isAddingUniversity ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Adding University...
          </>
        ) : (
          <>
            <BookmarkPlus className="w-4 h-4 mr-2" />
            Add to Dashboard
          </>
        )}
      </Button>

      <p className="text-xs text-white/50 mt-4">
        This will save the university to your application dashboard
      </p>
    </div>
  </div>
);

// ============================================
// MAIN APPLICATION TABS COMPONENT
// ============================================

const ApplicationTabs = ({ university }) => {
  const router = useRouter();
  const params = useParams();
  const { data: session, status: sessionStatus } = useSession();

  // ========== IMPROVED USER ID EXTRACTION ==========
  const getUserId = () => {
    if (!session) return null;

    // Try different possible locations for user ID
    return (
      session.userId || // Direct property
      session.user?.id || // Nested in user object
      session.user?.userId || // Alternative user property
      session.user?.sub || // OAuth provider's sub
      session.id || // Direct session ID
      null
    );
  };

  const userId = getUserId();
  const userEmail = session?.user?.email || session?.email || null;

  const universityNameFromUrl = params?.university
    ? decodeURIComponent(params.university).replace(/-/g, " ")
    : null;

  const universityName = university?.name || universityNameFromUrl || "";

  // ========== SESSION VALIDATION AND DEBUGGING ==========
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      console.log("Session debug:", {
        hasSession: !!session,
        sessionStructure: session ? Object.keys(session) : "no session",
        userObject: session?.user ? Object.keys(session.user) : "no user",
        extractedUserId: userId,
        userEmail: userEmail,
      });

      if (!userId) {
        console.warn("User ID not found in session. Available data:", session);
        toast.error("Authentication issue. Please sign out and sign in again.");
      }
    }
  }, [sessionStatus, session, userId, userEmail]);

  // ========== UNIVERSITY ADDED STATE ==========
  const isUniversityAdded = university?.isAdded || false;
  const [isAddingUniversity, setIsAddingUniversity] = useState(false);

  // ========== CUSTOM ESSAY STATE ==========
  const [showCustomEssayModal, setShowCustomEssayModal] = useState(false);
  const [isCreatingCustomEssay, setIsCreatingCustomEssay] = useState(false);

  // ========== STATE MANAGEMENT ==========
  const [activeView, setActiveView] = useState("list");
  const [workspaceData, setWorkspaceData] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState(null);
  const [activeProgramId, setActiveProgramId] = useState(null);
  const [activeEssayPromptId, setActiveEssayPromptId] = useState(null);
  const [openPanels, setOpenPanels] = useState([]);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isCreatingEssay, setIsCreatingEssay] = useState(false);
  const [isSavingVersion, setIsSavingVersion] = useState(false);

  // ========== SELECTED ESSAY INFO ==========
  const [selectedEssayInfo, setSelectedEssayInfo] = useState({
    title: "",
    programName: "",
    isCustom: false,
    promptText: "",
    wordLimit: 500,
  });

  // ========== ENHANCED VALIDATION FUNCTION ==========
  const validateUserAndUniversity = (action = "general") => {
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

  // ========== FIXED: CUSTOM ESSAYS CALCULATION ==========
  const customEssays = useMemo(() => {
    if (!workspaceData?.programs) return [];

    return workspaceData.programs
      .filter((p) => p.degreeType === "STANDALONE" || p.isCustom)
      .flatMap(
        (p) =>
          p.essays
            ?.map((e) => ({
              ...e.userEssay,
              promptId: e.promptId,
              promptTitle: e.promptTitle,
              prompt: e.promptText,
              wordLimit: e.wordLimit,
              programId: p.id,
              universityId: p.universityId,
            }))
            .filter(Boolean) || [],
      );
  }, [workspaceData]);

  // ADDED: Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    essayId: null,
    essayTitle: "",
  });
  const [isDeletingEssay, setIsDeletingEssay] = useState(false);

  // ========== REFS ==========
  const autoSaveTimerRef = useRef(null);
  const lastContentRef = useRef("");
  const isUpdatingRef = useRef(false);
  const lastTypingTimeRef = useRef(Date.now());
  const pendingContentRef = useRef(null);
  const updateDebounceRef = useRef(null);
  const isEditorActiveRef = useRef(false);
  const saveVersionRef = useRef(null);
  const isFetchingRef = useRef(false);

  // ========== PANEL MANAGEMENT ==========
  const Panel = useCallback(
    ({ name, title, icon: Icon, iconColor, children, isOpen, onClose }) => {
      if (!isOpen) return null;

      return (
        <div className="mb-4 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <div
                  className={`p-1.5 bg-gradient-to-br ${iconColor} rounded-lg`}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-white">
                  {title}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {children}
          </div>
        </div>
      );
    },
    [],
  );

  const togglePanel = useCallback((panelName) => {
    setOpenPanels((prev) => {
      if (prev.includes(panelName)) {
        return prev.filter((p) => p !== panelName);
      } else {
        return [...prev, panelName];
      }
    });
  }, []);

  const closePanel = useCallback((panelName) => {
    setOpenPanels((prev) => prev.filter((p) => p !== panelName));
  }, []);

  const isPanelOpen = useCallback(
    (panelName) => {
      return openPanels.includes(panelName);
    },
    [openPanels],
  );

  // ========== DERIVED DATA ==========
  const tasksAndEvents = useMemo(
    () => university?.tasksAndEvents || [],
    [university?.tasksAndEvents],
  );

  const programsWithEssays = useMemo(() => {
    if (!workspaceData?.programs) return [];
    return workspaceData.programs.filter(
      (program) =>
        program.essays &&
        program.essays.length > 0 &&
        program.degreeType !== "STANDALONE" &&
        !program.isCustom,
    );
  }, [workspaceData]);

  const currentProgram = useMemo(() => {
    if (!activeProgramId) return null;
    return workspaceData?.programs?.find((p) => p.id === activeProgramId);
  }, [workspaceData, activeProgramId]);

  const currentEssayData = useMemo(() => {
    if (!currentProgram || !activeEssayPromptId) return null;

    return currentProgram.essays?.find(
      (e) => e.promptId === activeEssayPromptId,
    );
  }, [currentProgram, activeEssayPromptId]);

  const currentEssay = useMemo(() => {
    return currentEssayData?.userEssay;
  }, [currentEssayData]);

  // ========== PROGRESS CALCULATION ==========
  const progressData = useMemo(() => {
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
        essay.isCompleted,
    ).length;

    const allTasks = [...calendarEvents, ...tasksEvents];
    const completedTasks = allTasks.filter(
      (event) =>
        event.completionStatus === "completed" || event.status === "completed",
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
          task.completionStatus !== "completed",
      ).length,
      overdueEvents: allTasks.filter(
        (task) =>
          new Date(task.date) < new Date() &&
          task.status !== "completed" &&
          task.completionStatus !== "completed",
      ).length,
    };
  }, [university, customEssays]);

  // ========== API FUNCTIONS ==========
  // ✅ FIX: Define fetchWorkspaceData BEFORE forceRefresh
  const fetchWorkspaceData = useCallback(async () => {
    if (
      !universityName ||
      !userId ||
      !isUniversityAdded ||
      isFetchingRef.current
    )
      return;

    try {
      isFetchingRef.current = true;
      setWorkspaceLoading(true);
      setWorkspaceError(null);

      const response = await fetch(
        `/api/essay/independent?universityId=${encodeURIComponent(university?.id)}&userId=${encodeURIComponent(userId)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-cache",
        },
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Failed to fetch data`);
      }

      const data = await response.json();

      // Set workspace data - custom essays are already included
      setWorkspaceData(data);

      // Don't auto-select if we already have a selection
      if (activeProgramId && activeEssayPromptId) {
        return;
      }

      // Filter and set default selections
      const programsWithContent =
        data.programs?.filter((p) => p.essays && p.essays.length > 0) || [];

      if (programsWithContent.length > 0) {
        let programToSelect = activeProgramId
          ? programsWithContent.find((p) => p.id === activeProgramId)
          : null;

        if (!programToSelect) {
          programToSelect = programsWithContent[0];
          setActiveProgramId(programToSelect.id);
        }

        if (programToSelect.essays && programToSelect.essays.length > 0) {
          let essayToSelect = activeEssayPromptId
            ? programToSelect.essays.find(
                (e) => e.promptId === activeEssayPromptId,
              )
            : null;

          if (!essayToSelect) {
            essayToSelect = programToSelect.essays[0];
            setActiveEssayPromptId(essayToSelect.promptId);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching workspace data:", err);
      setWorkspaceError(err.message);
      toast.error("Failed to load workspace data");
    } finally {
      setWorkspaceLoading(false);
      isFetchingRef.current = false;
    }
  }, [
    universityName,
    userId,
    activeProgramId,
    activeEssayPromptId,
    isUniversityAdded,
    university?.id,
  ]);

  // ✅ FIX B: Force immediate refetch helper function - NOW DEFINED AFTER fetchWorkspaceData
  const forceRefresh = useCallback(async () => {
    isFetchingRef.current = false; // Reset fetch lock
    await fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  // ========== HANDLE ADD UNIVERSITY TO DASHBOARD ==========
  const handleAddUniversity = async () => {
    const validation = validateUserAndUniversity("addUniversity");
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    if (!university?.id) {
      toast.error("University information not found");
      return;
    }

    try {
      setIsAddingUniversity(true);

      const response = await fetch("/api/user/toggle-add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          universityId: university.id,
          userId,
          userEmail,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.isAdded) {
          toast.success(
            `${university.name || "University"} has been added to your dashboard!`,
          );
          window.location.reload();
        } else {
          toast.success(
            `${university.name || "University"} has been removed from your dashboard.`,
          );
          window.location.reload();
        }
      } else {
        throw new Error(data.error || "Failed to update university status");
      }
    } catch (error) {
      console.error("Error toggling university:", error);
      toast.error("Failed to update university. Please try again.");
      setIsAddingUniversity(false);
    }
  };

  // ========== IMPROVED: HANDLE CREATE CUSTOM ESSAY ==========
  const handleCreateCustomEssay = async (formData) => {
    const validation = validateUserAndUniversity("createCustomEssay");
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    // Validate form data
    if (!formData.customTitle?.trim()) {
      toast.error("Essay title is required");
      return;
    }

    if (!formData.customPrompt?.trim()) {
      toast.error("Essay prompt is required");
      return;
    }

    if (!university?.id) {
      toast.error("University information not found");
      return;
    }

    try {
      setIsCreatingCustomEssay(true);

      const response = await fetch(`/api/essay/independent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_standalone_essay",
          customTitle: formData.customTitle,
          customPrompt: formData.customPrompt,
          wordLimit: formData.wordLimit,
          priority: formData.priority,
          taggedUniversityId: university.id,
          userId: userId,
          userEmail: userEmail,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        if (result.success && result.essay) {
          setShowCustomEssayModal(false);
          toast.success("Custom essay created successfully");
          
          // ✅ FIX C: Force immediate refresh from API
          await forceRefresh();
          
          // Then navigate to the new essay
          setActiveProgramId(result.programId);
          setActiveEssayPromptId(result.essayPromptId);
          setSelectedEssayInfo({
            title: result.essay.title,
            programName: "My Custom Essays",
            isCustom: true,
            promptText: result.essay.prompt,
            wordLimit: result.essay.wordLimit,
          });
          setActiveView("editor");
        } else {
          throw new Error(result.error || "Failed to create custom essay");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create custom essay");
      }
    } catch (error) {
      console.error("Error creating custom essay:", error);
      toast.error(error.message);
    } finally {
      setIsCreatingCustomEssay(false);
    }
  };

  // ========== HANDLE DELETE CUSTOM ESSAY ==========
  const handleDeleteCustomEssay = async (essayId) => {
    if (!essayId) return;

    const validation = validateUserAndUniversity("deleteEssay");
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    try {
      setIsDeletingEssay(true);

      const response = await fetch(`/api/essay/independent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_essay",
          essayId,
          userId,
          userEmail,
        }),
      });

      if (response.ok) {
        // Remove from workspace data immediately
        setWorkspaceData((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            programs: prev.programs
              .map((program) =>
                program.degreeType === "STANDALONE" || program.isCustom
                  ? {
                      ...program,
                      essays: program.essays.filter(
                        (e) => e.userEssay?.id !== essayId,
                      ),
                    }
                  : program,
              )
              .filter(
                (p) =>
                  (p.degreeType !== "STANDALONE" && !p.isCustom) ||
                  (p.essays && p.essays.length > 0),
              ),
          };
        });

        // If viewing deleted essay, navigate away
        if (activeEssayPromptId && currentEssay?.id === essayId) {
          setActiveEssayPromptId(null);
          setActiveProgramId(null);
          setActiveView("list");
        }

        toast.success("Custom essay deleted successfully");
        setDeleteModal({ isOpen: false, essayId: null, essayTitle: "" });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete custom essay");
      }
    } catch (error) {
      console.error("Error deleting custom essay:", error);
      toast.error(error.message || "Failed to delete custom essay");
    } finally {
      setIsDeletingEssay(false);
    }
  };

  // ADDED: Open delete confirmation
  const openDeleteConfirmation = (essayId, essayTitle) => {
    setDeleteModal({
      isOpen: true,
      essayId,
      essayTitle,
    });
  };

  // ✅ FIX A: UPDATED Auto-save function with full state update
  const autoSaveEssay = useCallback(async () => {
    if (
      !currentEssay ||
      isSaving ||
      isUpdatingRef.current ||
      !userId ||
      !isUniversityAdded
    ) {
      return false;
    }
    
    // ✅ FIX: Don't check hasUnsavedChanges - always save when called
    // Use pending content if available
    let contentToSave = currentEssay.content;
    let wordCountToSave = currentEssay.wordCount;
    if (pendingContentRef.current) {
      contentToSave = pendingContentRef.current.content;
      wordCountToSave = pendingContentRef.current.wordCount;
    }

    try {
      setIsSaving(true);
      isUpdatingRef.current = true;

      const isCustom =
        currentProgram?.degreeType === "STANDALONE" || currentProgram?.isCustom;

      // Use correct route based on essay type
      const apiRoute = isCustom
        ? "/api/essay/independent"
        : `/api/essay/${encodeURIComponent(universityName)}`;

      const response = await fetch(apiRoute, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essayId: currentEssay.id,
          content: contentToSave,
          wordCount: wordCountToSave,
          isAutoSave: true,
          isCustomEssay: isCustom,
          userId,
          userEmail,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // ✅ FIX: Update workspace data immediately with response
        setWorkspaceData((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            programs: prev.programs.map((program) =>
              program.id === activeProgramId
                ? {
                    ...program,
                    essays: program.essays.map((essayData) =>
                      essayData.promptId === activeEssayPromptId
                        ? {
                            ...essayData,
                            userEssay: result.essay, // ← Use server response
                          }
                        : essayData,
                    ),
                  }
                : program,
            ),
          };
        });

        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        pendingContentRef.current = null;
        return true;
      }
      return false;
    } catch (error) {
      console.error("Auto-save error:", error);
      return false;
    } finally {
      setIsSaving(false);
      isUpdatingRef.current = false;
    }
  }, [
    currentEssay,
    isSaving,
    universityName,
    userId,
    userEmail,
    isUniversityAdded,
    activeProgramId,
    activeEssayPromptId,
    currentProgram,
  ]);

  // ========== IMPROVED: CREATE ESSAY FUNCTION ==========
  const createEssay = useCallback(async () => {
    const validation = validateUserAndUniversity("createEssay");
    if (!validation.isValid) {
      toast.error(validation.error);
      return null;
    }

    if (!activeProgramId || !activeEssayPromptId || isCreatingEssay) {
      return null;
    }

    try {
      setIsCreatingEssay(true);
      setWorkspaceError(null);
      isUpdatingRef.current = true;

      // Log for debugging
      console.log("Creating essay with:", {
        userId,
        userEmail,
        activeProgramId,
        activeEssayPromptId,
        isUniversityAdded,
      });

      const isCustom =
        currentProgram?.degreeType === "STANDALONE" || currentProgram?.isCustom;
      const apiRoute = isCustom
        ? "/api/essay/independent"
        : `/api/essay/${encodeURIComponent(universityName)}`;

      const response = await fetch(apiRoute, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_essay",
          programId: activeProgramId,
          essayPromptId: activeEssayPromptId,
          userId,
          userEmail,
          isCustomEssay: isCustom,
        }),
      });

      const responseData = await response.json();

      if (response.ok && responseData.essay) {
        setWorkspaceData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            programs: prev.programs.map((program) =>
              program.id === activeProgramId
                ? {
                    ...program,
                    essays: program.essays.map((essayData) =>
                      essayData.promptId === activeEssayPromptId
                        ? { ...essayData, userEssay: responseData.essay }
                        : essayData,
                    ),
                  }
                : program,
            ),
          };
        });

        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        lastContentRef.current = responseData.essay.content || "";

        toast.success("Essay created successfully");

        return responseData.essay;
      } else {
        console.error("Failed to create essay:", responseData);
        setWorkspaceError(responseData.error || "Failed to create essay");
        toast.error(responseData.error || "Failed to create essay");
        return null;
      }
    } catch (error) {
      console.error("Error creating essay:", error);
      setWorkspaceError("Network error while creating essay");
      toast.error("Network error while creating essay");
      return null;
    } finally {
      setIsCreatingEssay(false);
      isUpdatingRef.current = false;
    }
  }, [
    activeProgramId,
    activeEssayPromptId,
    universityName,
    isCreatingEssay,
    userId,
    userEmail,
    isUniversityAdded,
    currentProgram,
  ]);

  // ========== UPDATE ESSAY CONTENT ==========
  const updateEssayContent = useCallback(
    (content, wordCount) => {
      if (!isUniversityAdded) return;

      pendingContentRef.current = { content, wordCount };
      isEditorActiveRef.current = true;
      lastTypingTimeRef.current = Date.now();

      if (updateDebounceRef.current) {
        clearTimeout(updateDebounceRef.current);
      }

      updateDebounceRef.current = setTimeout(() => {
        if (!pendingContentRef.current) return;

        const { content: newContent, wordCount: newWordCount } =
          pendingContentRef.current;

        if (
          !currentEssay &&
          currentProgram?.degreeType !== "STANDALONE" &&
          !currentProgram?.isCustom
        ) {
          createEssay();
          return;
        }

        // Update workspace data correctly
        setWorkspaceData((prev) => {
          if (!prev) return prev;

          const programIndex = prev.programs.findIndex(
            (p) => p.id === activeProgramId,
          );
          if (programIndex === -1) return prev;

          const program = prev.programs[programIndex];
          if (!program.essays) return prev;

          const essayIndex = program.essays.findIndex(
            (e) => e.promptId === activeEssayPromptId,
          );
          if (essayIndex === -1) return prev;

          const currentContent = program.essays[essayIndex].userEssay?.content;
          if (currentContent === newContent) return prev;

          const newPrograms = [...prev.programs];
          const newProgram = { ...program };
          const newEssays = [...program.essays];
          const newEssayData = { ...newEssays[essayIndex] };

          newEssayData.userEssay = {
            ...newEssayData.userEssay,
            content: newContent,
            wordCount: newWordCount,
            lastModified: new Date(),
          };

          newEssays[essayIndex] = newEssayData;
          newProgram.essays = newEssays;
          newPrograms[programIndex] = newProgram;

          return { ...prev, programs: newPrograms };
        });

        setHasUnsavedChanges(true);
        pendingContentRef.current = null;

        setTimeout(() => {
          isEditorActiveRef.current = false;
        }, 100);
      }, 600);
    },
    [
      currentEssay,
      activeProgramId,
      activeEssayPromptId,
      createEssay,
      isUniversityAdded,
      currentProgram,
    ],
  );

  // ✅ FIX D: UPDATED saveVersion function with immediate data refresh
  const saveVersion = useCallback(
    async (label) => {
      if (
        !currentEssay ||
        isSaving ||
        isSavingVersion ||
        !userId ||
        !isUniversityAdded
      )
        return false;

      let contentToSave = currentEssay.content;
      let wordCountToSave = currentEssay.wordCount;
      if (pendingContentRef.current) {
        contentToSave = pendingContentRef.current.content;
        wordCountToSave = pendingContentRef.current.wordCount;
      }

      try {
        setIsSavingVersion(true);

        if (hasUnsavedChanges) {
          const autoSaved = await autoSaveEssay();
          if (!autoSaved) {
            toast.error("Failed to save current changes");
            return false;
          }
        }

        const isCustom =
          currentProgram?.degreeType === "STANDALONE" ||
          currentProgram?.isCustom;
        const apiRoute = isCustom
          ? "/api/essay/independent"
          : `/api/essay/${encodeURIComponent(universityName)}`;

        const response = await fetch(apiRoute, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save_version",
            essayId: currentEssay.id,
            content: contentToSave,
            wordCount: wordCountToSave,
            label: label || `Version ${new Date().toLocaleString()}`,
            isCustomEssay: isCustom,
            userId,
            userEmail,
          }),
        });

        if (response.ok) {
          const result = await response.json();

          toast.success("Version saved successfully");
          
          // ✅ FIX: Force immediate refresh from API
          await forceRefresh();
          
          // ✅ FIX: Update UI immediately with optimistic update
          setWorkspaceData((prev) => {
            if (!prev) return prev;

            return {
              ...prev,
              programs: prev.programs.map((program) =>
                program.id === activeProgramId
                  ? {
                      ...program,
                      essays: program.essays.map((essayData) =>
                        essayData.promptId === activeEssayPromptId
                          ? {
                              ...essayData,
                              userEssay: {
                                ...essayData.userEssay,
                                ...result.essay, // ← Use latest from server
                                versions: result.essay.versions || essayData.userEssay.versions,
                                lastModified: new Date(),
                              },
                            }
                          : essayData,
                      ),
                    }
                  : program,
              ),
            };
          });

          // Navigate back to list view after short delay for smooth UX
          setTimeout(() => {
            setActiveView("list");
            setOpenPanels([]);
          }, 300);

          return true;
        }
        return false;
      } catch (error) {
        console.error("Error saving version:", error);
        toast.error("Failed to save version");
        return false;
      } finally {
        setIsSavingVersion(false);
      }
    },
    [
      currentEssay,
      isSaving,
      isSavingVersion,
      hasUnsavedChanges,
      autoSaveEssay,
      universityName,
      activeProgramId,
      activeEssayPromptId,
      userId,
      userEmail,
      isUniversityAdded,
      currentProgram,
      forceRefresh,
    ],
  );

  const handleRestoreVersion = async (versionId) => {
    if (!currentEssay || !userId || !isUniversityAdded) return;

    const isCustom =
      currentProgram?.degreeType === "STANDALONE" || currentProgram?.isCustom;
    const apiRoute = isCustom
      ? "/api/essay/independent"
      : `/api/essay/${encodeURIComponent(universityName)}`;

    try {
      const response = await fetch(apiRoute, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "restore_version",
          essayId: currentEssay.id,
          versionId,
          isCustomEssay: isCustom,
          userId,
          userEmail,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.essay) {
          setWorkspaceData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              programs: prev.programs.map((program) =>
                program.id === activeProgramId
                  ? {
                      ...program,
                      essays: program.essays.map((essayData) =>
                        essayData.promptId === activeEssayPromptId
                          ? {
                              ...essayData,
                              userEssay: {
                                ...essayData.userEssay,
                                content: result.essay.content,
                                wordCount: result.essay.wordCount,
                                lastModified: new Date(),
                              },
                            }
                          : essayData,
                      ),
                    }
                  : program,
              ),
            };
          });
          lastContentRef.current = result.essay.content;
          setHasUnsavedChanges(false);
          setLastSaved(new Date());

          toast.success("Version restored successfully");
        }
      }
    } catch (error) {
      console.error("Error restoring version:", error);
      toast.error("Failed to restore version");
    }
  };

  const handleDeleteVersion = async (versionId) => {
    if (!currentEssay || !userId || !isUniversityAdded) return;

    const isCustom =
      currentProgram?.degreeType === "STANDALONE" || currentProgram?.isCustom;
    const apiRoute = isCustom
      ? "/api/essay/independent"
      : `/api/essay/${encodeURIComponent(universityName)}`;

    try {
      const response = await fetch(apiRoute, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_version",
          versionId,
          essayId: currentEssay.id,
          isCustomEssay: isCustom,
          userId,
          userEmail,
        }),
      });

      if (response.ok) {
        setWorkspaceData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            programs: prev.programs.map((program) =>
              program.id === activeProgramId
                ? {
                    ...program,
                    essays: program.essays.map((essayData) =>
                      essayData.promptId === activeEssayPromptId
                        ? {
                            ...essayData,
                            userEssay: {
                              ...essayData.userEssay,
                              versions: (
                                essayData.userEssay?.versions || []
                              ).filter((v) => v.id !== versionId),
                            },
                          }
                        : essayData,
                    ),
                  }
                : program,
            ),
          };
        });

        toast.success("Version deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting version:", error);
      toast.error("Failed to delete version");
    }
  };

  // ========== HANDLERS ==========
  const handleProgramSelect = useCallback(
    (programId) => {
      if (programId === activeProgramId || !isUniversityAdded) return;

      if (updateDebounceRef.current) {
        clearTimeout(updateDebounceRef.current);
        updateDebounceRef.current = null;
      }
      pendingContentRef.current = null;
      isEditorActiveRef.current = false;

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      setActiveProgramId(programId);

      const program = workspaceData?.programs?.find((p) => p.id === programId);

      if (program?.essays?.length > 0) {
        const firstEssay = program.essays[0];
        setActiveEssayPromptId(firstEssay.promptId);
        setSelectedEssayInfo({
          title: firstEssay.promptTitle,
          programName: program.programName || program.name,
          isCustom: program.degreeType === "STANDALONE" || program.isCustom,
          promptText: firstEssay.promptText,
          wordLimit: firstEssay.wordLimit,
        });
      } else {
        setActiveEssayPromptId(null);
      }

      setHasUnsavedChanges(false);
      setLastSaved(null);
      lastContentRef.current = "";
      setOpenPanels([]);
    },
    [activeProgramId, workspaceData, isUniversityAdded],
  );

  const handleEssayPromptSelect = useCallback(
    (promptId, essayInfo = null) => {
      if (promptId === activeEssayPromptId || !isUniversityAdded) return;

      if (updateDebounceRef.current) {
        clearTimeout(updateDebounceRef.current);
        updateDebounceRef.current = null;
      }
      pendingContentRef.current = null;
      isEditorActiveRef.current = false;

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      setActiveEssayPromptId(promptId);

      // Update selected essay info immediately
      if (essayInfo) {
        setSelectedEssayInfo(essayInfo);
      }

      setHasUnsavedChanges(false);
      setLastSaved(null);
      setOpenPanels([]);

      const essayData = currentProgram?.essays?.find(
        (e) => e.promptId === promptId,
      );
      lastContentRef.current = essayData?.userEssay?.content || "";
    },
    [activeEssayPromptId, currentProgram, activeProgramId, isUniversityAdded],
  );

  const handleOpenEditor = useCallback(
    (essay, isCustom = false) => {
      if (!isUniversityAdded) return;

      // Find the essay in workspace data
      if (workspaceData) {
        for (const program of workspaceData.programs) {
          if (!program.essays || program.essays.length === 0) continue;
          const essayData = program.essays.find(
            (e) =>
              e.userEssay?.id === essay.id ||
              e.promptTitle === essay.title ||
              e.promptId === essay.id,
          );
          if (essayData) {
            setActiveProgramId(program.id);
            setActiveEssayPromptId(essayData.promptId);
            setSelectedEssayInfo({
              title: essayData.promptTitle,
              programName: program.programName || program.name,
              isCustom: program.degreeType === "STANDALONE" || program.isCustom,
              promptText: essayData.promptText,
              wordLimit: essayData.wordLimit,
            });
            lastContentRef.current = essayData.userEssay?.content || "";
            setActiveView("editor");
            setHasUnsavedChanges(false);
            setLastSaved(null);
            setOpenPanels([]);
            return;
          }
        }
      }

      // If not found, create new selection
      setSelectedEssayInfo({
        title: essay.title || essay.promptTitle || "Essay",
        programName: isCustom ? "My Custom Essays" : "",
        isCustom: isCustom,
        promptText: essay.text || essay.prompt || essay.promptText || "",
        wordLimit: essay.wordLimit || 500,
      });

      // For custom essays, try to find the standalone program
      if (isCustom && workspaceData) {
        const standaloneProgram = workspaceData.programs.find(
          (p) => p.degreeType === "STANDALONE" || p.isCustom,
        );
        if (standaloneProgram) {
          setActiveProgramId(standaloneProgram.id);
          const customEssay = standaloneProgram.essays?.find(
            (e) => e.userEssay?.id === essay.id,
          );
          if (customEssay) {
            setActiveEssayPromptId(customEssay.promptId);
            lastContentRef.current = customEssay.userEssay?.content || "";
          }
        }
      }

      setActiveView("editor");
      setHasUnsavedChanges(false);
      setLastSaved(null);
      setOpenPanels([]);
    },
    [workspaceData, isUniversityAdded],
  );

  const handleBackToList = useCallback(async () => {
    if (hasUnsavedChanges && isUniversityAdded) {
      await autoSaveEssay();
    }
    setActiveView("list");
    setOpenPanels([]);
    // Clear selected info when going back
    setSelectedEssayInfo({
      title: "",
      programName: "",
      isCustom: false,
      promptText: "",
      wordLimit: 500,
    });
  }, [hasUnsavedChanges, isUniversityAdded, autoSaveEssay]);

  // ========== MEMOIZED EDITOR PROPS ==========
  const editorKey = useMemo(() => {
    return `editor-${currentEssay?.id || "new"}-${activeProgramId}-${activeEssayPromptId}`;
  }, [currentEssay?.id, activeProgramId, activeEssayPromptId]);

  // In ApplicationTabs, ensure content is passed correctly:
  const editorContent = useMemo(() => {
    // Don't pass undefined - causes sync issues
    if (isEditorActiveRef.current) {
      return currentEssay?.content || ""; // ← Use current essay content
    }
    return currentEssay?.content || "";
  }, [currentEssay?.id, currentEssay?.content]);

  // ========== DISPLAY TITLE ==========
  const displayTitle = useMemo(() => {
    if (selectedEssayInfo.title) {
      return selectedEssayInfo.title;
    }
    if (currentEssayData?.promptTitle) {
      return currentEssayData.promptTitle;
    }
    if (
      currentProgram?.degreeType === "STANDALONE" ||
      currentProgram?.isCustom
    ) {
      return "Custom Essay";
    }
    return "Loading...";
  }, [selectedEssayInfo.title, currentEssayData?.promptTitle, currentProgram]);

  const displayProgramName = useMemo(() => {
    if (selectedEssayInfo.programName) {
      return selectedEssayInfo.programName;
    }
    if (
      currentProgram?.degreeType === "STANDALONE" ||
      currentProgram?.isCustom
    ) {
      return "My Custom Essays";
    }
    return currentProgram?.programName || currentProgram?.name || "";
  }, [selectedEssayInfo.programName, currentProgram]);

  // ========== CUSTOM ESSAY CARD COMPONENT ==========
  const CustomEssayCard = React.memo(({ essay, index, onEdit, onDelete }) => {
    const progress =
      essay.wordLimit > 0 ? (essay.wordCount / essay.wordLimit) * 100 : 0;

    const priorityColors = {
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

    const priorityConfig =
      priorityColors[essay.priority] || priorityColors.medium;
    const PriorityIcon = priorityConfig.icon;
    const StatusIcon = essay.isCompleted ? CheckCircle2 : FileText;

    return (
      <div
        className="bg-gradient-to-r from-white/5 to-white/10 rounded-xl border border-white/20 hover:border-purple-400/50 hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
        onClick={() => onEdit(essay)}
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white text-sm bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 rounded-lg shadow-lg shadow-purple-500/30">
                    My Custom Essay
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border}`}
                  >
                    <PriorityIcon className="w-3 h-3" />
                    {essay.priority.charAt(0).toUpperCase() +
                      essay.priority.slice(1)}{" "}
                    Priority
                  </span>
                </div>
                <h4 className="font-semibold text-white text-lg truncate group-hover:text-purple-200 transition-colors">
                  {essay.title}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                  essay.isCompleted
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30"
                    : "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
                }`}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {essay.isCompleted ? "Completed" : "In Progress"}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
            <p className="text-white/80 text-sm leading-relaxed line-clamp-2">
              {essay.prompt}
            </p>
          </div>

          <div className="flex items-center justify-between text-sm text-white/60">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg">
                <FileText className="h-3.5 w-3.5 text-white/50" />
                {essay.wordLimit} words max
              </span>
              {essay.wordCount > 0 && (
                <span className="font-semibold text-white bg-purple-500/20 px-3 py-1 rounded-lg">
                  {essay.wordCount} / {essay.wordLimit} words
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-28 bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    progress === 100
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                      : progress > 0
                        ? "bg-gradient-to-r from-purple-500 to-pink-500"
                        : "bg-white/30"
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <span
                className={`font-bold w-12 text-right ${
                  progress === 100
                    ? "text-emerald-400"
                    : progress > 0
                      ? "text-purple-400"
                      : "text-white/40"
                }`}
              >
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(essay);
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30 text-sm px-4 py-2"
            >
              <Edit3 className="h-3.5 w-3.5 mr-1.5" />
              Open Editor
            </Button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                openDeleteConfirmation(essay.id, essay.title);
              }}
              className="text-xs text-white/50 hover:text-red-400 flex items-center gap-1 transition-colors px-3 py-1.5 hover:bg-red-500/10 rounded-lg"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  });

  CustomEssayCard.displayName = "CustomEssayCard";

  // ========== ESSAY CARD COMPONENT ==========
  const EssayCard = useCallback(
    ({ essay, index }) => {
      const actualProgress = getEssayProgress(essay);
      const statusConfig = getEssayStatus(essay);
      const EssayStatusIcon = statusConfig.icon;

      return (
        <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="font-bold text-[#002147] text-sm whitespace-nowrap bg-blue-50 px-3 py-1 rounded-lg">
                  Essay {index + 1}
                </span>
                <h4 className="font-semibold text-gray-900 text-base truncate">
                  {essay.title}
                </h4>
                {essay.isMandatory && (
                  <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                    Required
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.shadow}`}
                >
                  <EssayStatusIcon className="h-3.5 w-3.5" />
                  {statusConfig.label}
                </div>
                {isUniversityAdded ? (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditor(essay, false);
                    }}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                  >
                    <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled
                    className="bg-gray-300 text-gray-500 cursor-not-allowed"
                  >
                    <Lock className="h-3.5 w-3.5 mr-1.5" />
                    Locked
                  </Button>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-lg p-4 mb-4 border-l-4 border-[#002147]">
              <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">
                {essay.text}
              </p>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-lg">
                  <FileText className="h-3.5 w-3.5 text-gray-500" />
                  {essay.wordLimit || 500} words max
                </span>
                {essay.wordCount > 0 && (
                  <span className="font-semibold text-[#002147] bg-blue-50 px-3 py-1 rounded-lg">
                    {essay.wordCount} / {essay.wordLimit || 500} words
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-28 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      actualProgress === 100
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                        : actualProgress > 0
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                          : "bg-gray-300"
                    }`}
                    style={{ width: `${actualProgress}%` }}
                  />
                </div>
                <span
                  className={`font-bold w-12 text-right ${
                    actualProgress === 100
                      ? "text-emerald-600"
                      : actualProgress > 0
                        ? "text-blue-600"
                        : "text-gray-400"
                  }`}
                >
                  {actualProgress}%
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    },
    [handleOpenEditor, isUniversityAdded],
  );

  // ========== HELPER FUNCTIONS ==========
  const getProgressBarColor = () => {
    if (progressData.applicationStatus === "submitted") return "bg-green-500";
    if (progressData.applicationStatus === "in-progress") return "bg-blue-500";
    return "bg-gray-400";
  };

  const getStatusInfo = () => {
    switch (progressData.applicationStatus) {
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

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const formatDate = (dateString) => {
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

  const getStatusColors = (status, priority = "medium") => {
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

  const getItemIcon = (item) => {
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

  const getEssayProgress = (essay) => {
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
        100,
      );
    }

    return 0;
  };

  const getEssayStatus = (essay) => {
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

  // ========== RENDER PANELS ==========
  const renderPanels = () => {
    if (!currentEssay || openPanels.length === 0 || !isUniversityAdded)
      return null;

    const isCustom =
      currentProgram?.degreeType === "STANDALONE" || currentProgram?.isCustom;

    return (
      <>
        <Panel
          name="versions"
          title="Version History"
          icon={Layers}
          iconColor="from-blue-500/20 to-cyan-500/20"
          isOpen={isPanelOpen("versions")}
          onClose={() => closePanel("versions")}
        >
          <Suspense fallback={<PanelLoader />}>
            <VersionManager
              versions={currentEssay.versions || []}
              currentContent={currentEssay.content || ""}
              onRestoreVersion={handleRestoreVersion}
              onDeleteVersion={handleDeleteVersion}
              essayId={currentEssay.id}
              universityName={universityName}
              isLoading={workspaceLoading}
            />
          </Suspense>
        </Panel>

        <Panel
          name="analytics"
          title="Essay Analytics"
          icon={PieChart}
          iconColor="from-purple-500/20 to-pink-500/20"
          isOpen={isPanelOpen("analytics")}
          onClose={() => closePanel("analytics")}
        >
          <Suspense fallback={<PanelLoader />}>
            <EssayAnalytics
              essay={{
                ...currentEssay,
                wordLimit:
                  currentEssayData?.wordLimit || selectedEssayInfo.wordLimit,
                priority: currentEssayData?.priority,
              }}
              allEssays={
                isCustom
                  ? customEssays
                  : programsWithEssays.flatMap((p) =>
                      p.essays.map((e) => e.userEssay).filter(Boolean),
                    )
              }
              essayId={currentEssay.id}
              userId={userId}
              universityName={universityName}
            />
          </Suspense>
        </Panel>

        <Panel
          name="ai"
          title="AI Assistant"
          icon={Brain}
          iconColor="from-amber-500/20 to-orange-500/20"
          isOpen={isPanelOpen("ai")}
          onClose={() => closePanel("ai")}
        >
          <AISuggestions
            content={currentEssay.content || ""}
            prompt={
              currentEssayData?.promptText || selectedEssayInfo.promptText
            }
            wordCount={currentEssay.wordCount || 0}
            wordLimit={
              currentEssayData?.wordLimit || selectedEssayInfo.wordLimit
            }
            essayId={currentEssay.id}
            universityName={universityName}
            currentVersionId={null}
            versions={currentEssay.versions || []}
            isCustomEssay={isCustom}
          />
        </Panel>
      </>
    );
  };

  // ========== UNIQUE CUSTOM ESSAYS ==========
  const uniqueCustomEssays = useMemo(() => {
    return Array.from(
      new Map(customEssays.map((essay) => [essay.id, essay])).values(),
    );
  }, [customEssays]);

  // ========== EFFECTS ==========
  useEffect(() => {
    if (
      !hasUnsavedChanges ||
      !currentEssay ||
      isSaving ||
      activeView !== "editor" ||
      !isUniversityAdded
    ) {
      return;
    }

    const timerId = setTimeout(() => {
      const timeSinceLastType = Date.now() - lastTypingTimeRef.current;
      if (timeSinceLastType >= 20000) {
        autoSaveEssay();
      }
    }, 25000);

    return () => clearTimeout(timerId);
  }, [
    hasUnsavedChanges,
    currentEssay?.id,
    isSaving,
    activeView,
    autoSaveEssay,
    isUniversityAdded,
  ]);

  // ✅ FIX E: Update effect to fetch on mount
  useEffect(() => {
    if (universityName && userId && isUniversityAdded) {
      fetchWorkspaceData();
    }
  }, [universityName, userId, isUniversityAdded, fetchWorkspaceData]);
  
  // Separate effect for editor view
  useEffect(() => {
    if (activeView === "editor" && !workspaceData && universityName && userId && isUniversityAdded) {
      fetchWorkspaceData();
    }
  }, [activeView, workspaceData, universityName, userId, fetchWorkspaceData, isUniversityAdded]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      if (updateDebounceRef.current) {
        clearTimeout(updateDebounceRef.current);
      }
      if (saveVersionRef.current) {
        clearTimeout(saveVersionRef.current);
      }
    };
  }, []);

  // ========== RENDER ==========
  if (sessionStatus === "loading") {
    return (
      <div className="my-20">
        <Card className="bg-[#002147] shadow-xl border-0 overflow-hidden">
          <CardContent className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-white mr-3" />
            <span className="text-white">Loading...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="my-20">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Fix for select dropdown visibility */
        select {
          color: white !important;
          background-color: #002147 !important;
        }
        select option {
          background-color: #002147 !important;
          color: white !important;
        }
        select:focus option {
          background-color: #003366 !important;
        }
        select::-ms-expand {
          display: none;
        }
      `}</style>

      {/* Debug Panel (Development Only) */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-xs text-white p-2 rounded-lg z-50 opacity-50 hover:opacity-100 transition-opacity">
          <div>Session: {sessionStatus}</div>
          <div>User ID: {userId ? "✓" : "✗"}</div>
          <div>User Email: {userEmail ? "✓" : "✗"}</div>
          <div>University Added: {isUniversityAdded ? "✓" : "✗"}</div>
        </div>
      )}

      <Card className="bg-[#002147] shadow-xl hover:shadow-2xl transition-all duration-500 border-0 overflow-hidden">
        <CardContent className="p-0">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-[#002147] to-[#003366] p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-3">
                  {activeView === "editor" && (
                    <button
                      onClick={handleBackToList}
                      className="mr-3 p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full mr-4"></div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    {activeView === "editor"
                      ? "Essay Editor"
                      : "Application Workspace"}
                  </h2>
                  {!isUniversityAdded && (
                    <Lock className="w-5 h-5 ml-3 text-white/60" />
                  )}
                </div>
                <p className="text-white/80 text-sm font-medium">
                  {activeView === "editor"
                    ? `Editing: ${displayTitle}`
                    : `Your personalized application center for ${universityName || "this university"}`}
                </p>
              </div>

              {/* Progress Indicator */}
              {isUniversityAdded && (
                <div className="hidden md:flex items-center space-x-4">
                  <div className="text-right text-sm">
                    <div className="text-white font-semibold">
                      Application Progress
                    </div>
                    <div className="text-white/70">
                      {progressData.overallProgress}% Complete
                    </div>
                  </div>
                  <div className="w-16 h-16 relative">
                    <svg
                      className="w-16 h-16 transform -rotate-90"
                      viewBox="0 0 36 36"
                    >
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="url(#progressGradient)"
                        strokeWidth="3"
                        strokeDasharray={`${progressData.overallProgress}, 100`}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient
                          id="progressGradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop offset="0%" stopColor="#60A5FA" />
                          <stop offset="100%" stopColor="#34D399" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {progressData.overallProgress}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Info Card */}
            {isUniversityAdded && (
              <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <StatusIcon className="h-4 w-4 text-white" />
                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/20 text-white">
                      {statusInfo.text}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-white">
                    {progressData.overallProgress}%
                  </span>
                </div>

                <div className="w-full h-2.5 bg-white/20 rounded-full mb-3 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${getProgressBarColor()}`}
                    style={{ width: `${progressData.overallProgress}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="text-center text-white p-2 bg-white/5 rounded-lg">
                    <div className="font-semibold">Essays</div>
                    <div className="text-white/70 text-lg font-bold">
                      {progressData.completedEssays}/{progressData.totalEssays}
                    </div>
                  </div>
                  <div className="text-center text-white p-2 bg-white/5 rounded-lg">
                    <div className="font-semibold">Tasks</div>
                    <div className="text-white/70 text-lg font-bold">
                      {progressData.completedTasks}/{progressData.totalTasks}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="p-6 space-y-8">
            {activeView === "list" ? (
              // ========== LIST VIEW ==========
              <Tabs defaultValue="essays" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100 h-14">
                  <TabsTrigger
                    value="essays"
                    className="data-[state=active]:bg-[#002147] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-300 h-11 font-semibold relative"
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    <span className="hidden sm:inline">Essay Workspace</span>
                    <span className="sm:hidden">Essays</span>
                    {!isUniversityAdded && (
                      <Lock className="w-4 h-4 ml-2 absolute right-2" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="deadlines"
                    className="data-[state=active]:bg-[#002147] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-300 h-11 font-semibold relative"
                  >
                    <Clock className="h-5 w-5 mr-2" />
                    <span className="hidden sm:inline">Tasks & Events</span>
                    <span className="sm:hidden">Tasks</span>
                    {!isUniversityAdded && (
                      <Lock className="w-4 h-4 ml-2 absolute right-2" />
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Essays Tab */}
                <TabsContent value="essays" className="mt-8">
                  {!isUniversityAdded ? (
                    <LockedTabContent
                      tabName="Essays"
                      universityName={universityName}
                      onAddUniversity={handleAddUniversity}
                      isAddingUniversity={isAddingUniversity}
                    />
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-white">
                            Essay Requirements
                          </h3>
                          <p className="text-white/80 text-sm mt-1">
                            {progressData.totalEssays} essays •{" "}
                            {progressData.completedEssays} completed
                          </p>
                        </div>
                        <Button
                          onClick={() => setShowCustomEssayModal(true)}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Custom Essay
                        </Button>
                      </div>

                      {/* Custom Essays Section */}
                      {uniqueCustomEssays.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Sparkles className="h-5 w-5 text-purple-400" />
                            <h4 className="text-lg font-semibold text-white">
                              My Custom Essays
                            </h4>
                            <span className="text-xs text-white/60 bg-purple-500/20 px-2 py-1 rounded-full">
                              {uniqueCustomEssays.length} essay
                              {uniqueCustomEssays.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          {uniqueCustomEssays.map((essay, index) => (
                            <CustomEssayCard
                              key={`custom-${essay.id}-${index}`}
                              essay={essay}
                              index={index}
                              onEdit={(essay) => handleOpenEditor(essay, true)}
                              onDelete={(essayId) =>
                                handleDeleteCustomEssay(essayId)
                              }
                            />
                          ))}
                        </div>
                      )}

                      {/* Regular Essays Section */}
                      <div className="space-y-4">
                        {uniqueCustomEssays.length > 0 && (
                          <div className="flex items-center space-x-2 mb-2">
                            <BookOpen className="h-5 w-5 text-blue-400" />
                            <h4 className="text-lg font-semibold text-white">
                              University Essay Prompts
                            </h4>
                            <span className="text-xs text-white/60 bg-blue-500/20 px-2 py-1 rounded-full">
                              {university?.allEssayPrompts?.length || 0} essay
                              {(university?.allEssayPrompts?.length || 0) !== 1
                                ? "s"
                                : ""}
                            </span>
                          </div>
                        )}

                        {university?.allEssayPrompts &&
                        university.allEssayPrompts.length > 0 ? (
                          <div className="space-y-4">
                            {university.allEssayPrompts.map((essay, index) => (
                              <EssayCard
                                key={essay.id || index}
                                essay={essay}
                                index={index}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-white/5 rounded-xl">
                            <FileText className="h-12 w-12 text-white/40 mx-auto mb-3" />
                            <h4 className="text-lg font-semibold text-white mb-1">
                              No Essay Prompts
                            </h4>
                            <p className="text-white/60 text-sm">
                              Essays will appear when available
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Tasks & Events Tab */}
                <TabsContent value="deadlines" className="mt-8">
                  {!isUniversityAdded ? (
                    <LockedTabContent
                      tabName="Tasks & Events"
                      universityName={universityName}
                      onAddUniversity={handleAddUniversity}
                      isAddingUniversity={isAddingUniversity}
                    />
                  ) : (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-2xl font-bold text-white">
                            Tasks & Events
                          </h3>
                          <p className="text-white text-sm mt-1">
                            {progressData.completedTasks} of{" "}
                            {progressData.totalTasks} tasks completed
                          </p>
                        </div>
                        <Button
                          onClick={() => router.push("/dashboard/calendar")}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/30"
                        >
                          <CalendarDays className="h-4 w-4 mr-2" />
                          Manage Calendar
                        </Button>
                      </div>

                      <div className="grid gap-4">
                        {tasksAndEvents.length === 0 ? (
                          <div className="text-center py-12">
                            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h4 className="text-lg font-semibold text-white mb-2">
                              No Tasks or Events
                            </h4>
                            <p className="text-gray-300 mb-6">
                              Your application tasks and events will appear
                              here.
                            </p>
                          </div>
                        ) : (
                          tasksAndEvents.map((item, index) => (
                            <div
                              key={item.id || index}
                              className="flex items-center justify-between p-6 border-2 border-gray-100 rounded-2xl hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50"
                            >
                              <div className="flex items-center space-x-4">
                                <div
                                  className={`p-3 rounded-xl ${
                                    item.status === "completed"
                                      ? "bg-green-100"
                                      : item.type === "event"
                                        ? "bg-purple-100"
                                        : item.priority === "high"
                                          ? "bg-red-100"
                                          : item.priority === "medium"
                                            ? "bg-yellow-100"
                                            : "bg-blue-100"
                                  }`}
                                >
                                  {getItemIcon(item)}
                                </div>

                                <div>
                                  <div className="font-bold text-[#002147] text-lg flex items-center space-x-2">
                                    <span>{item.task}</span>
                                    {item.type === "event" && (
                                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                        EVENT
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500 flex items-center space-x-4 flex-wrap gap-2">
                                    <span>{formatDate(item.date)}</span>
                                    {item.time && <span>• {item.time}</span>}
                                    {item.daysLeft !== undefined &&
                                      item.status !== "completed" && (
                                        <span
                                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            item.daysLeft <= 0
                                              ? "bg-red-100 text-red-700"
                                              : item.daysLeft <= 7
                                                ? "bg-orange-100 text-orange-700"
                                                : "bg-blue-100 text-blue-700"
                                          }`}
                                        >
                                          <Timer className="h-3 w-3 mr-1 inline" />
                                          {item.daysLeft === 0
                                            ? "Due today"
                                            : item.daysLeft < 0
                                              ? `${Math.abs(item.daysLeft)} days overdue`
                                              : `${item.daysLeft} days left`}
                                        </span>
                                      )}
                                  </div>
                                </div>
                              </div>

                              <span
                                className={`px-4 py-2 text-sm rounded-full font-medium ${getStatusColors(item.status, item.priority)}`}
                              >
                                {item.status === "completed" && (
                                  <CheckCircle className="h-4 w-4 mr-1 inline" />
                                )}
                                {item.status.replace("-", " ")}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              // ========== EDITOR VIEW ==========
              <div className="space-y-6">
                {!isUniversityAdded ? (
                  <LockedTabContent
                    tabName="Essay Editor"
                    universityName={universityName}
                    onAddUniversity={handleAddUniversity}
                    isAddingUniversity={isAddingUniversity}
                  />
                ) : (
                  <>
                    {!userId && sessionStatus === "authenticated" && (
                      <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl p-4 flex items-center">
                        <AlertCircle className="w-5 h-5 text-amber-400 mr-3" />
                        <div>
                          <p className="text-amber-200 font-medium">
                            Session issue detected
                          </p>
                          <p className="text-amber-300/70 text-sm">
                            User ID not found. Try refreshing or signing out and
                            back in.
                          </p>
                        </div>
                      </div>
                    )}

                    {workspaceLoading && !currentEssayData ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-white" />
                        <span className="ml-3 text-white">
                          Loading workspace...
                        </span>
                      </div>
                    ) : workspaceError ? (
                      <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-white mb-2">
                          Error Loading Workspace
                        </h4>
                        <p className="text-white/60 mb-4">{workspaceError}</p>
                        <Button
                          onClick={fetchWorkspaceData}
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          Try Again
                        </Button>
                      </div>
                    ) : !userId ? (
                      <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-white mb-2">
                          Authentication Required
                        </h4>
                        <p className="text-white/60 mb-4">
                          Please sign in to access the essay editor.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-12 gap-6">
                        {/* Left Sidebar - Essay Selector */}
                        <div className="col-span-12 lg:col-span-3">
                          <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl">
                            <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-white/10">
                              <div className="p-2 bg-blue-500/20 rounded-lg">
                                <BookOpen className="w-5 h-5 text-blue-400" />
                              </div>
                              <h3 className="font-bold text-white">
                                Programs & Essays
                              </h3>
                            </div>

                            <div className="space-y-2 max-h-[450px] overflow-y-auto custom-scrollbar pr-1">
                              {/* Custom Essays Section */}
                              {uniqueCustomEssays.length > 0 && (
                                <div className="space-y-1 mb-3">
                                  <div
                                    onClick={() => {
                                      const standaloneProgram =
                                        workspaceData?.programs?.find(
                                          (p) =>
                                            p.degreeType === "STANDALONE" ||
                                            p.isCustom,
                                        );
                                      if (standaloneProgram) {
                                        handleProgramSelect(
                                          standaloneProgram.id,
                                        );
                                      }
                                    }}
                                    className={`px-2 py-2 flex items-center space-x-2 cursor-pointer rounded-lg transition-all ${
                                      currentProgram?.degreeType ===
                                        "STANDALONE" || currentProgram?.isCustom
                                        ? "bg-gradient-to-r from-purple-500/30 to-pink-500/20 border-l-4 border-purple-400"
                                        : "hover:bg-white/10 border-l-4 border-transparent"
                                    }`}
                                  >
                                    <Sparkles className="w-4 h-4 text-purple-400" />
                                    <span className="text-sm font-semibold text-white">
                                      My Custom Essays
                                    </span>
                                    <span className="text-xs text-white/40 bg-purple-500/20 px-1.5 py-0.5 rounded-full ml-auto">
                                      {uniqueCustomEssays.length}
                                    </span>
                                  </div>
                                  {(currentProgram?.degreeType ===
                                    "STANDALONE" ||
                                    currentProgram?.isCustom) &&
                                    workspaceData?.programs
                                      ?.find((p) => p.id === activeProgramId)
                                      ?.essays?.map((essay) => (
                                        <div
                                          key={`custom-essay-${essay.promptId}-${essay.programId || ""}`}
                                          onClick={() =>
                                            handleEssayPromptSelect(
                                              essay.promptId,
                                              {
                                                title: essay.promptTitle,
                                                programName: "My Custom Essays",
                                                isCustom: true,
                                                promptText: essay.promptText,
                                                wordLimit: essay.wordLimit,
                                              },
                                            )
                                          }
                                          className={`p-2.5 pl-5 ml-3 rounded-lg cursor-pointer transition-all text-xs ${
                                            activeEssayPromptId ===
                                            essay.promptId
                                              ? "bg-gradient-to-r from-purple-500/50 to-pink-500/30 border-l-2 border-pink-400"
                                              : "hover:bg-white/10 border-l-2 border-white/10"
                                          }`}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="text-white/90 truncate flex-1">
                                              {essay.promptTitle}
                                            </span>
                                            {essay.userEssay?.wordCount > 0 && (
                                              <span className="text-purple-400 text-[10px] ml-2 font-bold bg-purple-500/20 px-1.5 py-0.5 rounded">
                                                {Math.round(
                                                  (essay.userEssay.wordCount /
                                                    essay.wordLimit) *
                                                    100,
                                                )}
                                                %
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                </div>
                              )}

                              {/* Regular Programs */}
                              {programsWithEssays.length === 0 &&
                              uniqueCustomEssays.length === 0 ? (
                                <div className="text-center py-6">
                                  <FileText className="w-8 h-8 text-white/30 mx-auto mb-2" />
                                  <p className="text-sm text-white/50">
                                    No programs with essays
                                  </p>
                                </div>
                              ) : (
                                programsWithEssays.map((program) => (
                                  <div key={program.id} className="space-y-1">
                                    <div
                                      onClick={() =>
                                        handleProgramSelect(program.id)
                                      }
                                      className={`p-3 rounded-xl cursor-pointer transition-all text-sm ${
                                        activeProgramId === program.id &&
                                        program.degreeType !== "STANDALONE"
                                          ? "bg-gradient-to-r from-blue-500/30 to-cyan-500/20 border-l-4 border-blue-400 shadow-lg"
                                          : "hover:bg-white/10 border-l-4 border-transparent"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-semibold text-white">
                                          {program.programName || program.name}
                                        </span>
                                        <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/60">
                                          {program.essays?.length || 0}
                                        </span>
                                      </div>
                                    </div>

                                    {activeProgramId === program.id &&
                                      program.essays?.map((essayData) => {
                                        const hasContent =
                                          essayData.userEssay?.wordCount > 0;
                                        return (
                                          <div
                                            key={`regular-${essayData.promptId}-${program.id}`}
                                            onClick={() =>
                                              handleEssayPromptSelect(
                                                essayData.promptId,
                                                {
                                                  title: essayData.promptTitle,
                                                  programName:
                                                    program.programName ||
                                                    program.name,
                                                  isCustom: false,
                                                  promptText:
                                                    essayData.promptText,
                                                  wordLimit:
                                                    essayData.wordLimit,
                                                },
                                              )
                                            }
                                            className={`p-2.5 pl-5 ml-3 rounded-lg cursor-pointer transition-all text-xs ${
                                              activeEssayPromptId ===
                                              essayData.promptId
                                                ? "bg-gradient-to-r from-blue-500/50 to-cyan-500/30 border-l-2 border-cyan-400"
                                                : "hover:bg-white/10 border-l-2 border-white/10"
                                            }`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <span className="text-white/90 truncate flex-1">
                                                {essayData.promptTitle}
                                              </span>
                                              {hasContent && (
                                                <span className="text-emerald-400 text-[10px] ml-2 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded">
                                                  {Math.round(
                                                    (essayData.userEssay
                                                      .wordCount /
                                                      essayData.wordLimit) *
                                                      100,
                                                  )}
                                                  %
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Main Editor Area */}
                        <div className="col-span-12 lg:col-span-9">
                          {currentEssayData || selectedEssayInfo.title ? (
                            <div className="space-y-5">
                              {/* Essay Header with Panel Toggles */}
                              <div className="flex items-center justify-between flex-wrap gap-3">
                                <div>
                                  <h3 className="text-xl font-bold text-white">
                                    {displayTitle}
                                  </h3>
                                  <p className="text-sm text-white/60">
                                    {displayProgramName}
                                    {selectedEssayInfo.isCustom && (
                                      <span className="ml-2 inline-flex items-center gap-1 text-purple-400">
                                        <Sparkles className="w-3 h-3" /> My
                                        Custom Essay
                                      </span>
                                    )}
                                  </p>
                                </div>

                                {/* Panel Toggle Buttons */}
                                {currentEssay && (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => togglePanel("versions")}
                                      className={`text-xs px-4 py-2 rounded-xl transition-all flex items-center font-medium ${
                                        isPanelOpen("versions")
                                          ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30"
                                          : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/20"
                                      }`}
                                    >
                                      <Layers className="w-4 h-4 mr-2" />
                                      Versions
                                      {currentEssay.versions?.length > 0 && (
                                        <span className="ml-2 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">
                                          {currentEssay.versions.length}
                                        </span>
                                      )}
                                    </button>
                                    <button
                                      onClick={() => togglePanel("analytics")}
                                      className={`text-xs px-4 py-2 rounded-xl transition-all flex items-center font-medium ${
                                        isPanelOpen("analytics")
                                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
                                          : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/20"
                                      }`}
                                    >
                                      <PieChart className="w-4 h-4 mr-2" />
                                      Stats
                                    </button>
                                    <button
                                      onClick={() => togglePanel("ai")}
                                      className={`text-xs px-4 py-2 rounded-xl transition-all flex items-center font-medium ${
                                        isPanelOpen("ai")
                                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30"
                                          : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/20"
                                      }`}
                                    >
                                      <Brain className="w-4 h-4 mr-2" />
                                      AI
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Prompt Display */}
                              <div
                                className={`p-4 rounded-xl border ${
                                  selectedEssayInfo.isCustom
                                    ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/30"
                                    : "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-blue-400/30"
                                }`}
                              >
                                <p
                                  className={`text-xs font-semibold mb-2 uppercase tracking-wider ${
                                    selectedEssayInfo.isCustom
                                      ? "text-purple-300"
                                      : "text-blue-300"
                                  }`}
                                >
                                  Prompt
                                </p>
                                <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
                                  {currentEssayData?.promptText ||
                                    selectedEssayInfo.promptText ||
                                    "Loading..."}
                                </p>
                                <p
                                  className={`text-xs mt-3 flex items-center ${
                                    selectedEssayInfo.isCustom
                                      ? "text-purple-300/70"
                                      : "text-blue-300/70"
                                  }`}
                                >
                                  <FileText className="w-3 h-3 mr-1" />
                                  Word limit:{" "}
                                  {currentEssayData?.wordLimit ||
                                    selectedEssayInfo.wordLimit ||
                                    500}
                                </p>
                              </div>

                              {/* Stacked Panels */}
                              {renderPanels()}

                              {/* Editor or Create Button */}
                              {currentEssay ? (
                                <>
                                  <EssayEditor
                                    key={editorKey}
                                    content={editorContent} // ← Never undefined
                                    onChange={updateEssayContent}
                                    wordLimit={
                                      currentEssayData?.wordLimit ||
                                      selectedEssayInfo.wordLimit ||
                                      500
                                    }
                                    essayId={currentEssay.id}
                                    onSave={autoSaveEssay}
                                    lastSaved={lastSaved}
                                  />

                                  <div className="flex justify-between items-center text-xs text-white/50 pt-2">
                                    <span className="flex items-center">
                                      <Clock className="w-3 h-3 mr-1" />
                                      Last modified:{" "}
                                      {currentEssay.lastModified
                                        ? new Date(
                                            currentEssay.lastModified,
                                          ).toLocaleString()
                                        : "Never"}
                                      <span className="ml-3 text-white/30">
                                        • Auto-saves every 15 seconds
                                      </span>
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => saveVersion()}
                                        disabled={isSaving || isSavingVersion}
                                        className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-400/30"
                                      >
                                        {isSavingVersion ? (
                                          <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                        ) : (
                                          <Save className="w-3 h-3 mr-1.5" />
                                        )}
                                        Save Version & Exit
                                      </Button>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="text-center py-16 bg-gradient-to-b from-white/10 to-white/5 rounded-2xl border border-white/20">
                                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                                    <BookOpen className="w-8 h-8 text-blue-400" />
                                  </div>
                                  <h4 className="text-xl font-bold text-white mb-2">
                                    Start Writing
                                  </h4>
                                  <p className="text-white/60 mb-6">
                                    Create your essay for this prompt
                                  </p>
                                  <Button
                                    onClick={createEssay}
                                    disabled={isCreatingEssay || !userId}
                                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/30 px-8"
                                  >
                                    {isCreatingEssay ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating...
                                      </>
                                    ) : (
                                      <>
                                        <Edit3 className="w-4 h-4 mr-2" />
                                        Start Essay
                                      </>
                                    )}
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-16">
                              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 flex items-center justify-center">
                                <Target className="w-8 h-8 text-white/40" />
                              </div>
                              <h4 className="text-lg font-semibold text-white mb-2">
                                Select an Essay
                              </h4>
                              <p className="text-white/60">
                                Choose a program and essay from the left sidebar
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custom Essay Modal */}
      <CustomEssayModal
        isOpen={showCustomEssayModal}
        onClose={() => setShowCustomEssayModal(false)}
        onCreateEssay={handleCreateCustomEssay}
        universityName={universityName}
        isCreating={isCreatingCustomEssay}
        isUniversityAdded={isUniversityAdded}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, essayId: null, essayTitle: "" })
        }
        onConfirm={() => handleDeleteCustomEssay(deleteModal.essayId)}
        essayTitle={deleteModal.essayTitle}
        isLoading={isDeletingEssay}
      />
    </div>
  );
};

export default ApplicationTabs;