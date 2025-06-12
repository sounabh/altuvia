import React from 'react';
import { Eye, Bot, GitBranch, Download, Save, Plus } from 'lucide-react';

export const Header = ({
  onPreviewToggle,
  isPreviewMode,
  onAIToggle,
  onVersionToggle,
}) => {
  return (
    <header className="h-20 bg-white border-b border-cvBorder px-6 flex items-center justify-end shadow-sm">
      <div className="flex items-center space-x-3">
        <button
          onClick={onVersionToggle}
          className="px-3 py-3 md:px-4 md:py-3 rounded-lg hover:bg-[#3598FE] transition-all duration-700 ease-in-out bg-[#002147] text-white font-inter font-medium text-balance text-[13px] flex items-center justify-center transform hover:rounded-3xl"
        >
          <GitBranch className="w-4 h-4 mr-2" />
          Versions
        </button>

        <button
          onClick={onAIToggle}
          className="px-3 py-3 md:px-4 md:py-3 rounded-lg hover:bg-[#3598FE] transition-all duration-700 ease-in-out bg-[#002147] text-white font-inter font-medium text-balance text-[13px] flex items-center justify-center transform hover:rounded-3xl"
        >
          <Bot className="w-4 h-4 mr-2" />
          AI Assistant
        </button>

        <button
          onClick={onPreviewToggle}
          className={`px-3 py-3 md:px-4 md:py-3 rounded-lg transition-all duration-700 ease-in-out font-inter font-medium text-balance text-[13px] flex items-center justify-center transform hover:rounded-3xl ${
            isPreviewMode
              ? 'bg-[#002147] text-white hover:bg-[#3598FE]'
              : 'bg-[#002147] text-white hover:bg-[#3598FE]'
          }`}
        >
          <Eye className="w-4 h-4 mr-2" />
          {isPreviewMode ? 'Hide Preview' : 'Preview'}
        </button>

        <div className="w-px h-6 bg-cvBorder mx-2" />

        <button className="px-3 py-3 md:px-4 md:py-3 rounded-lg hover:bg-[#3598FE] transition-all duration-700 ease-in-out bg-[#002147] text-white font-inter font-medium text-balance text-[13px] flex items-center justify-center transform hover:rounded-3xl">
          <Save className="w-4 h-4 mr-2" />
          Save
        </button>

        <button className="px-3 py-3 md:px-4 md:py-3 rounded-lg hover:bg-[#3598FE] transition-all duration-700 ease-in-out bg-[#002147] text-white font-inter font-medium text-balance text-[13px] flex items-center justify-center transform hover:rounded-3xl">
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </button>

        <button className="px-3 py-3 md:px-4 md:py-3 rounded-lg hover:bg-green-700 transition-all duration-700 ease-in-out bg-green-600 text-white font-inter font-medium text-balance text-[13px] flex items-center justify-center transform hover:rounded-3xl">
          <Plus className="w-4 h-4 mr-2" />
          New CV
        </button>
      </div>
    </header>
  );
};