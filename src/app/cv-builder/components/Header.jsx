"use client";

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
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";

export const Header = ({
  onPreviewToggle,
  isPreviewMode,
  onVersionToggle,
  onSave,
  onNewCV,
  onExportPDF,
  cvNumber,
  isSaving,
  atsScore,
  onOpenAIChat,
  cvId,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isAIHovered, setIsAIHovered] = useState(false);
  const router = useRouter();

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

  /**
   * Handle New CV button click
   * This should call the onNewCV handler which resets everything in memory
   * NOT navigate to a new route
   */
  const handleNewCV = () => {
    if (onNewCV) {
      onNewCV();
    }
  };

  /**
   * Handle back to dashboard
   * Clear URL parameters to show dashboard
   */
  const handleBackToDashboard = () => {
    // Clear localStorage to ensure fresh state
    localStorage.removeItem("currentCVId");
    localStorage.removeItem("currentCVNumber");
    
    // Navigate to clean dashboard URL
    router.push("/cv-builder");
  };

  return (
    <header className="bg-white border-b border-gray-100 px-5 py-5 flex items-center justify-between">
      {/* Left Section */}
      <div className="flex items-center gap-5">
        {/* Dashboard Navigation Button */}
        <button
          onClick={handleBackToDashboard}
          className="flex items-center gap-2.5 text-gray-700 hover:text-[#002147] hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors group"
          title="Back to Dashboard"
        >
          <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-[#002147] flex items-center justify-center transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
          </div>
          <span className="text-base font-medium">Dashboard</span>
        </button>

        {/* ATS Score */}
        {atsScore !== null && atsScore !== undefined && (
          <>
            <div className="w-px h-5 bg-gray-200" />
            <div className="flex items-center gap-2">
              <TrendingUp
                className={`w-4 h-4 ${
                  atsScore >= 85
                    ? "text-emerald-500"
                    : atsScore >= 70
                    ? "text-amber-500"
                    : "text-rose-500"
                }`}
              />
              <span className="text-sm text-gray-500">ATS</span>
              <span
                className={`text-sm font-bold ${
                  atsScore >= 85
                    ? "text-emerald-600"
                    : atsScore >= 70
                    ? "text-amber-600"
                    : "text-rose-600"
                }`}
              >
                {atsScore}%
              </span>
            </div>
          </>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1.5">
        {/* AI Button */}
        <button
          onClick={onOpenAIChat}
          onMouseEnter={() => setIsAIHovered(true)}
          onMouseLeave={() => setIsAIHovered(false)}
          disabled={isSaving}
          className="relative p-2 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
          title="AI Assistant"
        >
          <Bot
            className={`w-[18px] h-[18px] text-[#002147] transition-transform ${
              isAIHovered ? "scale-110" : ""
            }`}
          />
          <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
        </button>

        <button
          onClick={onVersionToggle}
          disabled={isSaving}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-50"
          title="Versions"
        >
          <GitBranch className="w-[18px] h-[18px]" />
        </button>

        <button
          onClick={onPreviewToggle}
          disabled={isSaving}
          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
            isPreviewMode
              ? "bg-[#002147] text-white"
              : "hover:bg-gray-100 text-gray-600"
          }`}
          title="Preview"
        >
          <Eye className="w-[18px] h-[18px]" />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Primary Actions */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className="h-8 px-3 rounded-lg bg-[#002147] hover:bg-[#0a3161] text-white text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save</span>
        </button>

        <button
          onClick={handleExportPDF}
          disabled={isSaving || isExporting || !cvId}
          title={!cvId ? "Save first" : "Export PDF"}
          className="h-8 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>Export</span>
        </button>

{/**  <button
          onClick={handleNewCV}
          disabled={isSaving}
          className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>New</span>
        </button>*/}
       
      </div>
    </header>
  );
};

Header.displayName = "Header";

export default Header;