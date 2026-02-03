import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Edit3, Lock } from "lucide-react";
import { getEssayProgress, getEssayStatus } from "@/lib/constants/ApplicationTab/Helpers";

const EssayCard = React.memo(({ essay, index, onEdit, isUniversityAdded }) => {
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
                  onEdit(essay, false);
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
});

EssayCard.displayName = "EssayCard";

export default EssayCard;