"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EssayEditor } from "../components/EssayEditor";
import {
  FileText,
  Plus,
  Save,
  Loader2,
  Clock,
} from "lucide-react";

export function EssayWorkspace({
  currentEssayData,
  currentEssay,
  currentProgram,
  updateEssayContent,
  onSaveVersion,
  isSaving,
  isSavingVersion,
  lastSaved,
  hasUnsavedChanges,
  onCreateEssay,
  isCreatingEssay,
}) {
  if (currentEssayData && currentEssay) {
    return (
      <>
        {/* Essay Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div
                className="w-3 h-3 rounded-full shadow-sm"
                style={{
                  backgroundColor:
                    currentProgram?.universityColor || "#002147",
                }}
              />
              <span className="text-xs text-gray-500">
                {currentProgram?.universityName} •{" "}
                {currentProgram?.name}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#002147]">
              {currentEssayData.promptTitle}
            </h2>
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {currentEssayData.promptText}
            </p>
          </div>
        </div>

        {/* Editor */}
        <EssayEditor
          key={`editor-${currentEssay.id}`}
          content={currentEssay.content}
          onChange={updateEssayContent}
          wordLimit={currentEssayData.wordLimit}
          essayId={currentEssay.id}
          lastSaved={lastSaved}
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={isSaving}
          onSave={onSaveVersion}
        />

        {/* Footer Actions */}
        <div className="mt-6 flex justify-between items-center">
          <div className="flex items-center space-x-4 text-xs text-[#6C7280]">
            <span>
              Last modified:{" "}
              {new Date(currentEssay.lastModified).toLocaleString()}
            </span>
            {lastSaved && (
              <span className="text-green-600">
                Saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onSaveVersion(
                `Manual Save ${new Date().toLocaleTimeString()}`
              )
            }
            disabled={isSaving || isSavingVersion}
            className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700 hover:bg-green-100 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm"
          >
            {isSaving || isSavingVersion ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Version
              </>
            )}
          </Button>
        </div>
      </>
    );
  }

  if (currentEssayData && !currentEssay) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-16">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
          style={{
            backgroundColor: `${
              currentProgram?.universityColor || "#002147"
            }20`,
          }}
        >
          <FileText
            className="w-8 h-8"
            style={{
              color: currentProgram?.universityColor || "#002147",
            }}
          />
        </div>
        <h3 className="text-lg font-semibold text-[#002147] mb-2">
          Start This Essay
        </h3>
        <p className="text-sm text-gray-600 text-center max-w-md mb-6">
          {currentEssayData.promptText}
        </p>
        <div className="flex items-center space-x-3 text-xs text-gray-500 mb-6">
          <span>{currentEssayData.wordLimit} words max</span>
          {currentEssayData.isMandatory && (
            <>
              <span>•</span>
              <span className="text-red-600">Required</span>
            </>
          )}
        </div>
        <Button
          onClick={() =>
            onCreateEssay(
              currentProgram.id,
              currentEssayData.promptId
            )
          }
          disabled={isCreatingEssay}
          className="bg-[#3598FE] hover:bg-[#2563EB] shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
        >
          {isCreatingEssay ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Start Writing
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center py-16">
      <FileText className="w-16 h-16 text-gray-300 mb-6" />
      <h3 className="text-lg font-semibold text-[#002147] mb-2">
        Select an Essay
      </h3>
      <p className="text-sm text-gray-600 text-center max-w-md">
        Choose a program and essay from the sidebar to start editing
      </p>
    </div>
  );
}