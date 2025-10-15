"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Copy, Check, Sparkles, Download, CheckCircle } from 'lucide-react';
import { useCVData } from '../page';
import { toast } from 'sonner';

export default function AIAnalysisChatPopup({ onClose, cvData, activeSection }) {
  const { updateCVData } = useCVData();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const initialMessage = generateInitialMessage();
    setMessages([initialMessage]);
    inputRef.current?.focus();
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
    
    let greeting = '👋 Hello! I\'m your AI CV Assistant.\n\n';
    
    if (filledSections.length === 0) {
      greeting += '🚀 I see you\'re just starting your CV. Let me help you build an impressive resume!\n\n';
      greeting += '**I can help you with:**\n';
      greeting += '• Write professional summaries and descriptions\n';
      greeting += '• Generate content for any section\n';
      greeting += '• Analyze and improve your CV\n';
      greeting += '• Answer any CV or career questions\n';
      greeting += '• Optimize for ATS systems\n\n';
      greeting += '**Try asking me:**\n';
      greeting += '• "Write me a professional summary"\n';
      greeting += '• "How do I make my resume stand out?"\n';
      greeting += '• "Generate bullet points for my experience"\n';
      greeting += '• Or any other question!\n\n';
      greeting += '💬 What would you like help with today?';
    } else if (emptySections.length > 0) {
      greeting += `Great! I can see you've filled in: **${filledSections.join(', ')}**. 🎉\n\n`;
      greeting += `**Still need:** ${emptySections.join(', ')}\n\n`;
      greeting += '**I can help you:**\n';
      greeting += '• Analyze what you have and suggest improvements\n';
      greeting += '• Generate content for missing sections\n';
      greeting += '• Improve your writing and language\n';
      greeting += '• Answer any questions about CV best practices\n\n';
      greeting += '💬 What would you like me to do?';
    } else {
      greeting += 'Your CV looks complete! 🎉\n\n';
      greeting += '**I can help you:**\n';
      greeting += '• Analyze your full CV comprehensively\n';
      greeting += '• Improve specific sections\n';
      greeting += '• Optimize for ATS\n';
      greeting += '• Tailor for specific roles\n';
      greeting += '• Answer any career or CV questions\n\n';
      greeting += '💬 What would you like help with?';
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
    { 
      label: 'Write Professional Summary', 
      prompt: 'Write me a compelling professional summary based on my background',
      icon: '✍️' 
    },
    { 
      label: 'Analyze My CV', 
      prompt: 'Analyze my entire CV and give me detailed feedback on all sections',
      icon: '📊' 
    },
    { 
      label: 'Improve Current Section', 
      prompt: `Analyze my ${activeSection} section and suggest specific improvements`,
      icon: '🔧' 
    },
    { 
      label: 'Generate Bullet Points', 
      prompt: `Generate professional bullet points for my ${activeSection} section`,
      icon: '📝' 
    },
    { 
      label: 'ATS Optimization Tips', 
      prompt: 'How can I optimize my CV for Applicant Tracking Systems?',
      icon: '🎯' 
    },
    { 
      label: 'Career Advice', 
      prompt: 'Give me advice on how to improve my career prospects',
      icon: '💡' 
    }
  ];

  const handleQuickAction = (prompt) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const addMessage = (msg) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString() + Math.random(),
      role: msg.role,
      content: msg.content,
      timestamp: new Date(),
      autoApplyContent: msg.autoApplyContent || null,
      analysis: msg.analysis || null
    }]);
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
        autoApplyContent: data.autoApplyContent,
        analysis: data.analysis
      });

    } catch (error) {
      console.error('Chat error:', error);
      addMessage({
        role: 'assistant',
        content: `❌ I apologize, but I encountered an error. Please try again or rephrase your question. I'm here to help!`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyContent = (autoApplyContent) => {
    try {
      const { section, content, type } = autoApplyContent;
      
      if (type === 'summary' && section === 'personal') {
        const updatedPersonal = {
          ...cvData.personal,
          summary: content
        };
        updateCVData('personal', updatedPersonal);
        toast.success('Professional summary applied! Check the Personal Info section.');
      } 
      else if (type === 'bullets' || type === 'description') {
        if (section === 'experience' && cvData.experience.length > 0) {
          const updatedExperience = [...cvData.experience];
          updatedExperience[0] = {
            ...updatedExperience[0],
            description: content
          };
          updateCVData('experience', updatedExperience);
          toast.success('Content applied to your Experience section!');
        } 
        else if (section === 'projects' && cvData.projects.length > 0) {
          const updatedProjects = [...cvData.projects];
          updatedProjects[0] = {
            ...updatedProjects[0],
            description: content
          };
          updateCVData('projects', updatedProjects);
          toast.success('Content applied to your Projects section!');
        }
        else {
          toast.info('Content generated! Copy and paste it into your CV.');
        }
      }
      else if (type === 'skills_list' && section === 'skills') {
        const skillsArray = content.split(',').map(s => s.trim());
        const updatedSkills = [{
          id: Date.now().toString(),
          name: 'AI Suggested Skills',
          skills: skillsArray
        }];
        updateCVData('skills', updatedSkills);
        toast.success('Skills applied! Check the Skills section.');
      }
      else {
        toast.info('Content is ready! Copy it from the chat and paste into your CV.');
      }
    } catch (error) {
      console.error('Error applying content:', error);
      toast.error('Failed to apply content. Please copy and paste manually.');
    }
  };

  const copyToClipboard = (text, id) => {
    // Remove markdown formatting for clean copy
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/✍️|💡|📊|🔧|📝|🎯|✓|❌|⚠️/g, '')
      .replace(/---/g, '')
      .trim();
    
    navigator.clipboard.writeText(cleanText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copied to clipboard!');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI CV Assistant</h2>
              <p className="text-sm text-blue-100">Ask me anything about your CV</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-3xl ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-lg rounded-tr-none' 
                  : 'bg-white text-gray-800 rounded-lg rounded-tl-none border border-gray-200 shadow-sm'
              } p-4`}>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap break-words">
                  {msg.content.split('\n').map((line, i) => {
                    // Format bold text
                    if (line.includes('**')) {
                      const parts = line.split('**');
                      return (
                        <div key={i} className={`${msg.role === 'user' ? '' : 'font-semibold text-blue-700'} mb-1`}>
                          {parts.map((part, idx) => (
                            idx % 2 === 0 ? part : <strong key={idx}>{part}</strong>
                          ))}
                        </div>
                      );
                    }
                    // Format bullet points
                    if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                      return (
                        <div key={i} className="ml-2 mb-1">{line}</div>
                      );
                    }
                    return <div key={i} className="mb-1">{line || <br />}</div>;
                  })}
                </div>
                
                {/* Auto-Apply Button */}
                {msg.autoApplyContent && msg.role === 'assistant' && (
                  <div className="mt-4 pt-3 border-t border-gray-200 flex gap-2">
                    <button
                      onClick={() => handleApplyContent(msg.autoApplyContent)}
                      className="flex items-center gap-2 text-sm bg-green-50 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Apply to CV
                    </button>
                    <button
                      onClick={() => copyToClipboard(msg.autoApplyContent.content, msg.id + '-apply')}
                      className="flex items-center gap-2 text-sm bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition"
                    >
                      {copiedId === msg.id + '-apply' ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Regular Copy Button */}
                {!msg.autoApplyContent && msg.role === 'assistant' && msg.content.length > 100 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="flex items-center gap-2 text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100 transition"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy Response
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
                  <span className="text-sm text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          {messages.length === 1 && !isLoading && (
            <div className="grid grid-cols-2 gap-3 mt-6">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAction(action.prompt)}
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
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me anything... (Shift+Enter for new line, Enter to send)"
              disabled={isLoading}
              rows={2}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 resize-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 self-end"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
          <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
            <span>Currently editing: <strong>{activeSection}</strong> section</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Powered by Gemini AI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}