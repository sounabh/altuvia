"use client"

import React, { useState } from 'react';
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar';
import { CVBuilder } from './components/CVBuilder';
import { PreviewPanel } from './components/PreviewPanel';
import { AIAssistant } from './components/AIssitant';
import { SmartTipsPanel } from './components/SmartTipsPanel';
import { VersionManager } from './components/VersionManager';

const Index = () => {
  const [activeSection, setActiveSection] = useState('personal');
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showVersionManager, setShowVersionManager] = useState(false);

  return (
    <div className="min-h-screen bg-cvLightBg">
      <Header 
        onPreviewToggle={() => setIsPreviewMode(!isPreviewMode)}
        isPreviewMode={isPreviewMode}
        onAIToggle={() => setShowAIAssistant(!showAIAssistant)}
        onVersionToggle={() => setShowVersionManager(!showVersionManager)}
      />
      
      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <Sidebar 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* CV Builder */}
          <div className={`transition-all duration-300 ${isPreviewMode ? 'w-1/2' : 'flex-1'}`}>
            <CVBuilder 
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />
          </div>

          {/* Preview Panel */}
          {isPreviewMode && (
            <div className="w-1/2 border-l border-cvBorder">
              <PreviewPanel 
                selectedTemplate={selectedTemplate}
                onTemplateChange={setSelectedTemplate}
              />
            </div>
          )}
        </div>

        {/* AI Assistant Overlay */}
        {showAIAssistant && (
          <AIAssistant onClose={() => setShowAIAssistant(false)} />
        )}

        {/* Version Manager Overlay */}
        {showVersionManager && (
          <VersionManager onClose={() => setShowVersionManager(false)} />
        )}

        {/* Smart Tips Panel */}
        <SmartTipsPanel 
          activeSection={activeSection}
          isVisible={!isPreviewMode}
        />
      </div>
    </div>
  );
};

export default Index;