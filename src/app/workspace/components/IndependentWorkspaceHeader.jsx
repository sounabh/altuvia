import React from 'react';
import { Button } from "@/components/ui/button";
import { UniversitySelector } from "./UniversitySelector";
import { BookOpen, Target, Sparkles, TrendingUp, Loader2, Building2 } from "lucide-react";

export const IndependentWorkspaceHeader = ({
  currentUniversity,
  selectedUniversityId,
  workspaceData,
  enhancedStats,
  currentEssay,
  currentEssayData,
  isSaving,
  hasUnsavedChanges,
  showAnalytics,
  showAI,
  onUniversitySelect,
  onPanelToggle,
  onToggleAnalytics,
  onToggleAI,
}) => {
  return (
    <header
      className="backdrop-blur-lg border-b sticky top-0 z-50 shadow-sm transition-all duration-300"
      style={{
        backgroundColor: currentUniversity
          ? `${currentUniversity.color}15`
          : "rgba(255, 255, 255, 0.8)",
        borderColor: currentUniversity?.color || "#e5e7eb",
      }}
    >
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105"
              style={{
                background: currentUniversity
                  ? `linear-gradient(135deg, ${currentUniversity.color}, ${currentUniversity.color}CC)`
                  : "linear-gradient(135deg, #002147, #003366)",
              }}
            >
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#002147]">
                {currentUniversity?.name || "Essay Workspace"}
              </h1>
              <p className="text-sm text-[#6C7280]">
                {selectedUniversityId === "all"
                  ? `${
                      workspaceData?.universities?.length || 0
                    } universities • ${
                      workspaceData?.stats?.totalPrograms || 0
                    } programs`
                  : `${currentProgram?.name || "Select a program"}`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* University Selector */}
            <UniversitySelector
              universities={workspaceData?.universities}
              selectedUniversityId={selectedUniversityId}
              onSelect={onUniversitySelect}
              stats={enhancedStats}
            />

            {/* Word Count Display */}
            {currentEssay && (
              <div className="flex items-center space-x-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <Target className="w-5 h-5 text-[#6C7280]" />
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-[#002147]">
                    {currentEssay.wordCount}/{currentEssayData.wordLimit}
                  </span>
                  <div className="flex items-center space-x-1">
                    {isSaving ? (
                      <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                    ) : hasUnsavedChanges ? (
                      <div
                        className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-sm"
                        title="Unsaved changes"
                      />
                    ) : (
                      <div
                        className="w-2 h-2 bg-green-500 rounded-full shadow-sm"
                        title="Saved"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Toggle Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant={showAnalytics ? "default" : "outline"}
                size="sm"
                onClick={onToggleAnalytics}
                className={`
                  transition-all duration-200 font-medium shadow-sm
                  ${showAnalytics
                    ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-purple-200 hover:shadow-lg hover:scale-105 active:scale-95"
                    : "bg-white border-2 border-purple-500 text-purple-600 hover:bg-purple-50 hover:border-purple-600 hover:shadow-md active:scale-95"
                  }
                `}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Analytics
              </Button>

              <Button
                variant={showAI ? "default" : "outline"}
                size="sm"
                onClick={onToggleAI}
                className={`
                  transition-all duration-200 font-medium shadow-sm
                  ${showAI
                    ? "bg-gradient-to-r from-[#3598FE] to-[#2563EB] text-white border-0 shadow-blue-200 hover:shadow-lg hover:scale-105 active:scale-95"
                    : "bg-white border-2 border-[#3598FE] text-[#3598FE] hover:bg-blue-50 hover:border-[#2563EB] hover:shadow-md active:scale-95"
                  }
                `}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Assistant
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};