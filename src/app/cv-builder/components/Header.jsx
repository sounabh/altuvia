// components/Header.jsx - PREMIUM MODERN DESIGN
import React, { useState } from "react";
import {
  Eye,
  Bot,
  GitBranch,
  Download,
  Save,
  Plus,
  Loader2,
  TrendingUp,
} from "lucide-react";

export const Header = ({
  onPreviewToggle,
  isPreviewMode,
  onAIToggle,
  onVersionToggle,
  onSave,
  onNewCV,
  onExportPDF,
  cvNumber,
  cvData,
  selectedTemplate,
  isSaving,
  isAnalyzing,
  atsScore,
  onOpenAIChat,
  cvId
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isAIHovered, setIsAIHovered] = useState(false);

  /**
   * Handle PDF export with loading state
   */
  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await onExportPDF();
    } catch (err) {
      console.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">CV Builder</h1>
          <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-[#002147] rounded-md text-sm font-semibold font-mono">
            #{cvNumber}
          </span>
        </div>

        {/* ATS Score Display */}
        {atsScore !== null && atsScore !== undefined && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">ATS</span>
            <span
              className={`text-sm font-bold ${
                atsScore >= 85
                  ? "text-green-600"
                  : atsScore >= 70
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {atsScore}%
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* AI Assistant Button - Large Round Icon Only */}
        <button
          onClick={onOpenAIChat}
          onMouseEnter={() => setIsAIHovered(true)}
          onMouseLeave={() => setIsAIHovered(false)}
          disabled={isSaving}
          className="relative w-11 h-11 rounded-full bg-gradient-to-br from-[#002147] to-[#003d7a] hover:from-[#003d7a] hover:to-[#002147] flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:scale-105"
          title="AI Assistant"
        >
          <Bot
            className={`w-5 h-5 text-white transition-transform duration-300 ${
              isAIHovered ? "rotate-12 scale-110" : ""
            }`}
          />
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-white"></div>
        </button>

        {/* Version Manager Button */}
        <button
          onClick={onVersionToggle}
          disabled={isSaving}
          className="px-4 py-2 rounded-md bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 hover:border-gray-400"
          title="Manage CV versions"
        >
          <GitBranch className="w-4 h-4" />
          <span>Versions</span>
        </button>

        {/* Preview Toggle Button */}
        <button
          onClick={onPreviewToggle}
          disabled={isSaving}
          className={`px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isPreviewMode
              ? "bg-[#002147] hover:bg-[#003d7a] text-white"
              : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400"
          }`}
          title={isPreviewMode ? "Hide preview" : "Show preview"}
        >
          <Eye className="w-4 h-4" />
          <span>Preview</span>
        </button>

        <div className="w-px h-6 bg-gray-300" />

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-4 py-2 rounded-md bg-[#002147] hover:bg-[#003d7a] text-white font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Save current CV"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save</span>
            </>
          )}
        </button>

        {/* Export PDF Button */}
        <button
          onClick={handleExportPDF}
          disabled={isSaving || isExporting || !cvId}
          title={!cvId ? "Save CV first to export" : "Export CV as PDF"}
          className="px-4 py-2 rounded-md bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 hover:border-gray-400"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Exporting</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </>
          )}
        </button>

        {/* New CV Button */}
        <button
          onClick={onNewCV}
          disabled={isSaving}
          className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Create new CV"
        >
          <Plus className="w-4 h-4" />
          <span>New CV</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
