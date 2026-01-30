// src/app/workspace/independent/page.jsx

"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EssayEditor } from "../components/EssayEditor";
import { VersionManager } from "../components/VersionManager";
import { AISuggestions } from "../components/AiSuggestion";
import { EssayAnalytics } from "../components/EssayAnalytics";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Plus,
  Target,
  Sparkles,
  TrendingUp,
  Loader2,
  AlertCircle,
  Save,
  Trash2,
  X,
  Award,
  Clock,
  Building2,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  FileText,
  CheckCircle2,
  Circle,
  Filter,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

// ==========================================
// HELPER FUNCTION: calculateStats
// ==========================================

const calculateStats = (workspaceData) => {
  if (!workspaceData?.programs) return null;

  const stats = {
    totalPrograms: workspaceData.programs.length,
    totalEssayPrompts: 0,
    completedEssays: 0,
    totalWords: 0,
    standaloneEssays: 0,
    standaloneCompleted: 0,
    programsByUniversity: {},
  };

  workspaceData.programs.forEach((program) => {
    // Check if this is a standalone essay (no programId in essays or custom flag)
    const isStandaloneProgram = program.degreeType === "STANDALONE" || 
                                 program.programName === "My Custom Essays";

    if (!stats.programsByUniversity[program.universityId]) {
      stats.programsByUniversity[program.universityId] = [];
    }
    stats.programsByUniversity[program.universityId].push(program);

    if (program.essays) {
      stats.totalEssayPrompts += program.essays.length;

      program.essays.forEach((essay) => {
        if (essay.userEssay) {
          stats.totalWords += essay.userEssay.wordCount || 0;
          
          if (isStandaloneProgram) {
            stats.standaloneEssays++;
            if (essay.userEssay.isCompleted) {
              stats.standaloneCompleted++;
              stats.completedEssays++;
            }
          } else {
            if (essay.userEssay.isCompleted) {
              stats.completedEssays++;
            }
          }
        }
      });
    }
  });

  stats.averageProgress =
    stats.totalEssayPrompts > 0
      ? (stats.completedEssays / stats.totalEssayPrompts) * 100
      : 0;

  return stats;
};

// ==========================================
// STANDALONE ESSAY CREATION MODAL
// ==========================================

function StandaloneEssayModal({ 
  isOpen, 
  onClose, 
  onCreateEssay, 
  savedUniversities,
  isCreating 
}) {
  const [formData, setFormData] = useState({
    customTitle: '',
    customPrompt: '',
    wordLimit: 500,
    taggedUniversityId: '', // Optional
    priority: 'medium',
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.customTitle.trim()) {
      newErrors.customTitle = 'Essay title is required';
    }
    
    if (!formData.customPrompt.trim()) {
      newErrors.customPrompt = 'Essay prompt/question is required';
    }
    
    if (formData.wordLimit < 100 || formData.wordLimit > 5000) {
      newErrors.wordLimit = 'Word limit must be between 100 and 5000';
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
      customTitle: '',
      customPrompt: '',
      wordLimit: 500,
      taggedUniversityId: '',
      priority: 'medium',
    });
    setErrors({});
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#002147]">Create Custom Essay</h2>
              <p className="text-sm text-gray-500">Write your own essay with custom prompt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Essay Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Essay Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.customTitle}
              onChange={(e) => setFormData({ ...formData, customTitle: e.target.value })}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                errors.customTitle ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="e.g., Leadership Experience Essay"
            />
            {errors.customTitle && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.customTitle}
              </p>
            )}
          </div>

          {/* Essay Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Essay Prompt / Question <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.customPrompt}
              onChange={(e) => setFormData({ ...formData, customPrompt: e.target.value })}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none ${
                errors.customPrompt ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              rows={4}
              placeholder="Enter the essay question or topic you're writing about..."
            />
            {errors.customPrompt && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.customPrompt}
              </p>
            )}
            <p className="mt-1.5 text-xs text-gray-500">
              This will be your essay prompt that guides your writing
            </p>
          </div>

          {/* Word Limit & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Word Limit <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.wordLimit}
                onChange={(e) => setFormData({ ...formData, wordLimit: parseInt(e.target.value) || 500 })}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                  errors.wordLimit ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                min={100}
                max={5000}
              />
              {errors.wordLimit && (
                <p className="mt-1 text-sm text-red-600 text-xs">{errors.wordLimit}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          {/* University Tag (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tag University <span className="text-gray-400">(Optional)</span>
            </label>
            <select
              value={formData.taggedUniversityId}
              onChange={(e) => setFormData({ ...formData, taggedUniversityId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            >
              <option value="">📝 No University (Personal Essay)</option>
              {savedUniversities?.map((uni) => (
                <option key={uni.id} value={uni.id}>
                  🎓 {uni.name}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-gray-500">
              Optionally tag this essay with a university to organize it with your applications
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-900 mb-1">
                  Your custom essay will have:
                </p>
                <ul className="text-xs text-purple-700 space-y-1">
                  <li>✓ Full version history with restore capabilities</li>
                  <li>✓ AI-powered analysis and writing suggestions</li>
                  <li>✓ Auto-save and manual save options</li>
                  <li>✓ Progress tracking and completion analytics</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            disabled={isCreating}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isCreating}
            className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center space-x-2"
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
}

// ==========================================
// STANDALONE ESSAY CARD COMPONENT
// ==========================================

function StandaloneEssayCard({ 
  essayData,
  isActive, 
  onSelect, 
  onDelete,
  onToggleCompletion,
  universityName 
}) {
  const essay = essayData.userEssay;
  if (!essay) return null;

  const progress = essayData.wordLimit > 0 
    ? (essay.wordCount / essayData.wordLimit) * 100 
    : 0;

  const priorityColors = {
    high: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
    medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    low: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
  };

  const priorityConfig = priorityColors[essay.priority] || priorityColors.medium;

  return (
    <div
      className={`group relative p-3 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
        isActive
          ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-300 shadow-md'
          : 'bg-white border-gray-200 hover:border-purple-200'
      }`}
      onClick={onSelect}
    >
      {/* Priority Badge */}
      <div className="absolute top-2 right-2">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${priorityConfig.dot}`}></span>
          {essay.priority}
        </span>
      </div>

      {/* Essay Title */}
      <div className="pr-20 mb-2">
        <div className="flex items-center space-x-1.5 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
          <h4 className="text-sm font-semibold text-[#002147] line-clamp-2">
            {essayData.promptTitle}
          </h4>
        </div>
      </div>

      {/* Tagged University (if any) */}
      {universityName && (
        <div className="flex items-center space-x-1 text-xs text-gray-500 mb-2">
          <Building2 className="w-3 h-3" />
          <span className="truncate">{universityName}</span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>{essay.wordCount} / {essayData.wordLimit} words</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full transition-all duration-500 bg-gradient-to-r from-purple-500 to-indigo-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCompletion();
          }}
          className={`flex items-center space-x-1 text-xs transition-colors ${
            essay.isCompleted
              ? 'text-green-600 hover:text-green-700'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {essay.isCompleted ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <Circle className="w-3.5 h-3.5" />
          )}
          <span className="font-medium">{essay.isCompleted ? 'Completed' : 'Mark Complete'}</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50"
          title="Delete essay"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ==========================================
