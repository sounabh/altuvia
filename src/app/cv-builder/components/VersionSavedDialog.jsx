// components/VersionSaveDialog.jsx
import React, { useState } from 'react';
import { X, Save, Star } from 'lucide-react';

export const VersionSaveDialog = ({ isOpen, onClose, onSave, currentVersionName }) => {
  const [versionName, setVersionName] = useState(currentVersionName || "");
  const [description, setDescription] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleSave = () => {
    if (!versionName.trim()) {
      alert("Please enter a version name");
      return;
    }
    
    onSave({
      versionName: versionName.trim(),
      description: description.trim(),
      isBookmarked
    });

    // Reset form
    setVersionName("");
    setDescription("");
    setIsBookmarked(false);
  };

  const handleClose = () => {
    setVersionName("");
    setDescription("");
    setIsBookmarked(false);
    onClose();
  };

  if (!isOpen) return null;

  // Suggested version names based on common use cases
  const suggestions = [
    "Google Application",
    "Microsoft Focus",
    "Startup Version",
    "Tech Companies",
    "Research Position",
    "Final Draft",
    "Consulting Focus",
    "Data Science Track",
    "Software Engineering",
    "MBA Application"
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Save className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Save CV Version</h3>
          </div>
          <button 
            onClick={handleClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Version Name Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Version Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="e.g., Google Application, Tech Focus, Final Draft"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              autoFocus
            />
            
            {/* Quick Suggestions */}
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-600 mb-2">Quick suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 5).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setVersionName(suggestion)}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-700 rounded-full transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Description Textarea */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description <span className="text-gray-400 text-xs font-normal">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What changes did you make in this version? e.g., Updated skills section, tailored for tech companies..."
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Help yourself remember what makes this version unique
            </p>
          </div>
          
          {/* Bookmark Checkbox */}
          <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <input
              type="checkbox"
              id="bookmark"
              checked={isBookmarked}
              onChange={(e) => setIsBookmarked(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-yellow-600 border-yellow-300 rounded focus:ring-yellow-500"
            />
            <label htmlFor="bookmark" className="flex-1 cursor-pointer">
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-gray-900">
                  Bookmark this version
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Bookmarked versions appear at the top for quick access
              </p>
            </label>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>💡 Tip:</strong> Create versions for different companies, roles, or industries. 
              You can always switch between versions and export them as separate PDFs.
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!versionName.trim()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Version</span>
          </button>
        </div>
      </div>
    </div>
  );
};