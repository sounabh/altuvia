// components/Header.jsx - UPDATED WITH NEW AI CHAT
import React, { useState } from "react";
import {
  Eye,
  Bot,
  GitBranch,
  Download,
  Save,
  Plus,
  Loader2,
  Sparkles,
  TrendingUp,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";

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
}) => {
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Handle PDF export with loading state
   */
  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await onExportPDF();
    } catch (err) {
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="h-20 bg-white border-b border-cvBorder px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-gray-800">CV Builder</h1>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium font-mono">
          #{cvNumber}
        </span>

        {/* ATS Score Display */}
        {atsScore !== null && atsScore !== undefined && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-green-50 to-blue-50 rounded-full border border-green-200">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-700">
              ATS Score:
            </span>
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

      <div className="flex items-center space-x-3">
        {/* AI Chat Button - Primary Action */}
        <button
          onClick={onOpenAIChat}
          disabled={isSaving}
          className="px-4 py-3 rounded-lg hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-inter font-medium text-[13px] flex items-center justify-center gap-2 transform hover:rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          title="Open AI Chat Assistant"
        >
          <MessageCircle className="w-4 h-4" />
          AI Chat
        </button>

        {/* Version Manager Button */}
        <button
          onClick={onVersionToggle}
          disabled={isSaving}
          className="px-3 py-3 md:px-4 md:py-3 rounded-lg hover:bg-[#3598FE] transition-all duration-300 bg-[#002147] text-white font-inter font-medium text-[13px] flex items-center justify-center gap-2 transform hover:rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          title="Manage CV versions"
        >
          <GitBranch className="w-4 h-4" />
          Versions
        </button>

        {/* Preview Toggle Button */}
        <button
          onClick={onPreviewToggle}
          disabled={isSaving}
          className={`px-3 py-3 md:px-4 md:py-3 rounded-lg transition-all duration-300 font-inter font-medium text-[13px] flex items-center justify-center gap-2 transform hover:rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed ${
            isPreviewMode
              ? "bg-[#002147] text-white hover:bg-[#3598FE]"
              : "bg-[#002147] text-white hover:bg-[#3598FE]"
          }`}
          title={isPreviewMode ? "Hide preview" : "Show preview"}
        >
          <Eye className="w-4 h-4" />
          {isPreviewMode ? "Hide Preview" : "Preview"}
        </button>

        <div className="w-px h-6 bg-cvBorder mx-2" />

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-3 py-3 md:px-4 md:py-3 rounded-lg hover:bg-[#3598FE] transition-all duration-300 bg-[#002147] text-white font-inter font-medium text-[13px] flex items-center justify-center gap-2 transform hover:rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          title="Save current CV"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save
            </>
          )}
        </button>

        {/* Export PDF Button */}
        <button
          onClick={handleExportPDF}
          disabled={isSaving || isExporting}
          className="px-3 py-3 md:px-4 md:py-3 rounded-lg hover:bg-[#3598FE] transition-all duration-300 bg-[#002147] text-white font-inter font-medium text-[13px] flex items-center justify-center gap-2 transform hover:rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          title="Export CV as PDF"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export PDF
            </>
          )}
        </button>

        {/* New CV Button */}
        <button
          onClick={onNewCV}
          disabled={isSaving}
          className="px-3 py-3 md:px-4 md:py-3 rounded-lg hover:bg-green-700 transition-all duration-300 bg-green-600 text-white font-inter font-medium text-[13px] flex items-center justify-center gap-2 transform hover:rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          title="Create new CV"
        >
          <Plus className="w-4 h-4" />
          New CV
        </button>
      </div>
    </header>
  );
};

export default Header;