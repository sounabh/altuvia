import React from "react";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Flame,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  FileText,
  Edit3,
  Trash2,
} from "lucide-react";
import { PRIORITY_CONFIG } from "@/lib/constants/ApplicationTab/Constant"

const CustomEssayCard = ({ essay, index, onEdit, onDelete }) => {
  const progress =
    essay.wordLimit > 0 ? (essay.wordCount / essay.wordLimit) * 100 : 0;

  const priorityConfig =
    PRIORITY_CONFIG[essay.priority] || PRIORITY_CONFIG.medium;
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
                  {essay?.priority?.charAt(0).toUpperCase() +
                    essay?.priority?.slice(1)}{" "}
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
              onDelete(essay.id);
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
};

CustomEssayCard.displayName = "CustomEssayCard";

export default CustomEssayCard;