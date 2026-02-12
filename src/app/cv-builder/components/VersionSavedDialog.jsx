// components/VersionSaveDialog.jsx
import React, { useState } from 'react';
import { X, Save, Star, Sparkles, FileText } from 'lucide-react';

/**
 * VersionSaveDialog - Modal dialog for saving CV versions
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Controls dialog visibility
 * @param {Function} props.onClose - Callback when dialog closes
 * @param {Function} props.onSave - Callback when version is saved
 * @param {string} props.currentVersionName - Pre-filled version name
 * @returns {JSX.Element|null} Dialog component or null when closed
 */
export const VersionSaveDialog = ({ isOpen, onClose, onSave, currentVersionName }) => {
  // State for form inputs
  const [versionName, setVersionName] = useState(currentVersionName || "");
  const [description, setDescription] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);

  /**
   * Handles the save action
   * Validates input and calls onSave prop with version data
   */
  const handleSave = () => {
    // Validation: Ensure version name is not empty
    if (!versionName.trim()) {
      alert("Please enter a version name");
      return;
    }
    
    // Pass version data to parent component
    onSave({
      versionName: versionName.trim(),
      description: description.trim(),
      isBookmarked
    });

    // Reset form state
    setVersionName("");
    setDescription("");
    setIsBookmarked(false);
  };

  /**
   * Handles dialog close
   * Resets form state and calls onClose prop
   */
  const handleClose = () => {
    setVersionName("");
    setDescription("");
    setIsBookmarked(false);
    onClose();
  };

  // Return null if dialog is not open
  if (!isOpen) return null;

  // Pre-defined version name suggestions
  const suggestions = [
    "Google Application",
    "Microsoft Focus",
    "Startup Version",
    "Tech Companies",
    "Consulting Focus",
    "MBA Application"
  ];

  return (
    // Overlay background
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      
      {/* Dialog container */}
      <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        
        {/* Header section */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
          
          {/* Left side: Title and icon */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#002147] flex items-center justify-center shadow-lg shadow-[#002147]/20">
              <Save className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#002147]">Save Version</h3>
              <p className="text-[11px] text-slate-500">Create a snapshot of your CV</p>
            </div>
          </div>

          {/* Close button */}
          <button 
            onClick={handleClose} 
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Main form content */}
        <div className="p-5 space-y-4">
          
          {/* Version name input section */}
          <div className="space-y-2">
            <label className="text-[12px] font-semibold text-[#002147] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#3598FE]" />
              Version Name
              <span className="text-red-500">*</span>
            </label>
            
            <input
              type="text"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="e.g., Google Application, Final Draft"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-[#002147] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3598FE]/20 focus:border-[#3598FE] transition-all"
              autoFocus
            />
            
            {/* Quick suggestion buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setVersionName(suggestion)}
                  className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-[#3598FE]/10 hover:text-[#3598FE] text-slate-600 rounded-full transition-colors font-medium"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
          
          {/* Description textarea section */}
          <div className="space-y-2">
            <label className="text-[12px] font-semibold text-[#002147] flex items-center gap-1.5">
              Description
              <span className="text-[10px] text-slate-400 font-normal">(optional)</span>
            </label>
            
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What makes this version unique?"
              rows={2}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-[#002147] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3598FE]/20 focus:border-[#3598FE] transition-all resize-none"
            />
          </div>
          
          {/* Bookmark toggle section */}
          <label className="flex items-center gap-3 p-3 bg-amber-50/50 border border-amber-100 rounded-xl cursor-pointer hover:bg-amber-50 transition-colors">
            <input
              type="checkbox"
              checked={isBookmarked}
              onChange={(e) => setIsBookmarked(e.target.checked)}
              className="w-4 h-4 text-amber-500 border-amber-300 rounded focus:ring-amber-500"
            />
            
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-800">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                Bookmark this version
              </div>
              
              <p className="text-[11px] text-amber-600/80 mt-0.5">
                Quick access from the top of your list
              </p>
            </div>
          </label>

          {/* Help tip section */}
          <div className="flex items-start gap-2.5 p-3 bg-[#3598FE]/5 border border-[#3598FE]/10 rounded-xl">
            <Sparkles className="w-4 h-4 text-[#3598FE] mt-0.5 flex-shrink-0" />
            
            <p className="text-[11px] text-[#002147]/70 leading-relaxed">
              <strong className="text-[#002147]">Tip:</strong> 
              Create versions for different companies or roles. Switch between them anytime and export as separate PDFs.
            </p>
          </div>
        </div>
        
        {/* Footer with action buttons */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 bg-slate-50/50 border-t border-slate-100">
          
          {/* Cancel button */}
          <button
            onClick={handleClose}
            className="px-4 py-2 text-[13px] font-medium text-slate-600 hover:text-[#002147] hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          
          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!versionName.trim()}
            className="px-4 py-2 bg-[#002147] text-white text-[13px] font-medium rounded-lg hover:bg-[#003167] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-[#002147]/20"
          >
            <Save className="w-3.5 h-3.5" />
            Save Version
          </button>
        </div>
      </div>
    </div>
  );
};