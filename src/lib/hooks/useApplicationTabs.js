// ============================================================
// useApplicationTabs.js
// Custom hook containing all state management, API calls,
// and business logic for the ApplicationTabs component
// ============================================================

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

// ============================================================
// Import helpers and constants
// ============================================================
import {
  calculateProgressData,
  validateUserAndUniversity,
} from "../constants/ApplicationTab/Helpers";
import { API_ROUTES } from "../constants/ApplicationTab/Constant";

// ============================================================
// MAIN HOOK
// ============================================================
export const useApplicationTabs = (university) => {
  const router = useRouter();
  const params = useParams();
  const { data: session, status: sessionStatus } = useSession();

  // ============================================================
  // USER ID EXTRACTION
  // Attempts to extract user ID from various session structures
  // ============================================================
  const getUserId = () => {
    if (!session) return null;
    return (
      session.userId ||
      session.user?.id ||
      session.user?.userId ||
      session.user?.sub ||
      session.id ||
      null
    );
  };

  const userId = getUserId();
  const userEmail = session?.user?.email || session?.email || null;

  // ============================================================
  // UNIVERSITY NAME EXTRACTION
  // Get university name from props or URL params
  // ============================================================
  const universityNameFromUrl = params?.university
    ? decodeURIComponent(params.university).replace(/-/g, " ")
    : null;

  const universityName = university?.name || universityNameFromUrl || "";

  // ============================================================
  // SESSION VALIDATION AND DEBUGGING
  // Log session info for debugging purposes
  // ============================================================
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

  // ============================================================
  // UNIVERSITY ADDED STATE
  // Determines if user has added this university to their dashboard
  // ============================================================
  const isUniversityAdded = university?.isAdded || false;
  const [isAddingUniversity, setIsAddingUniversity] = useState(false);

  // ============================================================
  // CUSTOM ESSAY MODAL STATE
  // Controls visibility and loading state of custom essay modal
  // ============================================================
  const [showCustomEssayModal, setShowCustomEssayModal] = useState(false);
  const [isCreatingCustomEssay, setIsCreatingCustomEssay] = useState(false);

  // ============================================================
  // MAIN STATE MANAGEMENT
  // Core state for workspace, essays, and UI
  // ============================================================
  const [activeView, setActiveView] = useState("list");
  const [workspaceData, setWorkspaceData] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(() => university?.isAdded || false);
  const [workspaceError, setWorkspaceError] = useState(null);
  const [activeProgramId, setActiveProgramId] = useState(null);
  const [activeEssayPromptId, setActiveEssayPromptId] = useState(null);
  const [openPanels, setOpenPanels] = useState([]);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isCreatingEssay, setIsCreatingEssay] = useState(false);
  const [isSavingVersion, setIsSavingVersion] = useState(false);

  // ============================================================
  // SELECTED ESSAY INFO STATE
  // Tracks currently selected essay's metadata
  // ============================================================
  const [selectedEssayInfo, setSelectedEssayInfo] = useState({
    title: "",
    programName: "",
    isCustom: false,
    promptText: "",
    wordLimit: 500,
  });

  // ============================================================
  // DELETE MODAL STATE
  // Controls delete confirmation dialog
  // ============================================================
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    essayId: null,
    essayTitle: "",
  });
  const [isDeletingEssay, setIsDeletingEssay] = useState(false);

  // ============================================================
  // REFS FOR TIMERS AND TRACKING
  // Used for auto-save, debouncing, and state tracking
  // ============================================================
  const autoSaveTimerRef = useRef(null);
  const lastContentRef = useRef("");
  const isUpdatingRef = useRef(false);
  const lastTypingTimeRef = useRef(Date.now());
  const pendingContentRef = useRef(null);
  const updateDebounceRef = useRef(null);
  const isEditorActiveRef = useRef(false);
  const saveVersionRef = useRef(null);
  const isFetchingRef = useRef(false);

  // ============================================================
  // PANEL MANAGEMENT FUNCTIONS
  // Toggle, close, and check panel visibility
  // ============================================================
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
    [openPanels]
  );

  // ============================================================
  // DERIVED DATA - MEMOIZED COMPUTATIONS
  // Computed values based on workspace and university data
  // ============================================================
  
  // Tasks and events from university
  const tasksAndEvents = useMemo(
    () => university?.tasksAndEvents || [],
    [university?.tasksAndEvents]
  );

  // Programs that have essays (excluding standalone/custom)
  const programsWithEssays = useMemo(() => {
    if (!workspaceData?.programs) return [];
    return workspaceData.programs.filter(
      (program) =>
        program.essays &&
        program.essays.length > 0 &&
        program.degreeType !== "STANDALONE" &&
        !program.isCustom
    );
  }, [workspaceData]);

  // Custom essays from standalone programs
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
            .filter(Boolean) || []
      );
  }, [workspaceData]);

  // Currently selected program
  const currentProgram = useMemo(() => {
    if (!activeProgramId) return null;
    return workspaceData?.programs?.find((p) => p.id === activeProgramId);
  }, [workspaceData, activeProgramId]);

  // Currently selected essay data
  const currentEssayData = useMemo(() => {
    if (!currentProgram || !activeEssayPromptId) return null;

    return currentProgram.essays?.find(
      (e) => e.promptId === activeEssayPromptId
    );
  }, [currentProgram, activeEssayPromptId]);

  // Currently selected user essay
  const currentEssay = useMemo(() => {
    return currentEssayData?.userEssay;
  }, [currentEssayData]);

  // Progress calculation
  const progressData = useMemo(() => {
    return calculateProgressData(university, customEssays);
  }, [university, customEssays]);

  // Unique custom essays (deduplicated)
  const uniqueCustomEssays = useMemo(() => {
    return Array.from(
      new Map(customEssays.map((essay) => [essay.id, essay])).values()
    );
  }, [customEssays]);

  // Display title for current essay
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

  // Display program name
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

  // ============================================================
  // API FUNCTIONS
  // Functions for fetching and manipulating data
  // ============================================================

  // Fetch workspace data from API
  const fetchWorkspaceData = useCallback(async () => {
    // Prerequisites not ready — skip but DON'T block future calls
    if (!universityName || !userId || !isUniversityAdded) return;

    // Already fetching — block duplicate, but this is always cleaned up in finally
    if (isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      setWorkspaceLoading(true);
      setWorkspaceError(null);

      const response = await fetch(
        `${API_ROUTES.essayIndependent}?universityId=${encodeURIComponent(university?.id)}&userId=${encodeURIComponent(userId)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-cache",
        }
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
                (e) => e.promptId === activeEssayPromptId
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

  // Force immediate refetch helper function
  const forceRefresh = useCallback(async () => {
    isFetchingRef.current = false;
    // Small delay to let React flush any pending state before refetching
    await new Promise(resolve => setTimeout(resolve, 50));
    await fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  // ============================================================
  // UNIVERSITY HANDLERS
  // Add/remove university from dashboard
  // ============================================================
  const handleAddUniversity = async () => {
    const validation = validateUserAndUniversity(userId, isUniversityAdded, "addUniversity");
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

      const response = await fetch(API_ROUTES.userToggleAdd, {
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
            `${university.name || "University"} has been added to your dashboard!`
          );
          window.location.reload();
        } else {
          toast.success(
            `${university.name || "University"} has been removed from your dashboard.`
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

  // ============================================================
  // CUSTOM ESSAY HANDLERS
  // Create and delete custom essays
  // ============================================================
  const handleCreateCustomEssay = async (formData) => {
    const validation = validateUserAndUniversity(userId, isUniversityAdded, "createCustomEssay");
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

      const response = await fetch(`${API_ROUTES.essayIndependent}`, {
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
          
          // Force immediate refresh from API
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

  const handleDeleteCustomEssay = async (essayId) => {
    if (!essayId) return;

    const validation = validateUserAndUniversity(userId, isUniversityAdded, "deleteEssay");
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    try {
      setIsDeletingEssay(true);

      const response = await fetch(`${API_ROUTES.essayIndependent}`, {
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
                        (e) => e.userEssay?.id !== essayId
                      ),
                    }
                  : program
              )
              .filter(
                (p) =>
                  (p.degreeType !== "STANDALONE" && !p.isCustom) ||
                  (p.essays && p.essays.length > 0)
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

  // Open delete confirmation modal
  const openDeleteConfirmation = (essayId, essayTitle) => {
    setDeleteModal({
      isOpen: true,
      essayId,
      essayTitle,
    });
  };

  // ============================================================
  // ESSAY SAVE FUNCTIONS
  // Auto-save and manual save functionality
  // ============================================================

  // ─── FIX 1 ───────────────────────────────────────────────────
  // ROOT CAUSE: two things blocked this from ever running:
  //   (a) `isUpdatingRef.current` was checked here, but saveVersion and
  //       updateEssayContent both set it true — so any call triggered by
  //       the auto-save timer while a debounce was in-flight would bail.
  //   (b) content was read from `currentEssay.content` first, and only
  //       fell back to pendingContentRef.  Because currentEssay is a
  //       useMemo over workspaceData, it doesn't update until AFTER a
  //       successful save round-trips — meaning the very first save of
  //       new content always sent stale (or empty) data.
  // FIX: read pendingContentRef FIRST (it is the real source of truth
  //      while the user is typing), drop the isUpdatingRef guard entirely
  //      (nothing else should be mutating the essay at the same time as
  //      auto-save; saveVersion now serialises properly — see FIX 2).
  // ─────────────────────────────────────────────────────────────
  const autoSaveEssay = useCallback(async () => {
    // Read pending content FIRST — this is the source of truth during typing
    const contentToSave = pendingContentRef.current?.content ?? currentEssay?.content;
    const wordCountToSave = pendingContentRef.current?.wordCount ?? currentEssay?.wordCount ?? 0;

    // Guard: need an essay ID to save against, not currently saving, and user is authed
    if (
      !currentEssay?.id ||
      isSaving ||
      !userId ||
      !isUniversityAdded
    ) {
      return false;
    }

    // Don't save empty content
    if (!contentToSave || wordCountToSave === 0) {
      return false;
    }

    try {
      setIsSaving(true);
      isUpdatingRef.current = true;

      const apiRoute = API_ROUTES.essayIndependent;

      const response = await fetch(apiRoute, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essayId: currentEssay.id,
          content: contentToSave,
          wordCount: wordCountToSave,
          isAutoSave: true,
          userId,
          userEmail,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update workspace data with server response
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
                            userEssay: result.essay,
                          }
                        : essayData
                    ),
                  }
                : program
            ),
          };
        });

        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        pendingContentRef.current = null;
        lastContentRef.current = contentToSave;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Auto-save error:", error);
      toast.error("Failed to save changes");
      return false;
    } finally {
      setIsSaving(false);
      isUpdatingRef.current = false;
    }
  }, [
    currentEssay,
    isSaving,
    userId,
    userEmail,
    isUniversityAdded,
    activeProgramId,
    activeEssayPromptId,
  ]);

  // ============================================================
  // CREATE ESSAY FUNCTION
  // Create new essay for selected prompt
  // ============================================================
  const createEssay = useCallback(async () => {
    const validation = validateUserAndUniversity(userId, isUniversityAdded, "createEssay");
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

      console.log("Creating essay with:", {
        userId,
        userEmail,
        activeProgramId,
        activeEssayPromptId,
        isUniversityAdded,
      });

      const apiRoute = API_ROUTES.essayIndependent;

      const response = await fetch(apiRoute, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_essay",
          programId: activeProgramId,
          essayPromptId: activeEssayPromptId,
          userId,
          userEmail,
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
                        : essayData
                    ),
                  }
                : program
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
    isCreatingEssay,
    userId,
    userEmail,
    isUniversityAdded,
  ]);

  // ============================================================
  // UPDATE ESSAY CONTENT FUNCTION
  // Debounced content update handler
  // ============================================================
  const updateEssayContent = useCallback(
    (content, wordCount) => {
      if (!isUniversityAdded) return;

      // Always update pending content ref
      pendingContentRef.current = { content, wordCount };
      isEditorActiveRef.current = true;
      lastTypingTimeRef.current = Date.now();

      if (updateDebounceRef.current) {
        clearTimeout(updateDebounceRef.current);
      }

      // Debounce the actual state update
      updateDebounceRef.current = setTimeout(() => {
        if (!pendingContentRef.current) return;

        const { content: newContent, wordCount: newWordCount } =
          pendingContentRef.current;

        // Create essay if it doesn't exist
        if (
          !currentEssay &&
          currentProgram?.degreeType !== "STANDALONE" &&
          !currentProgram?.isCustom
        ) {
          createEssay();
          return;
        }

        try {
          isUpdatingRef.current = true;

          // Update workspace data correctly
          setWorkspaceData((prev) => {
            if (!prev) return prev;

            const programIndex = prev.programs.findIndex(
              (p) => p.id === activeProgramId
            );
            if (programIndex === -1) return prev;

            const program = prev.programs[programIndex];
            if (!program.essays) return prev;

            const essayIndex = program.essays.findIndex(
              (e) => e.promptId === activeEssayPromptId
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
          lastContentRef.current = newContent;
        } catch (error) {
          console.error("Error updating content:", error);
        } finally {
          setTimeout(() => {
            isEditorActiveRef.current = false;
            isUpdatingRef.current = false;
          }, 100);
        }
      }, 600);
    },
    [
      currentEssay,
      activeProgramId,
      activeEssayPromptId,
      createEssay,
      isUniversityAdded,
      currentProgram,
    ]
  );

  // ============================================================
  // SAVE VERSION FUNCTION
  // Save current essay as a named version
  // ============================================================

  // ─── FIX 2 ───────────────────────────────────────────────────
  // ROOT CAUSE: `isUpdatingRef.current = true` was set at the TOP of the
  //   try block, BEFORE `autoSaveEssay()` was called.  autoSaveEssay
  //   (pre-FIX-1) checked `isUpdatingRef.current` and returned `false`
  //   immediately — so the "save pending changes first" step silently
  //   failed, and the user saw "Failed to save current changes" with
  //   zero explanation.
  // FIX:
  //   1. Move `isUpdatingRef = true` to AFTER autoSaveEssay completes.
  //   2. Show a friendly "Saving current changes…" toast before the
  //      auto-save attempt so the user knows what is happening.
  //   3. On failure show an actionable message ("try Ctrl+S first").
  //   4. Re-read content after the flush so the version payload always
  //      contains the latest text.
  // ─────────────────────────────────────────────────────────────
  const saveVersion = useCallback(
    async (label) => {
      if (
        !currentEssay ||
        isSaving ||
        isSavingVersion ||
        !userId ||
        !isUniversityAdded
      ) {
        console.warn("Cannot save version:", {
          hasEssay: !!currentEssay,
          isSaving,
          isSavingVersion,
          userId
        });
        // ── UX: tell the user exactly why nothing happened ──
        if (!currentEssay) {
          toast.warning("No essay content to save. Start writing first.");
        } else if (isSaving || isSavingVersion) {
          toast.info("A save is already in progress. Please wait a moment and try again.");
        }
        return false;
      }

      // Capture current content state before anything else
      let contentToSave = pendingContentRef.current?.content ?? currentEssay.content;
      let wordCountToSave = pendingContentRef.current?.wordCount ?? currentEssay.wordCount;

      try {
        setIsSavingVersion(true);
        // NOTE: do NOT set isUpdatingRef here — autoSaveEssay checks it and would bail

        // --- Flush pending content to server FIRST if anything is pending ---
        if (hasUnsavedChanges || pendingContentRef.current) {
          toast.info("Saving current changes before creating version…");
          const autoSaved = await autoSaveEssay();
          if (!autoSaved) {
            toast.error("Could not save your current edits. Please try Ctrl+S first, then save the version again.");
            return false;
          }
          // Give React one tick to flush the workspace state update from autoSave
          await new Promise(resolve => setTimeout(resolve, 150));
        }

        // Re-read content AFTER the auto-save flush (state may have updated)
        const latestContent = pendingContentRef.current?.content ?? currentEssay?.content ?? contentToSave;
        const latestWordCount = pendingContentRef.current?.wordCount ?? currentEssay?.wordCount ?? wordCountToSave;

        isUpdatingRef.current = true; // lock AFTER autoSave is done

        const apiRoute = API_ROUTES.essayIndependent;

        console.log('💾 Saving version to:', apiRoute, {
          essayId: currentEssay.id,
          label: label || `Version ${new Date().toLocaleString()}`
        });

        const response = await fetch(apiRoute, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save_version",
            essayId: currentEssay.id,
            content: latestContent,
            wordCount: latestWordCount,
            label: label || `Version ${new Date().toLocaleString()}`,
            userId,
            userEmail,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success || !result.essay) {
          throw new Error('Invalid response from server');
        }

        console.log('✅ Version saved successfully:', result);

        // Update workspace data with complete essay data
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
                            userEssay: result.essay,
                          }
                        : essayData
                    ),
                  }
                : program
            ),
          };
        });

        // Clear all pending states
        pendingContentRef.current = null;
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        lastContentRef.current = latestContent;

        toast.success("Version saved successfully");
        
        // Navigate back after successful save
        setTimeout(() => {
          setActiveView("list");
          setOpenPanels([]);
        }, 300);

        return true;
      } catch (error) {
        console.error("❌ Error saving version:", error);
        toast.error(error.message || "Failed to save version");
        return false;
      } finally {
        setIsSavingVersion(false);
        isUpdatingRef.current = false;
      }
    },
    [
      currentEssay,
      isSaving,
      isSavingVersion,
      hasUnsavedChanges,
      autoSaveEssay,
      activeProgramId,
      activeEssayPromptId,
      userId,
      userEmail,
      isUniversityAdded,
    ]
  );

  // ============================================================
  // VERSION MANAGEMENT HANDLERS
  // Restore and delete essay versions
  // ============================================================
  const handleRestoreVersion = async (versionId) => {
    if (!currentEssay || !userId || !isUniversityAdded) return;

    const apiRoute = API_ROUTES.essayIndependent;

    try {
      const response = await fetch(apiRoute, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "restore_version",
          essayId: currentEssay.id,
          versionId,
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
                          : essayData
                      ),
                    }
                  : program
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

    const apiRoute = API_ROUTES.essayIndependent;

    try {
      const response = await fetch(apiRoute, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_version",
          versionId,
          essayId: currentEssay.id,
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
                        : essayData
                    ),
                  }
                : program
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

  // ============================================================
  // SELECTION HANDLERS
  // Handle program and essay selection changes
  // ============================================================
  const handleProgramSelect = useCallback(
    (programId) => {
      if (programId === activeProgramId || !isUniversityAdded) return;

      // Clear any pending updates
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
    [activeProgramId, workspaceData, isUniversityAdded]
  );

  const handleEssayPromptSelect = useCallback(
    (promptId, essayInfo = null) => {
      if (promptId === activeEssayPromptId || !isUniversityAdded) return;

      // Clear any pending updates
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
        (e) => e.promptId === promptId
      );
      lastContentRef.current = essayData?.userEssay?.content || "";
    },
    [activeEssayPromptId, currentProgram, activeProgramId, isUniversityAdded]
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
              e.promptId === essay.id
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
          (p) => p.degreeType === "STANDALONE" || p.isCustom
        );
        if (standaloneProgram) {
          setActiveProgramId(standaloneProgram.id);
          const customEssay = standaloneProgram.essays?.find(
            (e) => e.userEssay?.id === essay.id
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
    [workspaceData, isUniversityAdded]
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

  // ============================================================
  // MEMOIZED EDITOR PROPS
  // Optimized props for the essay editor component
  // ============================================================
  const editorKey = useMemo(() => {
    return `editor-${currentEssay?.id || "new"}-${activeProgramId}-${activeEssayPromptId}`;
  }, [currentEssay?.id, activeProgramId, activeEssayPromptId]);

  const editorContent = useMemo(() => {
    if (isEditorActiveRef.current) {
      return currentEssay?.content || "";
    }
    return currentEssay?.content || "";
  }, [currentEssay?.id, currentEssay?.content]);

  // ============================================================
  // KEYBOARD SHORTCUT FOR MANUAL SAVE
  // Ctrl+S / Cmd+S to save
  // ============================================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();

        if (currentEssay && !isSaving && !isSavingVersion && isUniversityAdded) {
          // First auto-save any pending changes
          if (hasUnsavedChanges || pendingContentRef.current) {
            autoSaveEssay().then(() => {
              toast.success('Changes saved successfully!');
            });
          } else {
            toast.info('No changes to save');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentEssay, isSaving, isSavingVersion, hasUnsavedChanges, autoSaveEssay, isUniversityAdded]);

  // ============================================================
  // AUTO-SAVE TIMER EFFECT
  // ============================================================

  // ─── FIX 3 ───────────────────────────────────────────────────
  // ROOT CAUSE: the previous effect used a single `setTimeout(…, 20000)`.
  //   Every time ANY dependency in the array changed (hasUnsavedChanges,
  //   currentEssay?.id, isSaving…) the cleanup ran, cleared the timer,
  //   and the effect re-ran — restarting the 20 s clock from zero.
  //   Because `hasUnsavedChanges` flips true on every keystroke batch
  //   (via updateEssayContent's 600 ms debounce), the 20 s timer was
  //   effectively reset every ~600 ms and NEVER fired.
  //   Additionally, the nested 15 s idle check added a second condition
  //   that could fail near boundaries.
  // FIX: replace the one-shot setTimeout with a `setInterval` that
  //   ticks every 5 s.  Each tick reads `lastTypingTimeRef` directly
  //   (no stale closure) and only fires autoSaveEssay when idle ≥ 15 s.
  //   The interval is started/stopped only when the coarse conditions
  //   change (view, essay id, university-added) — NOT on every keystroke.
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    // Clear any leftover one-shot timer from previous renders
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    // Only arm the polling loop while we are in the editor and are authed
    if (
      activeView !== "editor" ||
      !currentEssay?.id ||
      !isUniversityAdded
    ) {
      return;
    }

    // Poll every 5 seconds.  Each tick checks whether the user has been
    // idle ≥ 15 s AND there is actually pending work before firing.
    // This avoids the single-shot timer that gets cleared/re-created on
    // every state change and never actually fires.
    const intervalId = setInterval(() => {
      const idleMs = Date.now() - lastTypingTimeRef.current;

      // Only fire when: idle ≥ 15 s, not already mid-save, and there is
      // pending content or the flag says unsaved.
      if (idleMs >= 15000 && !isSaving && (pendingContentRef.current || hasUnsavedChanges)) {
        console.log('⏰ Auto-saving after inactivity…');
        autoSaveEssay();
      }
    }, 5000); // tick every 5 s

    return () => clearInterval(intervalId);
  }, [
    hasUnsavedChanges,
    currentEssay?.id,
    isSaving,
    activeView,
    autoSaveEssay,
    isUniversityAdded,
  ]);

  // ============================================================
  // DATA FETCHING EFFECTS
  // Fetch workspace data on mount and when dependencies change
  // ============================================================

  // Re-trigger fetch once session becomes available (fixes refresh race)
  useEffect(() => {
    if (userId && universityName && isUniversityAdded && !workspaceData && !isFetchingRef.current) {
      fetchWorkspaceData();
    }
  }, [userId, universityName, isUniversityAdded, workspaceData, fetchWorkspaceData]);

  useEffect(() => {
    if (activeView === "editor" && !workspaceData && universityName && userId && isUniversityAdded) {
      fetchWorkspaceData();
    }
  }, [activeView, workspaceData, universityName, userId, fetchWorkspaceData, isUniversityAdded]);

  // ============================================================
  // CLEANUP EFFECT
  // Clear all timers on unmount
  // ============================================================
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

  // ============================================================
  // RETURN ALL STATE AND HANDLERS
  // ============================================================
  return {
    // Session and user data
    sessionStatus,
    userId,
    userEmail,
    universityName,
    
    // University state
    isUniversityAdded,
    isAddingUniversity,
    
    // Modal states
    showCustomEssayModal,
    setShowCustomEssayModal,
    isCreatingCustomEssay,
    deleteModal,
    setDeleteModal,
    isDeletingEssay,
    
    // View state
    activeView,
    setActiveView,
    
    // Workspace data
    workspaceData,
    workspaceLoading,
    workspaceError,
    
    // Selection state
    activeProgramId,
    activeEssayPromptId,
    selectedEssayInfo,
    
    // Panel state
    openPanels,
    togglePanel,
    closePanel,
    isPanelOpen,
    
    // Save state
    lastSaved,
    isSaving,
    hasUnsavedChanges,
    isCreatingEssay,
    isSavingVersion,
    
    // Derived data
    tasksAndEvents,
    programsWithEssays,
    customEssays,
    uniqueCustomEssays,
    currentProgram,
    currentEssayData,
    currentEssay,
    progressData,
    displayTitle,
    displayProgramName,
    
    // Editor props
    editorKey,
    editorContent,
    
    // Handlers
    handleAddUniversity,
    handleCreateCustomEssay,
    handleDeleteCustomEssay,
    openDeleteConfirmation,
    handleProgramSelect,
    handleEssayPromptSelect,
    handleOpenEditor,
    handleBackToList,
    handleRestoreVersion,
    handleDeleteVersion,
    createEssay,
    updateEssayContent,
    autoSaveEssay,
    saveVersion,
    fetchWorkspaceData,
  };
};