"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Copy, Check, Sparkles } from 'lucide-react';

const AIAnalysisChatPopup = ({ onClose, cvData, activeSection }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisMode, setAnalysisMode] = useState(null);
  const [detailedAnalysis, setDetailedAnalysis] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Check CV data completeness on mount
  useEffect(() => {
    const initialMessage = generateInitialMessage();
    setMessages([initialMessage]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateInitialMessage = () => {
    const filledSections = checkFilledSections();
    const emptySections = checkEmptySections();
    
    let greeting = 'Hello! I\'m your AI CV Assistant. ';
    
    if (filledSections.length === 0) {
      greeting += '🚀 I see you\'re just starting your CV. Let me help you build an impressive resume!\n\n';
      greeting += '**Quick Start Tips:**\n';
      greeting += '• Start with Personal Information (name, email, summary)\n';
      greeting += '• Add your work experience or education\n';
      greeting += '• Include relevant skills and projects\n\n';
      greeting += 'Once you add some content, I can analyze it and provide detailed feedback!';
    } else if (emptySections.length > 0) {
      greeting += `I can see you've filled in: **${filledSections.join(', ')}**. Great start! 🎉\n\n`;
      greeting += `**Missing sections:** ${emptySections.join(', ')}\n\n`;
      greeting += 'I can analyze what you have and suggest improvements, or help you fill in the missing sections. What would you like to do?';
    } else {
      greeting += 'Your CV looks complete! I can provide a comprehensive analysis. What would you like me to do?';
    }
    
    return {
      id: '0',
      role: 'assistant',
      content: greeting,
      timestamp: new Date()
    };
  };

  const checkFilledSections = () => {
    const filled = [];
    
    if (cvData.personal && (cvData.personal.fullName || cvData.personal.email || cvData.personal.summary)) {
      filled.push('Personal Info');
    }
    if (cvData.education && cvData.education.some(e => e.institution || e.degree)) {
      filled.push('Education');
    }
    if (cvData.experience && cvData.experience.some(e => e.company || e.position)) {
      filled.push('Experience');
    }
    if (cvData.projects && cvData.projects.some(p => p.name || p.description)) {
      filled.push('Projects');
    }
    if (cvData.skills && cvData.skills.some(s => s.skills && s.skills.length > 0)) {
      filled.push('Skills');
    }
    if (cvData.achievements && cvData.achievements.some(a => a.title)) {
      filled.push('Achievements');
    }
    if (cvData.volunteer && cvData.volunteer.some(v => v.organization)) {
      filled.push('Volunteer');
    }
    
    return filled;
  };

  const checkEmptySections = () => {
    const allSections = ['Personal Info', 'Education', 'Experience', 'Projects', 'Skills', 'Achievements', 'Volunteer'];
    const filled = checkFilledSections();
    return allSections.filter(s => !filled.includes(s));
  };

  const quickActions = [
    { label: 'Analyze Full CV', value: 'full', icon: '📊' },
    { label: 'Analyze Current Section', value: 'section', icon: '📝' },
    { label: 'ATS Optimization', value: 'ats', icon: '🎯' },
    { label: 'Content Suggestions', value: 'suggestions', icon: '💡' }
  ];

  const handleQuickAction = async (action) => {
    const filledSections = checkFilledSections();
    
    // Check if there's enough data for the requested action
    if (action === 'full' && filledSections.length === 0) {
      addMessage({
        role: 'assistant',
        content: '⚠️ I need some CV data to perform a full analysis. Please fill in at least one section (Personal Info, Experience, or Education) and try again.'
      });
      return;
    }

    if (action === 'section') {
      const sectionMap = {
        personal: 'Personal Info',
        education: 'Education',
        experience: 'Experience',
        projects: 'Projects',
        skills: 'Skills',
        achievements: 'Achievements',
        volunteer: 'Volunteer'
      };
      
      if (!filledSections.includes(sectionMap[activeSection])) {
        addMessage({
          role: 'assistant',
          content: `⚠️ The ${activeSection} section is empty. Please add some content to this section first, then I can analyze it for you.`
        });
        return;
      }
    }

    let prompt = '';
    
    switch(action) {
      case 'full':
        prompt = 'Analyze my entire CV comprehensively, section by section';
        setAnalysisMode('full');
        break;
      case 'section':
        prompt = `Analyze and provide detailed feedback on my ${activeSection} section with specific improvements`;
        setAnalysisMode('section');
        break;
      case 'ats':
        prompt = 'Analyze my CV for ATS optimization and provide keyword recommendations';
        setAnalysisMode('ats');
        break;
      case 'suggestions':
        prompt = `Provide specific content suggestions and improvements for my ${activeSection} section`;
        setAnalysisMode('suggestions');
        break;
    }

    addMessage({
      role: 'user',
      content: prompt
    });

    await processAIRequest(prompt, action);
  };

  const addMessage = (msg) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: msg.role,
      content: msg.content,
      timestamp: new Date(),
      analysis: msg.analysis || null
    }]);
  };

  const processAIRequest = async (userMessage, action) => {
    setIsLoading(true);
    
    try {
      // Determine if we need full analysis or specific analysis
      const analysisType = action === 'full' ? 'comprehensive' : 
                          action === 'section' ? 'section' :
                          action === 'ats' ? 'ats' : 'suggestions';

      const response = await fetch('/api/cv/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvData,
          analysisType,
          targetSection: activeSection
        })
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      setDetailedAnalysis(data);

      // Format response based on analysis type
      let formattedResponse = '';

      if (analysisType === 'comprehensive') {
        formattedResponse = formatComprehensiveAnalysis(data);
      } else if (analysisType === 'section') {
        formattedResponse = formatSectionAnalysis(data, activeSection);
      } else if (analysisType === 'ats') {
        formattedResponse = formatATSAnalysis(data);
      } else {
        formattedResponse = formatSuggestions(data, activeSection);
      }

      addMessage({
        role: 'assistant',
        content: formattedResponse,
        analysis: data
      });

    } catch (error) {
      console.error('Analysis error:', error);
      addMessage({
        role: 'assistant',
        content: `❌ Error during analysis: ${error.message}. Please try again.`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatComprehensiveAnalysis = (data) => {
    const analysis = data.overallAnalysis;
    const sections = data.sectionAnalyses;

    let text = `📋 **COMPREHENSIVE CV ANALYSIS**\n\n`;
    text += `🎯 **Overall Score: ${analysis.overallScore}/100**\n`;
    text += `📊 **ATS Score: ${data.atsScore}/100**\n\n`;
    
    text += `**Summary:**\n${analysis.summary}\n\n`;

    text += `**💪 Key Strengths:**\n`;
    analysis.strengths.forEach(s => text += `• ${s}\n`);

    text += `\n**⚠️ Critical Issues:**\n`;
    analysis.criticalIssues.forEach(i => text += `• ${i}\n`);

    text += `\n**📌 Top Priorities:**\n`;
    analysis.topPriorities.forEach(p => text += `• ${p}\n`);

    text += `\n**🔧 Section Breakdown:**\n`;
    Object.values(sections).forEach(section => {
      const icon = section.score >= 75 ? '✅' : section.score >= 50 ? '⚠️' : '❌';
      text += `\n${icon} **${section.name.toUpperCase()}**: ${section.score}/100\n`;
      text += `${section.feedback}\n`;
    });

    return text;
  };

  const formatSectionAnalysis = (data, section) => {
    const analysis = data.sectionAnalyses[section];
    if (!analysis) return 'Section not found in analysis.';

    let text = `📝 **${section.toUpperCase()} SECTION ANALYSIS**\n\n`;
    text += `📊 **Score: ${analysis.score}/100** (${analysis.status})\n\n`;
    text += `${analysis.feedback}\n\n`;

    text += `**✅ Strengths:**\n`;
    analysis.strengths.forEach(s => text += `• ${s}\n`);

    text += `\n**🔧 Improvements Needed:**\n`;
    analysis.improvements.forEach(i => text += `• ${i}\n`);

    if (analysis.suggestions && analysis.suggestions.length > 0) {
      text += `\n**💡 Specific Suggestions:**\n`;
      analysis.suggestions.forEach(s => text += `• ${s}\n`);
    }

    if (analysis.atsOptimization && analysis.atsOptimization.missingKeywords && analysis.atsOptimization.missingKeywords.length > 0) {
      text += `\n**🎯 Missing Keywords for ATS:**\n`;
      analysis.atsOptimization.missingKeywords.slice(0, 8).forEach(k => text += `• ${k}\n`);
    }

    return text;
  };

  const formatATSAnalysis = (data) => {
    const ats = data;

    let text = `🎯 **ATS OPTIMIZATION ANALYSIS**\n\n`;
    text += `📊 **ATS Score: ${ats.atsScore}/100**\n\n`;

    if (ats.atsScore >= 75) {
      text += `✅ Your CV is well-optimized for ATS systems.\n\n`;
    } else {
      text += `⚠️ Your CV needs ATS optimization. Consider the recommendations below.\n\n`;
    }

    if (ats.recommendations && ats.recommendations.length > 0) {
      text += `**🔧 Recommendations:**\n`;
      ats.recommendations.forEach(r => text += `• ${r}\n`);
    }

    return text;
  };

  const formatSuggestions = (data, section) => {
    const analysis = data.sectionAnalyses[section];
    if (!analysis) return 'No suggestions available.';

    let text = `💡 **CONTENT SUGGESTIONS FOR ${section.toUpperCase()}**\n\n`;

    text += `**🎯 Focus Areas:**\n`;
    analysis.improvements.forEach(i => text += `• ${i}\n`);

    if (analysis.suggestions && analysis.suggestions.length > 0) {
      text += `\n**✍️ Specific Content Improvements:**\n`;
      analysis.suggestions.forEach(s => text += `• ${s}\n`);
    }

    if (analysis.atsOptimization && analysis.atsOptimization.keywords) {
      text += `\n**🔑 Keywords to Include:**\n`;
      analysis.atsOptimization.keywords.slice(0, 10).forEach(k => text += `• ${k}\n`);
    }

    return text;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    addMessage({
      role: 'user',
      content: userMessage
    });

    setIsLoading(true);

    try {
      // Send custom message to AI
      const response = await fetch('/api/cv/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          cvData,
          activeSection,
          chatHistory: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) throw new Error('Failed to process message');

      const data = await response.json();
      addMessage({
        role: 'assistant',
        content: data.response,
        analysis: data.analysis || null
      });

    } catch (error) {
      console.error('Chat error:', error);
      addMessage({
        role: 'assistant',
        content: `❌ Error: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI CV Assistant</h2>
              <p className="text-sm text-blue-100">Detailed section-by-section analysis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          
          {messages.map((msg, idx) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-lg rounded-tr-none' 
                  : 'bg-white text-gray-800 rounded-lg rounded-tl-none border border-gray-200 shadow-sm'
              } p-4`}>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap break-words">
                  {msg.content.split('\n').map((line, i) => {
                    // Format bold text
                    if (line.includes('**')) {
                      return (
                        <div key={i} className={msg.role === 'user' ? '' : 'font-semibold text-blue-700'}>
                          {line.replace(/\*\*/g, '')}
                        </div>
                      );
                    }
                    return <div key={i}>{line}</div>;
                  })}
                </div>
                
                {msg.analysis && msg.role === 'assistant' && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="flex items-center gap-2 text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 transition"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy Analysis
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">AI is analyzing...</span>
                </div>
              </div>
            </div>
          )}

          {messages.length === 1 && !isLoading && (
            <div className="grid grid-cols-2 gap-3 mt-6">
              {quickActions.map(action => (
                <button
                  key={action.value}
                  onClick={() => handleQuickAction(action.value)}
                  className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:shadow-md transition text-left"
                >
                  <div className="text-2xl mb-2">{action.icon}</div>
                  <div className="font-semibold text-blue-900 text-sm">{action.label}</div>
                </button>
              ))}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your CV..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send
            </button>
          </form>
          <div className="text-xs text-gray-500 mt-2">
            Currently analyzing: <strong>{activeSection}</strong> section
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisChatPopup;