import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  BookOpen,
  AlertCircle,
  Loader2,
  Plus,
} from "lucide-react";

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

export default CustomEssayModal;