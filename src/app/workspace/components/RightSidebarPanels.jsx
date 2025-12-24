import React from 'react';
import { Card } from "@/components/ui/card";
import { VersionManager } from "./VersionManager";
import { AISuggestions } from "./AiSuggestion";
import { EssayAnalytics } from "./EssayAnalytics";
import { Sparkles } from "lucide-react";
import { calculateStats } from '../utils/calculateStats';

export const RightSidebarPanels = ({
  panelOrder,
  showVersions,
  showAnalytics,
  showAI,
  currentEssay,
  currentProgram,
  activeProgramId,
  activeEssayPromptId,
  loading,
  session,
  setWorkspaceData,
  setError,
  setHasUnsavedChanges,
  setLastSaved,
  setShowVersions,
  handlePanelToggle,
}) => {
  const handleRestoreVersion = async (versionId) => {
    try {
      setError(null);
      const response = await fetch(`/api/essay/independent`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: "restore_version",
          essayId: currentEssay.id,
          versionId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update local state with restored content
        if (result.essay) {
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
                              userEssay: result.essay,
                            }
                          : essayData
                      ),
                    }
                  : program
              ),
            };

            updated.stats = calculateStats(updated);
            return updated;
          });

          setHasUnsavedChanges(false);
          setLastSaved(new Date());
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to restore version");
      }
    } catch (error) {
      console.error("Error restoring version:", error);
      setError("Error restoring version");
    }
  };

  const handleDeleteVersion = async (versionId) => {
    try {
      setError(null);
      const response = await fetch(`/api/essay/independent`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: "delete_version",
          versionId,
          essayId: currentEssay.id,
        }),
      });

      if (response.ok) {
        // Update local state to remove the version
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
                              versions: essayData.userEssay?.versions?.filter(
                                (v) => v.id !== versionId
                              ) || [],
                            },
                          }
                        : essayData
                    ),
                  }
                : program
            ),
          };

          updated.stats = calculateStats(updated);
          return updated;
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete version");
      }
    } catch (error) {
      console.error("Error deleting version:", error);
      setError("Error deleting version");
    }
  };

  return (
    <div className="col-span-12 lg:col-span-3 space-y-6">
      {/* Render panels based on order */}
      {panelOrder.map((panelName) => {
        // Versions Panel
        if (panelName === 'versions' && showVersions && currentEssay) {
          return (
            <VersionManager
              key={`versions-${currentEssay.id}`}
              versions={currentEssay.versions || []}
              currentContent={currentEssay.content}
              onRestoreVersion={handleRestoreVersion}
              onDeleteVersion={handleDeleteVersion}
              essayId={currentEssay.id}
              universityName={currentProgram?.universityName || "University"}
              isLoading={loading}
            />
          );
        }

        // Analytics Panel
        if (panelName === 'analytics' && showAnalytics && currentEssay) {
          return (
            <EssayAnalytics
              key={`analytics-${currentEssay.id}`}
              essay={{
                ...currentEssay,
                wordLimit: currentEssayData.wordLimit,
              }}
              allEssays={
                currentProgram?.essays
                  ?.filter((e) => e.userEssay)
                  .map((e) => ({
                    ...e.userEssay,
                    wordLimit: e.wordLimit,
                  })) || []
              }
              essayId={currentEssay.id}
              userId={session?.userId}
              universityName={currentProgram?.universityName || "University"}
            />
          );
        }

        // AI Panel
        if (panelName === 'ai' && showAI && currentEssay) {
          return (
            <AISuggestions
              key={`ai-${currentEssay.id}`}
              content={currentEssay.content}
              prompt={currentEssayData.promptText}
              wordCount={currentEssay.wordCount}
              wordLimit={currentEssayData.wordLimit}
              essayId={currentEssay.id}
              universityName={currentProgram?.universityName || "University"}
            />
          );
        }

        return null;
      })}

      {/* Empty state for right sidebar */}
      {!currentEssay && (
        <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm p-6 hover:shadow-2xl transition-shadow">
          <div className="text-center">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              AI Analysis & Versions
            </h3>
            <p className="text-xs text-gray-500">
              Select an essay to view analytics, AI suggestions, and
              version history
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};