// UNIVERSITY SELECTOR COMPONENT
// ==========================================

function UniversitySelector({
  universities,
  selectedUniversityId,
  onSelect,
  stats,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedUniversity = universities?.find(
    (u) => u.id === selectedUniversityId
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-all min-w-[250px] hover:shadow-md active:scale-[0.98]"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
          style={{ backgroundColor: selectedUniversity?.color || "#002147" }}
        >
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-[#002147] truncate">
            {selectedUniversityId === "all"
              ? "All Universities"
              : selectedUniversity?.name || "Select University"}
          </p>
          <p className="text-xs text-gray-500">
            {selectedUniversityId === "all"
              ? `${universities?.length || 0} universities`
              : `${selectedUniversity?.programCount || 0} programs`}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden max-h-[400px] overflow-y-auto">
            {/* All Universities Option */}
            <button
              onClick={() => {
                onSelect("all");
                setIsOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors active:bg-gray-100 ${
                selectedUniversityId === "all" ? "bg-blue-50" : ""
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-sm">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-[#002147]">
                  All Universities
                </p>
                <p className="text-xs text-gray-500">
                  {stats?.totalPrograms || 0} programs •{" "}
                  {stats?.totalEssayPrompts || 0} essays
                </p>
              </div>
              {selectedUniversityId === "all" && (
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
              )}
            </button>

            <div className="border-t border-gray-100" />

            {/* Individual Universities */}
            {universities?.map((university) => {
              const uniPrograms =
                stats?.programsByUniversity?.[university.id] || [];
              const uniEssayCount = uniPrograms.reduce(
                (acc, p) => acc + (p.essays?.length || 0),
                0
              );

              return (
                <button
                  key={university.id}
                  onClick={() => {
                    onSelect(university.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors active:bg-gray-100 ${
                    selectedUniversityId === university.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: university.color || "#002147" }}
                  >
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-[#002147]">
                      {university.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {university.programCount} programs • {uniEssayCount}{" "}
                      essays
                    </p>
                  </div>
                  {selectedUniversityId === university.id && (
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ==========================================
// PROGRAM CARD COMPONENT
// ==========================================

function ProgramCard({
  program,
  isExpanded,
  onToggle,
  activeEssayPromptId,
  onEssaySelect,
  onDeleteEssay,
  onCreateEssay,
  onToggleCompletion,
}) {
  const completedEssays =
    program.essays?.filter((e) => e.userEssay?.isCompleted).length || 0;
  const totalEssays = program.essays?.length || 0;
  const progress = totalEssays > 0 ? (completedEssays / totalEssays) * 100 : 0;

  // Check if this is a standalone program
  const isStandaloneProgram = program.degreeType === "STANDALONE" || 
                               program.programName === "My Custom Essays";

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
                    {/* Completion Toggle Button */}
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
                    
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEssay(essayData.userEssay.id);
                      }}
                      className="text-gray-400 hover:text-red-500 p-1 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
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

// ==========================================
// STATS SUMMARY COMPONENT
// ==========================================

function StatsSummary({ stats, selectedUniversityId, universities }) {
  const displayStats = useMemo(() => {
    if (selectedUniversityId === "all") {
      return {
        universities: universities?.length || 0,
        programs: stats?.totalPrograms || 0,
        essays: stats?.totalEssayPrompts || 0,
        completed: stats?.completedEssays || 0,
        words: stats?.totalWords || 0,
        progress: stats?.averageProgress || 0,
        standalone: stats?.standaloneEssays || 0,
        standaloneCompleted: stats?.standaloneCompleted || 0,
      };
    }

    const uniPrograms =
      stats?.programsByUniversity?.[selectedUniversityId] || [];
    const uniEssays = uniPrograms.reduce(
      (acc, p) => acc + (p.essays?.length || 0),
      0
    );
    const uniCompleted = uniPrograms.reduce(
      (acc, p) =>
        acc + (p.essays?.filter((e) => e.userEssay?.isCompleted).length || 0),
      0
    );
    const uniWords = uniPrograms.reduce(
      (acc, p) =>
        acc +
        (p.essays?.reduce((ea, e) => ea + (e.userEssay?.wordCount || 0), 0) ||
          0),
      0
    );

    return {
      universities: 1,
      programs: uniPrograms.length,
      essays: uniEssays,
      completed: uniCompleted,
      words: uniWords,
      progress: uniEssays > 0 ? (uniCompleted / uniEssays) * 100 : 0,
      standalone: stats?.standaloneEssays || 0,
      standaloneCompleted: stats?.standaloneCompleted || 0,
    };
  }, [stats, selectedUniversityId, universities]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-purple-500" />
          <span className="text-xs text-gray-500">Universities</span>
        </div>
        <p className="text-xl font-bold text-[#002147] mt-1">
          {displayStats.universities}
        </p>
      </div>

      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-2">
          <GraduationCap className="w-4 h-4 text-blue-500" />
          <span className="text-xs text-gray-500">Programs</span>
        </div>
        <p className="text-xl font-bold text-[#002147] mt-1">
          {displayStats.programs}
        </p>
      </div>

      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-green-500" />
          <span className="text-xs text-gray-500">Essays</span>
        </div>
        <p className="text-xl font-bold text-[#002147] mt-1">
          {displayStats.completed}/{displayStats.essays}
        </p>
      </div>

      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-xs text-gray-500">Custom</span>
        </div>
        <p className="text-xl font-bold text-[#002147] mt-1">
          {displayStats.standaloneCompleted}/{displayStats.standalone}
        </p>
      </div>

      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-orange-500" />
          <span className="text-xs text-gray-500">Total Words</span>
        </div>
        <p className="text-xl font-bold text-[#002147] mt-1">
          {displayStats.words.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function IndependentWorkspacePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [workspaceData, setWorkspaceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active selections
  const [selectedUniversityId, setSelectedUniversityId] = useState("all");
  const [activeProgramId, setActiveProgramId] = useState(null);
  const [activeEssayPromptId, setActiveEssayPromptId] = useState(null);
  const [expandedPrograms, setExpandedPrograms] = useState(new Set());

  // UI state
  const [showVersions, setShowVersions] = useState(false);
  const [showAI, setShowAI] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [panelOrder, setPanelOrder] = useState(['versions', 'analytics', 'ai']);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isCreatingEssay, setIsCreatingEssay] = useState(false);
  const [isSavingVersion, setIsSavingVersion] = useState(false);

  // Standalone essay state
  const [showStandaloneEssayModal, setShowStandaloneEssayModal] = useState(false);
  const [isCreatingStandaloneEssay, setIsCreatingStandaloneEssay] = useState(false);

  // Activity tracking
  const [lastUserActivity, setLastUserActivity] = useState(Date.now());
  const [isUserActive, setIsUserActive] = useState(true);

  // Refs for auto-save
  const autoSaveTimerRef = useRef(null);
  const lastContentRef = useRef("");
  const isUpdatingRef = useRef(false);
  const activityTimeoutRef = useRef(null);

  // ==========================================
  // COMPUTED DATA
  // ==========================================

  const enhancedStats = useMemo(() => {
    if (!workspaceData) return null;
    const freshStats = calculateStats(workspaceData);
    return {
      ...freshStats,
      savedUniversitiesCount: workspaceData.universities?.length || 0,
    };
  }, [workspaceData]);

  // Separate standalone essays from regular program essays
  const { standaloneEssays, regularPrograms } = useMemo(() => {
    if (!workspaceData?.programs) {
      return { standaloneEssays: [], regularPrograms: [] };
    }

    const standalone = [];
    const regular = [];

    workspaceData.programs.forEach(program => {
      const isStandaloneProgram = program.degreeType === "STANDALONE" || 
                                   program.programName === "My Custom Essays";
      
      if (isStandaloneProgram) {
        // Extract essays from standalone programs
        program.essays?.forEach(essayData => {
          if (essayData.userEssay) {
            standalone.push({
              ...essayData,
              programId: program.id,
              universityId: program.universityId,
              universityName: program.universityName,
              universityColor: program.universityColor,
            });
          }
        });
      } else {
        regular.push(program);
      }
    });

    return { standaloneEssays: standalone, regularPrograms: regular };
  }, [workspaceData]);

  // Filtered programs based on selected university and status filter
  const filteredPrograms = useMemo(() => {
    let programs = regularPrograms;

    // Filter by university
    if (selectedUniversityId !== "all") {
      programs = programs.filter(
        (p) => p.universityId === selectedUniversityId
      );
    }

    // Filter by essay status
    if (filterStatus !== "all") {
      programs = programs
        .map((program) => ({
          ...program,
          essays: program.essays?.filter((essay) => {
            if (filterStatus === "completed")
              return essay.userEssay?.isCompleted;
            if (filterStatus === "in-progress")
              return essay.userEssay && !essay.userEssay.isCompleted;
            if (filterStatus === "not-started") return !essay.userEssay;
            return true;
          }),
        }))
        .filter((p) => p.essays?.length > 0);
    }

    // Filter out programs with no essays
    programs = programs.filter((p) => p.essays && p.essays.length > 0);

    return programs;
  }, [regularPrograms, selectedUniversityId, filterStatus]);

  // Current program and essay
  const currentProgram = useMemo(() => {
    return workspaceData?.programs?.find((p) => p.id === activeProgramId);
  }, [workspaceData, activeProgramId]);

  const currentEssayData = useMemo(() => {
    return currentProgram?.essays?.find(
      (e) => e.promptId === activeEssayPromptId
    );
  }, [currentProgram, activeEssayPromptId]);

  const currentEssay = useMemo(() => {
    return currentEssayData?.userEssay;
  }, [currentEssayData]);

  // Current university for header
  const currentUniversity = useMemo(() => {
    if (selectedUniversityId === "all") {
      return null;
    }
    return workspaceData?.universities?.find(
      (u) => u.id === selectedUniversityId
    );
  }, [workspaceData, selectedUniversityId]);

  // ==========================================
  // API FUNCTIONS
  // ==========================================

  const fetchWorkspaceData = useCallback(async () => {
    if (status === "loading") return;

    if (status !== "authenticated") {
      setError("Please login to view your workspace");
      setLoading(false);
      router.push("/signin");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/essay/independent`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          router.push("/signin");
          return;
        }
        throw new Error(errorData.error || "Failed to fetch data");
      }

      const data = await response.json();
      console.log("Fetched workspace data:", data);
      setWorkspaceData(data);

      // Auto-expand first program and select first essay
      if (data.programs && data.programs.length > 0) {
        const firstProgram = data.programs[0];
        setExpandedPrograms(new Set([firstProgram.id]));
        setActiveProgramId(firstProgram.id);

        if (firstProgram.essays && firstProgram.essays.length > 0) {
          setActiveEssayPromptId(firstProgram.essays[0].promptId);
          lastContentRef.current =
            firstProgram.essays[0].userEssay?.content || "";
        }
      }
    } catch (err) {
      console.error("Error fetching workspace data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status, router]);

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  // ==========================================
  // ✅ FIX 3A: AUTO-SAVE LOGIC (FIXED)
  // ==========================================

  const autoSaveEssay = useCallback(async () => {
    if (
      !currentEssay ||
      isSaving ||
      !hasUnsavedChanges ||
      isUpdatingRef.current
    ) {
      return false;
    }

    try {
      setIsSaving(true);
      isUpdatingRef.current = true;

      const response = await fetch(`/api/essay/independent`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          essayId: currentEssay.id,
          content: currentEssay.content,
          wordCount: currentEssay.wordCount,
          isAutoSave: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // ✅ FIX: Update workspace data with server response
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
                              ...result.essay,
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
        
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
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
  }, [currentEssay, isSaving, hasUnsavedChanges, activeProgramId, activeEssayPromptId]);

  // Auto-save timer
// Auto-save timer - FIXED to not interfere with version save
useEffect(() => {
  if (autoSaveTimerRef.current) {
    clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = null;
  }

  // ✅ FIX: Don't auto-save if version save is in progress
  if (
    hasUnsavedChanges &&
    currentEssay &&
    !isSaving &&
    !isSavingVersion && // ← ADDED
    !isUpdatingRef.current &&
    activeView === "editor" &&
    isUniversityAdded
  ) {
    const timeSinceLastActivity = Date.now() - lastUserActivity;

    if (timeSinceLastActivity >= 4 * 60 * 1000) {
      // User inactive for 4+ minutes
      autoSaveEssay();
    } else if (!isUserActive) {
      // Schedule auto-save
      const remainingTime = 4 * 60 * 1000 - timeSinceLastActivity;
      autoSaveTimerRef.current = setTimeout(() => {
        if (!isSavingVersion) { // ← Double-check
          autoSaveEssay();
        }
      }, remainingTime);
    }
  }

  return () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
  };
}, [
  hasUnsavedChanges,
  currentEssay?.id,
  isSaving,
  isSavingVersion, // ← ADDED
  activeView,
  lastUserActivity,
  isUserActive,
  autoSaveEssay,
  isUniversityAdded,
]);

  // Activity tracking
  useEffect(() => {
    const handleUserActivity = () => {
      const now = Date.now();
      setLastUserActivity(now);
      setIsUserActive(true);

      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }

      activityTimeoutRef.current = setTimeout(() => {
        setIsUserActive(false);
      }, 2 * 60 * 1000);
    };

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((event) => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    handleUserActivity();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleUserActivity);
      });
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, []);

  // ==========================================
  // ESSAY CONTENT UPDATE
  // ==========================================

  const updateEssayContent = useCallback(
    (content, wordCount) => {
      if (isUpdatingRef.current || !currentEssay) return;
      if (content === lastContentRef.current) return;

      try {
        isUpdatingRef.current = true;

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

          updated.stats = calculateStats(updated);
          
          return updated;
        });

        lastContentRef.current = content;
        setHasUnsavedChanges(true);
      } catch (error) {
        console.error("Error updating content:", error);
      } finally {
        isUpdatingRef.current = false;
      }
    },
    [currentEssay, activeProgramId, activeEssayPromptId]
  );

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  const handlePanelToggle = useCallback((panelName, currentState) => {
    if (!currentState) {
      setPanelOrder(prev => [panelName, ...prev.filter(p => p !== panelName)]);
    }
  }, []);

  const handleEssaySelect = useCallback(
    (programId, promptId) => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }

      setActiveProgramId(programId);
      setActiveEssayPromptId(promptId);
      setHasUnsavedChanges(false);
      setLastSaved(null);
      setError(null);

      setExpandedPrograms((prev) => new Set([...prev, programId]));

      const program = workspaceData?.programs?.find((p) => p.id === programId);
      const essayData = program?.essays?.find((e) => e.promptId === promptId);
      lastContentRef.current = essayData?.userEssay?.content || "";
    },
    [workspaceData]
  );

  const toggleProgramExpansion = useCallback((programId) => {
    setExpandedPrograms((prev) => {
      const next = new Set(prev);
      if (next.has(programId)) {
        next.delete(programId);
      } else {
        next.add(programId);
      }
      return next;
    });
  }, []);

  // ==========================================
  // ✅ FIX 3B: MANUAL SAVE FUNCTION (FIXED)
  // ==========================================

  const manualSave = useCallback(async () => {
    if (!currentEssay || isSaving) return false;
    
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/essay/independent`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          essayId: currentEssay.id,
          content: currentEssay.content,
          wordCount: currentEssay.wordCount,
          isAutoSave: false,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // ✅ FIX: Update workspace data with server response
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
                              ...result.essay,
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
        
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        toast.success('Changes saved successfully!');
        return true;
      }
      return false;
    } catch (error) {
      console.error("Manual save error:", error);
      toast.error("Failed to save changes");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [currentEssay, isSaving, activeProgramId, activeEssayPromptId]);

  // ==========================================
  // ✅ FIX 3C: SAVE VERSION FUNCTION (FIXED)
  // ==========================================

 const saveVersion = useCallback(
  async (label) => {
    // ✅ FIX: Prevent multiple simultaneous saves
    if (!currentEssay || isSaving || isSavingVersion || isUpdatingRef.current) {
      console.warn('Save already in progress');
      return false;
    }

    // ✅ FIX: Lock immediately to prevent race conditions
    setIsSavingVersion(true);
    isUpdatingRef.current = true;

    try {
      // ✅ FIX: Get fresh content (handle pending updates)
      let contentToSave = currentEssay.content || '';
      let wordCountToSave = currentEssay.wordCount || 0;
      
      if (pendingContentRef.current) {
        contentToSave = pendingContentRef.current.content;
        wordCountToSave = pendingContentRef.current.wordCount;
      }

      // ✅ FIX: Validate content before saving
      if (!contentToSave || wordCountToSave === 0) {
        toast.error('Cannot save empty version');
        return false;
      }

      console.log('📝 Saving version:', {
        essayId: currentEssay.id,
        wordCount: wordCountToSave,
        label: label || `Version ${new Date().toLocaleString()}`
      });

      // ✅ FIX: No auto-save before version save (it's redundant)
      // If there are unsaved changes, they'll be included in the version

      const isCustom = currentProgram?.degreeType === "STANDALONE" || currentProgram?.isCustom;
      const apiRoute = isCustom ? "/api/essay/independent" : `/api/essay/${encodeURIComponent(universityName)}`;

      const response = await fetch(apiRoute, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Save failed: ${response.status}`);
      }

      const result = await response.json();

      // ✅ FIX: Validate response has required data
      if (!result.success || !result.essay) {
        throw new Error('Invalid response from server');
      }

      console.log('✅ Version saved successfully:', result.version?.id);

      // ✅ FIX: Update workspace with COMPLETE essay data from server
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
                          userEssay: result.essay, // ← Use complete server response
                        }
                      : essayData
                  ),
                }
              : program
          ),
        };
      });

      // ✅ FIX: Clear pending changes and update refs
      pendingContentRef.current = null;
      setHasUnsavedChanges(false);
      setLastSaved(new Date());

      toast.success('Version saved successfully! 🎉');
      
      return true;
    } catch (error) {
      console.error("❌ Error saving version:", error);
      toast.error(error.message || 'Failed to save version');
      return false;
    } finally {
      // ✅ FIX: Always unlock, even on error
      setIsSavingVersion(false);
      isUpdatingRef.current = false;
    }
  },
  [
    currentEssay,
    isSaving,
    isSavingVersion,
    currentProgram,
    universityName,
    activeProgramId,
    activeEssayPromptId,
    userId,
    userEmail,
  ]
);
  const handleCreateEssay = async (programId, essayPromptId) => {
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
          essayPromptId,
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
                      essayData.promptId === essayPromptId
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

        lastContentRef.current = result.essay.content || "";
        setHasUnsavedChanges(false);
        setLastSaved(new Date());

        handleEssaySelect(programId, essayPromptId);
        toast.success('Essay created successfully!');
      }
    } catch (error) {
      console.error("Error creating essay:", error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsCreatingEssay(false);
    }
  };

  // ==========================================
  // STANDALONE ESSAY HANDLERS
  // ==========================================

  const handleCreateStandaloneEssay = async (formData) => {
    try {
      setIsCreatingStandaloneEssay(true);
      setError(null);

      const response = await fetch(`/api/essay/independent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'create_standalone_essay',
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create custom essay');
      }

      const result = await response.json();

      if (result.success) {
        // Refresh workspace data to get the new essay
        await fetchWorkspaceData();
        
        setShowStandaloneEssayModal(false);
        toast.success('Custom essay created successfully! 🎉', {
          description: 'Your essay is ready for writing',
        });

        // Auto-select the newly created essay if possible
        if (result.essayPromptId && result.programId) {
          setTimeout(() => {
            handleEssaySelect(result.programId, result.essayPromptId);
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error creating standalone essay:', error);
      setError(error.message);
      toast.error(error.message || 'Failed to create custom essay');
    } finally {
      setIsCreatingStandaloneEssay(false);
    }
  };

  const handleDeleteEssay = async (essayId) => {
    if (!confirm("Are you sure you want to delete this essay? This action cannot be undone.")) return;

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
                    userEssay: null,
                  }
                : essayData
            ),
          })),
        };

        // Recalculate stats
        updated.stats = calculateStats(updated);
        
        return updated;
      });

      if (currentEssay?.id === essayId) {
        setActiveEssayPromptId(null);
        setActiveProgramId(null);
        lastContentRef.current = "";
      }

      toast.success('Essay deleted successfully');
    } catch (error) {
      setError(error.message);
      toast.error('Failed to delete essay');
    }
  };

  const toggleEssayCompletion = useCallback(
    async (essayId, currentStatus) => {
      try {
        // Optimistically update UI
        const newStatus = !currentStatus;
        
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
                        isCompleted: newStatus,
                      },
                    }
                  : essayData
              ),
            })),
          };

          updated.stats = calculateStats(updated);
          
          return updated;
        });

        // Send API request
        const response = await fetch(`/api/essay/independent`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            essayId,
            isCompleted: newStatus,
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

        // Update with server data if available
        try {
          const result = await response.json();
          if (result.essay) {
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
                          userEssay: result.essay,
                        }
                      : essayData
                  ),
                })),
              };

              updated.stats = calculateStats(updated);
              return updated;
            });
          }
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
        }

        toast.success(
          newStatus ? 'Essay marked as complete! 🎉' : 'Essay marked as incomplete'
        );
      } catch (error) {
        console.error("Error toggling completion:", error);
        setError(error.message);
        toast.error(error.message);
      }
    },
    []
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // ==========================================
  // LOADING & ERROR STATES
  // ==========================================

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <Card className="p-8 bg-white/70 backdrop-blur-sm shadow-xl">
          <div className="flex items-center space-x-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#3598FE]" />
            <div>
              <h3 className="text-lg font-semibold text-[#002147]">
                Loading Workspace
              </h3>
              <p className="text-sm text-[#6C7280]">
                Fetching essays from saved universities...
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error && !workspaceData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <Card className="p-8 bg-white/70 backdrop-blur-sm shadow-xl max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            Error Loading Workspace
          </h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-[#3598FE] hover:bg-[#2563EB] shadow-md hover:shadow-lg active:scale-95"
          >
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (
    workspaceData &&
    (!workspaceData.universities || workspaceData.universities.length === 0)
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <Card className="p-8 bg-white/70 backdrop-blur-sm shadow-xl max-w-md text-center">
          <Building2 className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#002147] mb-2">
            No Saved Universities
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Save universities to start working on their essays or create custom essays
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => router.push("/dashboard/search")}
              className="bg-[#3598FE] hover:bg-[#2563EB] shadow-md hover:shadow-lg active:scale-95"
            >
              Browse Universities
            </Button>
            <Button
              onClick={() => setShowStandaloneEssayModal(true)}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:shadow-lg active:scale-95"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Create Custom Essay
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ==========================================
  // MAIN RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      {/* Dynamic Header */}
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
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center space-x-3 px-4 py-3 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md active:scale-95 transition-all group"
                title="Back to Dashboard"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-[#3598FE] flex items-center justify-center transition-colors">
                  <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-[#002147] group-hover:text-[#3598FE] transition-colors">
                    Back to Dashboard
                  </p>
                  <p className="text-xs text-gray-500">
                    Return to main dashboard
                  </p>
                </div>
              </button>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* University Selector */}
              <UniversitySelector
                universities={workspaceData?.universities}
                selectedUniversityId={selectedUniversityId}
                onSelect={setSelectedUniversityId}
                stats={enhancedStats}
              />

              {/* Create Custom Essay Button */}
              <button
                onClick={() => setShowStandaloneEssayModal(true)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Create Essay</span>
                <span className="text-sm font-medium sm:hidden">New</span>
              </button>

              {/* Word Count Display */}
              {currentEssay && (
                <div className="hidden lg:flex items-center space-x-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
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
              <div className="hidden lg:flex items-center space-x-2">
                <Button
                  variant={showAnalytics ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    handlePanelToggle('analytics', showAnalytics);
                    setShowAnalytics(!showAnalytics);
                  }}
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
                  onClick={() => {
                    handlePanelToggle('ai', showAI);
                    setShowAI(!showAI);
                  }}
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

      {/* Stats Summary */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-4">
        <StatsSummary
          stats={enhancedStats}
          selectedUniversityId={selectedUniversityId}
          universities={workspaceData?.universities}
        />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 pb-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-100 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )};

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Programs & Essays List */}
          <div className="col-span-12 lg:col-span-3">
            <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm sticky top-28 hover:shadow-2xl transition-shadow">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#002147]">
                    Essays
                  </h3>

                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="text-xs px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <option value="all">All</option>
                    <option value="completed">Completed</option>
                    <option value="in-progress">In Progress</option>
                    <option value="not-started">Not Started</option>
                  </select>
                </div>

                {/* Scrollable Content */}
                <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
                  {/* Standalone Essays Section */}
                  {standaloneEssays.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3 px-2">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center space-x-2">
                          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                          <span>My Custom Essays</span>
                        </h4>
                        <span className="text-xs text-gray-400 bg-purple-50 px-2 py-0.5 rounded-full">
                          {standaloneEssays.length}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {standaloneEssays.map((essayData) => (
                          <StandaloneEssayCard
                            key={essayData.promptId}
                            essayData={essayData}
                            isActive={activeEssayPromptId === essayData.promptId}
                            onSelect={() => handleEssaySelect(essayData.programId, essayData.promptId)}
                            onDelete={() => handleDeleteEssay(essayData.userEssay.id)}
                            onToggleCompletion={() => toggleEssayCompletion(
                              essayData.userEssay.id,
                              essayData.userEssay.isCompleted
                            )}
                            universityName={essayData.universityName}
                          />
                        ))}
                      </div>

                      <div className="border-t border-gray-200 my-4" />
                    </div>
                  )}

                  {/* Regular Programs */}
                  {filteredPrograms.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3 px-2">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Program Essays
                        </h4>
                        <span className="text-xs text-gray-400">
                          {filteredPrograms.length}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {filteredPrograms.map((program) => (
                          <ProgramCard
                            key={program.id}
                            program={program}
                            isExpanded={expandedPrograms.has(program.id)}
                            onToggle={() => toggleProgramExpansion(program.id)}
                            activeEssayPromptId={activeEssayPromptId}
                            onEssaySelect={handleEssaySelect}
                            onDeleteEssay={handleDeleteEssay}
                            onCreateEssay={handleCreateEssay}
                            onToggleCompletion={toggleEssayCompletion}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {filteredPrograms.length === 0 && standaloneEssays.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-3">
                        {filterStatus !== "all"
                          ? `No ${filterStatus.replace("-", " ")} essays`
                          : "No essays available"}
                      </p>
                      <button
                        onClick={() => setShowStandaloneEssayModal(true)}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Create your first custom essay →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Main Editor Area */}
          <div className="col-span-12 lg:col-span-6">
            <Card className="min-h-[600px] shadow-xl border-0 bg-white/70 backdrop-blur-sm hover:shadow-2xl transition-shadow">
              <div className="p-6">
                {currentEssayData && currentEssay ? (
                  <>
                    {/* Essay Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <div
                            className="w-3 h-3 rounded-full shadow-sm flex-shrink-0"
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
                        
                        {/* FIXED: Full prompt text without truncation */}
                        <div className="mt-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                          <p className="text-xs text-blue-700 font-medium mb-1">
                            Essay Prompt:
                          </p>
                          <p 
                            className="text-sm text-gray-700 leading-relaxed"
                            style={{
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              overflow: 'visible',
                            }}
                          >
                            {currentEssayData.promptText}
                          </p>
                          <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                            <span>Word limit: {currentEssayData.wordLimit}</span>
                            {currentEssayData.isMandatory && (
                              <span className="text-red-600 font-medium">• Required</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Versions Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handlePanelToggle('versions', showVersions);
                          setShowVersions(!showVersions);
                        }}
                        className={`
                          transition-all duration-200 font-medium shadow-sm flex-shrink-0
                          ${showVersions
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-blue-200 hover:shadow-lg hover:scale-105 active:scale-95"
                            : "bg-white border-2 border-[#3598FE] text-[#3598FE] hover:bg-blue-50 hover:border-[#2563EB] hover:shadow-md active:scale-95"
                          }
                        `}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Versions ({currentEssay.versions?.length || 0})
                      </Button>
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
                      onSave={manualSave}
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
                          saveVersion(
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
                ) : currentEssayData && !currentEssay ? (
                  /* Start Essay State - FIXED */
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
                    <h3 className="text-lg font-semibold text-[#002147] mb-4">
                      {currentEssayData.promptTitle}
                    </h3>
                    
                    {/* FIXED: Full prompt text without truncation */}
                    <div className="w-full max-w-2xl px-4 mb-6">
                      <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-700 font-medium mb-2">
                          Essay Prompt:
                        </p>
                        <p 
                          className="text-sm text-gray-700 leading-relaxed"
                          style={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            overflow: 'visible',
                          }}
                        >
                          {currentEssayData.promptText}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-xs text-gray-500 mb-6">
                      <span>{currentEssayData.wordLimit} words max</span>
                      {currentEssayData.isMandatory && (
                        <>
                          <span>•</span>
                          <span className="text-red-600 font-medium">Required</span>
                        </>
                      )}
                    </div>
                    <Button
                      onClick={() =>
                        handleCreateEssay(
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
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-16">
                    <GraduationCap className="w-16 h-16 text-gray-300 mb-6" />
                    <h3 className="text-lg font-semibold text-[#002147] mb-2">
                      Select an Essay
                    </h3>
                    <p className="text-sm text-gray-600 text-center max-w-md">
                      Choose a program and essay from the sidebar to start
                      editing
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Sidebar - Panels in Order */}
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
                    onRestoreVersion={async (versionId) => {
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

                            lastContentRef.current = result.essay.content || "";
                          }

                          setHasUnsavedChanges(false);
                          setLastSaved(new Date());
                          toast.success('Version restored successfully!');
                        } else {
                          const errorData = await response.json();
                          setError(errorData.error || "Failed to restore version");
                        }
                      } catch (error) {
                        console.error("Error restoring version:", error);
                        setError("Error restoring version");
                      }
                    }}
                    onDeleteVersion={async (versionId) => {
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
                          toast.success('Version deleted successfully');
                        } else {
                          const errorData = await response.json();
                          setError(errorData.error || "Failed to delete version");
                        }
                      } catch (error) {
                        console.error("Error deleting version:", error);
                        setError("Error deleting version");
                      }
                    }}
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
        </div>
      </div>

      {/* Standalone Essay Modal */}
      <StandaloneEssayModal
        isOpen={showStandaloneEssayModal}
        onClose={() => setShowStandaloneEssayModal(false)}
        onCreateEssay={handleCreateStandaloneEssay}
        savedUniversities={workspaceData?.universities}
        isCreating={isCreatingStandaloneEssay}
      />

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.25s ease-out;
        }
      `}</style>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200/50">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>
                {workspaceData?.universities?.length || 0}{" "}
                saved universities
              </span>
              <span>•</span>
              <span>Auto-save enabled (4 min inactivity)</span>
            </div>
            <div className="flex items-center space-x-4">
              {session?.user?.email && (
                <>
                  <span>{session.user.email}</span>
                  <span>•</span>
                </>
              )}
              <span>Last sync: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}