import { calculateStats } from './calculateStats';

export const updateEssayContent = (content, wordCount, currentEssay, activeProgramId, activeEssayPromptId, setWorkspaceData, setHasUnsavedChanges) => {
  if (!currentEssay) return;

  setWorkspaceData((prev) => {
    if (!prev) return prev;

    const updated = {
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
                        content,
                        wordCount,
                        lastModified: new Date(),
                      },
                    }
                  : essayData
              ),
            }
          : program
      ),
    };

    // Recalculate stats immediately
    updated.stats = calculateStats(updated);
    
    return updated;
  });

  setHasUnsavedChanges(true);
};

export const saveVersion = async (
  currentEssay,
  isSaving,
  isSavingVersion,
  hasUnsavedChanges,
  autoSaveEssay,
  setWorkspaceData,
  setError,
  activeProgramId,
  activeEssayPromptId,
  setIsSavingVersion,
  label
) => {
  if (!currentEssay || isSaving || isSavingVersion) return false;

  try {
    setIsSavingVersion(true);

    if (hasUnsavedChanges) {
      const autoSaved = await autoSaveEssay();
      if (!autoSaved) {
        setError("Failed to save current changes");
        return false;
      }
    }

    const response = await fetch(`/api/essay/independent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        action: "save_version",
        essayId: currentEssay.id,
        content: currentEssay.content,
        wordCount: currentEssay.wordCount,
        label: label || `Version ${new Date().toLocaleString()}`,
      }),
    });

    if (response.ok) {
      const result = await response.json();

      if (result.version) {
        setWorkspaceData((prev) => {
          if (!prev) return prev;

          const updated = {
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
                              versions: [
                                result.version,
                                ...(essayData.userEssay?.versions || []),
                              ],
                              lastModified: new Date(),
                            },
                          }
                        : essayData
                    ),
                  }
                : program
            ),
          };

          // Recalculate stats
          updated.stats = calculateStats(updated);
          
          return updated;
        });
      }

      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      setError(errorData.error || "Failed to save version");
      return false;
    }
  } catch (error) {
    console.error("Error saving version:", error);
    setError("Error saving version");
    return false;
  } finally {
    setIsSavingVersion(false);
  }
};

export const handleCreateEssay = async (
  programId,
  promptId,
  setIsCreatingEssay,
  setError,
  setWorkspaceData,
  handleEssaySelect,
  setHasUnsavedChanges,
  setLastSaved
) => {
  try {
    setIsCreatingEssay(true);
    setError(null);

    const response = await fetch(`/api/essay/independent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        action: "create_essay",
        programId,
        promptId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create essay");
    }

    const result = await response.json();

    if (result.essay) {
      setWorkspaceData((prev) => {
        if (!prev) return prev;

        const updated = {
          ...prev,
          programs: prev.programs.map((program) =>
            program.id === programId
              ? {
                  ...program,
                  essays: program.essays.map((essayData) =>
                    essayData.promptId === promptId
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

        // Recalculate stats
        updated.stats = calculateStats(updated);
        
        return updated;
      });

      setHasUnsavedChanges(false);
      setLastSaved(new Date());

      handleEssaySelect(programId, promptId);
    }
  } catch (error) {
    console.error("Error creating essay:", error);
    setError(error.message);
  } finally {
    setIsCreatingEssay(false);
  }
};

export const handleDeleteEssay = async (
  essayId,
  setWorkspaceData,
  setError,
  activeEssayPromptId,
  setActiveEssayPromptId
) => {
  if (!confirm("Are you sure you want to delete this essay?")) return;

  try {
    const response = await fetch(`/api/essay/independent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        action: "delete_essay",
        essayId,
      }),
    });

    if (!response.ok) throw new Error("Failed to delete essay");

    // Update local state instead of full refresh
    setWorkspaceData((prev) => {
      if (!prev) return prev;

      const updated = {
        ...prev,
        programs: prev.programs.map((program) => ({
          ...program,
          essays: program.essays.map((essayData) =>
            essayData.userEssay?.id === essayId
              ? {
                  ...essayData,
                  userEssay: null, // Remove the user essay
                }
              : essayData
          ),
        })),
      };

      // Recalculate stats
      updated.stats = calculateStats(updated);
      
      return updated;
    });

    if (activeEssayPromptId === essayId) {
      setActiveEssayPromptId(null);
    }
  } catch (error) {
    setError(error.message);
  }
};

export const toggleEssayCompletion = async (
  essayId,
  currentStatus,
  setWorkspaceData,
  setError
) => {
  try {
    // Optimistically update UI
    setWorkspaceData((prev) => {
      if (!prev) return prev;

      const updated = {
        ...prev,
        programs: prev.programs.map((program) => ({
          ...program,
          essays: program.essays.map((essayData) =>
            essayData.userEssay?.id === essayId
              ? {
                  ...essayData,
                  userEssay: {
                    ...essayData.userEssay,
                    isCompleted: !currentStatus,
                  },
                }
              : essayData
          ),
        })),
      };

      // Recalculate stats immediately
      updated.stats = calculateStats(updated);
      
      return updated;
    });

    // Make API call
    const response = await fetch(`/api/essay/independent`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        essayId,
        isCompleted: !currentStatus,
      }),
    });

    if (!response.ok) {
      // Revert on error
      setWorkspaceData((prev) => {
        if (!prev) return prev;

        const updated = {
          ...prev,
          programs: prev.programs.map((program) => ({
            ...program,
            essays: program.essays.map((essayData) =>
              essayData.userEssay?.id === essayId
                ? {
                    ...essayData,
                    userEssay: {
                      ...essayData.userEssay,
                      isCompleted: currentStatus,
                    },
                  }
                : essayData
            ),
          })),
        };

        updated.stats = calculateStats(updated);
        return updated;
      });

      throw new Error("Failed to update completion status");
    }
  } catch (error) {
    console.error("Error toggling completion:", error);
    setError(error.message);
  }
};