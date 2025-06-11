/* eslint-disable react/jsx-no-undef */
"use client"

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
//import { TopBar } from './TopBar';
import { TiptapEditor } from './components/TiptapEditor';
//import { VersionPanel } from './VersionPanel';
import { AIInsights } from './components/AIInsights';
import { BookOpen, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Target } from 'lucide-react';



const EssayWorkspace = () => {
  const [essays, setEssays] = useState([
    {
      id: '1',
      schoolName: 'Harvard Business School',
      prompt: 'As we review your application, what more would you like us to know as we consider your candidacy for the Harvard Business School MBA program?',
      content: '',
      wordCount: 0,
      wordLimit: 900,
      lastModified: new Date(),
      versions: []
    },
    {
      id: '2',
      schoolName: 'Stanford Graduate School of Business',
      prompt: 'What matters most to you, and why? (350 words)',
      content: '',
      wordCount: 0,
      wordLimit: 350,
      lastModified: new Date(),
      versions: []
    },
    {
      id: '3',
      schoolName: 'Wharton School',
      prompt: 'How do you plan to use the Wharton MBA to achieve your future professional goals? You might consider your past experience, short and long-term goals, and resources available at Wharton. (500 words)',
      content: '',
      wordCount: 0,
      wordLimit: 500,
      lastModified: new Date(),
      versions: []
    }
  ]);

  const [expandedEssays, setExpandedEssays] = useState(new Set(['1']));
  const [showVersionPanel, setShowVersionPanel] = useState(false);
  const [activeEssayId, setActiveEssayId] = useState('1');
  const [aiInsightsEnabled, setAiInsightsEnabled] = useState(true);

  const toggleEssayExpansion = (essayId) => {
    const newExpanded = new Set(expandedEssays);
    if (newExpanded.has(essayId)) {
      newExpanded.delete(essayId);
    } else {
      newExpanded.add(essayId);
      setActiveEssayId(essayId);
    }
    setExpandedEssays(newExpanded);
  };

  const updateEssayContent = (essayId, content, wordCount) => {
    setEssays(prev => prev.map(essay => 
      essay.id === essayId 
        ? { ...essay, content, wordCount, lastModified: new Date() }
        : essay
    ));
  };

  const getWordCountStatus = (wordCount, target) => {
    const percentage = (wordCount / target) * 100;
    if (percentage < 80) return 'good';
    if (percentage < 100) return 'warning';
    return 'danger';
  };

  const detectSimilarity = (content, essayId) => {
    const otherEssays = essays.filter(e => e.id !== essayId && e.content);
    const similarities = [];

    otherEssays.forEach(essay => {
      const words1 = content.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const words2 = essay.content.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      
      const commonWords = words1.filter(word => words2.includes(word));
      const similarity = Math.round((commonWords.length / Math.max(words1.length, 1)) * 100);
      
      if (similarity > 20) {
        similarities.push({
          schoolName: essay.schoolName,
          percentage: similarity
        });
      }
    });

    return similarities;
  };

  return (
    <div className="min-h-screen bg-essay-gray-50">
        {/**<TopBar 
        aiInsightsEnabled={aiInsightsEnabled}
        onToggleAI={() => setAiInsightsEnabled(!aiInsightsEnabled)}
        onShowVersions={() => setShowVersionPanel(!showVersionPanel)}
      /> */}
      
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-10 animate-slide-up">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-essay-navy mb-4">
              Craft Essays That Open Doors
            </h1>
            <p className="text-lg text-essay-gray-600 max-w-2xl mx-auto">
              Create compelling narratives for your MBA applications with AI-powered insights, 
              intelligent suggestions, and professional-grade editing tools.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Essays Section */}
          <div className="lg:col-span-2 space-y-6">
            {essays.map((essay, index) => {
              const isExpanded = expandedEssays.has(essay.id);
              const wordCountStatus = getWordCountStatus(essay.wordCount, essay.wordLimit);
              const similarities = detectSimilarity(essay.content, essay.id);

              return (
                <Card 
                  key={essay.id} 
                  className="glass-card hover:shadow-premium-lg smooth-transition animate-scale-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-6">
                    {/* Essay Header */}
                    <div 
                      className="flex items-center justify-between cursor-pointer group"
                      onClick={() => toggleEssayExpansion(essay.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-xl accent-gradient flex items-center justify-center shadow-premium">
                          <BookOpen className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-essay-navy group-hover:text-essay-blue smooth-transition">
                            {essay.schoolName}
                          </h3>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-2">
                              <Target className="h-4 w-4 text-essay-gray-400" />
                              <span className={`text-sm font-medium ${
                                wordCountStatus === 'danger' ? 'text-essay-error' :
                                wordCountStatus === 'warning' ? 'text-essay-warning' :
                                'text-essay-gray-600'
                              }`}>
                                {essay.wordCount} / {essay.wordLimit} words
                              </span>
                            </div>
                            {similarities.length > 0 && (
                              <Badge 
                                variant="outline" 
                                className="text-xs border-essay-warning/30 text-essay-warning bg-essay-warning/5"
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Similarity detected
                              </Badge>
                            )}
                            {essay.content && (
                              <Badge 
                                variant="outline" 
                                className="text-xs border-essay-success/30 text-essay-success bg-essay-success/5"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                In progress
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="hover:bg-essay-blue/10 text-essay-gray-400 hover:text-essay-blue"
                      >
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </Button>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="mt-8 animate-fade-in">
                        {/* Prompt Display */}
                        <div className="mb-6 p-6 bg-essay-gray-50 rounded-xl border-l-4 border-essay-blue">
                          <p className="text-sm text-essay-gray-600 leading-relaxed">
                            <span className="font-semibold text-essay-navy">Prompt:</span> {essay.prompt}
                          </p>
                        </div>
                        
                        <Separator className="my-6" />
                        
                        {/* Tiptap Editor */}
                        <TiptapEditor
                          content={essay.content}
                          onChange={(content, wordCount) => updateEssayContent(essay.id, content, wordCount)}
                          placeholder={`Begin your ${essay.schoolName} essay here...`}
                          limit={essay.wordLimit}
                        />

                        {/* Similarity Warning */}
                        {similarities.length > 0 && (
                          <div className="mt-6 p-4 bg-essay-warning/5 border border-essay-warning/20 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <AlertTriangle className="h-5 w-5 text-essay-warning" />
                              <h4 className="font-semibold text-essay-warning">Content Similarity Alert</h4>
                            </div>
                            <p className="text-sm text-essay-gray-600">
                              This content shows {similarities[0].percentage}% similarity with your {similarities[0].schoolName} essay. 
                              Consider revising to ensure each application tells a unique story.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {aiInsightsEnabled && (
              <AIInsights 
                essays={essays}
                activeEssayId={activeEssayId}
              />
            )}
            
            {/*showVersionPanel && activeEssayId && (
              <VersionPanel 
                essay={essays.find(e => e?.id === activeEssayId)!
                onClose={() => setShowVersionPanel(false)}
              />
            )*/}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EssayWorkspace;