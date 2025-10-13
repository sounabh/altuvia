// components/Header.jsx - UPDATED VERSION
import React, { useState } from "react";
import {
  Eye,
  Bot,
  GitBranch,
  Download,
  Save,
  Plus,
  Loader2,
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
      </div>

      <div className="flex items-center space-x-3">
        {/* Version Manager Button */}
        <button
          onClick={onVersionToggle}
          disabled={isSaving}
          className="px-3 py-3 md:px-4 md:py-3 rounded-lg hover:bg-[#3598FE] transition-all duration-700 ease-in-out bg-[#002147] text-white font-inter font-medium text-balance text-[13px] flex items-center justify-center transform hover:rounded-3xl disabled:opacity-50 disabled:cursor-not-allowed"
          title="Manage CV versions"
        >
          <GitBranch className="w-4 h-4 mr-2" />
          Versions
        </button>

        {/* AI Assistant Button */}
        <button
          onClick={onAIToggle}
          disabled={isSaving}
          className="px-3 py-3 md:px-4 md:py-3 rounded-lg hover:bg-[#3598FE] transition-all duration-700 ease-in-out bg-[#002147] text-white font-inter font-medium text-balance text-[13px] flex items-center justify-center transform hover:rounded-3xl disabled:opacity-50 disabled:cursor-not-allowed"
          title="Get AI assistance"
        >
          <Bot className="w-4 h-4 mr-2" />
          AI Assistant
        </button>

        {/* Preview Toggle Button */}
        <button
          onClick={onPreviewToggle}
          disabled={isSaving}
          className={`px-3 py-3 md:px-4 md:py-3 rounded-lg transition-all duration-700 ease-in-out font-inter font-medium text-balance text-[13px] flex items-center justify-center transform hover:rounded-3xl disabled:opacity-50 disabled:cursor-not-allowed ${
            isPreviewMode
              ? "bg-[#002147] text-white hover:bg-[#3598FE]"
              : "bg-[#002147] text-white hover:bg-[#3598FE]"
          }`}
          title={isPreviewMode ? "Hide preview" : "Show preview"}
        >
          <Eye className="w-4 h-4 mr-2" />
          {isPreviewMode ? "Hide Preview" : "Preview"}
        </button>

        <div className="w-px h-6 bg-cvBorder mx-2" />

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-3 py-3 md:px-4 md:py-3 rounded-lg hover:bg-[#3598FE] transition-all duration-700 ease-in-out bg-[#002147] text-white font-inter font-medium text-balance text-[13px] flex items-center justify-center transform hover:rounded-3xl disabled:opacity-50 disabled:cursor-not-allowed"
          title="Save current CV"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save
            </>
          )}
        </button>

        {/* Export PDF Button */}
        <button
          onClick={handleExportPDF}
          disabled={isSaving || isExporting}
          className="px-3 py-3 md:px-4 md:py-3 rounded-lg hover:bg-[#3598FE] transition-all duration-700 ease-in-out bg-[#002147] text-white font-inter font-medium text-balance text-[13px] flex items-center justify-center transform hover:rounded-3xl disabled:opacity-50 disabled:cursor-not-allowed"
          title="Export CV as PDF"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </>
          )}
        </button>

        {/* New CV Button */}
        <button
          onClick={onNewCV}
          disabled={isSaving}
          className="px-3 py-3 md:px-4 md:py-3 rounded-lg hover:bg-green-700 transition-all duration-700 ease-in-out bg-green-600 text-white font-inter font-medium text-balance text-[13px] flex items-center justify-center transform hover:rounded-3xl disabled:opacity-50 disabled:cursor-not-allowed"
          title="Create new CV"
        >
          <Plus className="w-4 h-4 mr-2" />
          New CV
        </button>
      </div>
    </header>
  );
};