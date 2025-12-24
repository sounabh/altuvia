"use client";

import React from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Trash2,
} from "lucide-react";

export function ProgramCard({
  program,
  isExpanded,
  onToggle,
  activeEssayPromptId,
  onEssaySelect,
  onDeleteEssay,
  onToggleCompletion,
}) {
  const completedEssays =
    program.essays?.filter((e) => e.userEssay?.isCompleted).length || 0;
  const totalEssays = program.essays?.length || 0;
  const progress = totalEssays > 0 ? (completedEssays / totalEssays) * 100 : 0;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow">
      {/* Program Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors active:bg-gray-100"
      >
        <div className="flex items-center space-x-3">
          <div
            className="w-2 h-10 rounded-full shadow-sm"
            style={{ backgroundColor: program.universityColor || "#002147" }}
          />
          <div className="text-left">
            <p className="text-sm font-semibold text-[#002147] line-clamp-1">
              {program.name}
            </p>
            <p className="text-xs text-gray-500">{program.universityName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {completedEssays}/{totalEssays}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Progress Bar */}
      <div className="px-3 pb-2">
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-green-500 shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Essays List */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-2 space-y-1">
          {program.essays?.map((essayData) => (
            <div
              key={essayData.promptId}
              className={`w-full p-2 rounded-lg text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group ${
                activeEssayPromptId === essayData.promptId
                  ? "bg-blue-100 border border-blue-300 shadow-sm"
                  : "bg-white hover:bg-gray-100 border border-transparent hover:border-gray-200"
              }`}
              onClick={() => onEssaySelect(program.id, essayData.promptId)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onEssaySelect(program.id, essayData.promptId);
                }
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2 flex-1">
                  {essayData.userEssay?.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : essayData.userEssay ? (
                    <Circle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#002147] line-clamp-2">
                      {essayData.promptTitle}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {essayData.userEssay?.wordCount || 0}/
                        {essayData.wordLimit}
                      </span>
                      {essayData.isMandatory && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded shadow-sm">
                          Required
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {essayData.userEssay && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCompletion(
                          essayData.userEssay.id,
                          essayData.userEssay.isCompleted
                        );
                      }}
                      className={`p-1 rounded transition-colors ${
                        essayData.userEssay.isCompleted
                          ? "text-green-600 hover:bg-green-50"
                          : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                      }`}
                      title={
                        essayData.userEssay.isCompleted
                          ? "Mark as incomplete"
                          : "Mark as complete"
                      }
                    >
                      {essayData.userEssay.isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Circle className="w-3.5 h-3.5" />
                      )}
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEssay(essayData.userEssay.id);
                      }}
                      className="text-gray-400 hover:text-red-500 p-1 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Delete essay"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {(!program.essays || program.essays.length === 0) && (
            <p className="text-xs text-gray-500 text-center py-2">
              No essay prompts available
            </p>
          )}
        </div>
      )}
    </div>
  );
}