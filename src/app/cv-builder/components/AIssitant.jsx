// components/AIAssistant.jsx - PRODUCTION READY VERSION WITH AUTO-FILL
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { 
  X, Bot, Send, Lightbulb, Wand2, FileText, Target, 
  Sparkles, CheckCircle, AlertCircle, Loader2, TrendingUp,
  Plus, Edit, Trash2, Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { useCVData } from '../page';

export const AIAssistant = ({ onClose, activeSection }) => {
  const { cvData, updateCVData } = useCVData();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm your AI CV Assistant. I can help you:

• **Analyze** your entire CV for improvements
• **Enhance** your language and tone
• **Generate** content for any section
• **Tailor** your CV for specific roles
• **Optimize** for ATS (Applicant Tracking Systems)

What would you like help with today?`,
      timestamp: new Date()
    }
  ]);
  const [analysisMode, setAnalysisMode] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  const aiSuggestions = [
    {
      icon: TrendingUp,
      title: 'Analyze Full CV',
      description: 'Get comprehensive feedback',
      prompt: 'Please analyze my entire CV and provide detailed feedback on all sections'
    },
    {
      icon: Wand2,
      title: 'Enhance Current Section',
      description: `Improve ${activeSection} section`,
      prompt: `Enhance my ${activeSection} section with better language and formatting`
    },
    {
      icon: Target,
      title: 'Tailor for Role',
      description: 'Customize for specific position',
      prompt: 'Help me tailor this CV for [specify role/company]'
    },
    {
      icon: FileText,
      title: 'Generate Content',
      description: 'Create bullet points',
      prompt: `Generate professional content for my ${activeSection} section`
    },
    {
      icon: Sparkles,
      title: 'ATS Optimization',
      description: 'Optimize for ATS systems',
      prompt: 'Analyze and optimize my CV for Applicant Tracking Systems'
    },
    {
      icon: Lightbulb,
      title: 'Quick Tips',
      description: 'Get actionable suggestions',
      prompt: `Give me 5 quick tips to improve my ${activeSection} section`
    }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSuggestionClick = (prompt) => {
    setMessage(prompt);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setShowSuggestions(false);

    // Add user message to chat
    setChatHistory(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    setIsLoading(true);

    try {
      const response = await fetch('/api/cv/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          cvData,
          activeSection,
          chatHistory: chatHistory.slice(-5) // Last 5 messages for context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      // Add AI response to chat (MODIFIED: use structuredContent)
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        suggestions: data.suggestions,
        sectionUpdates: data.structuredContent, // CHANGED: from data.sectionUpdates
        timestamp: new Date()
      }]);

      // Handle section updates if provided
      if (data.structuredContent && data.applyUpdates) {
        handleApplySuggestion(data.structuredContent);
      }

    } catch (error) {
      console.error('AI Assistant Error:', error);
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ I apologize, but I encountered an error. Please try again or rephrase your request.',
        isError: true,
        timestamp: new Date()
      }]);
      toast.error('Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };

  // MODIFIED: Enhanced apply suggestion handler
  const handleApplySuggestion = (contentData) => {
    try {
      if (!contentData) {
        toast.error('No suggestions to apply');
        return;
      }

      let applied = false;

      // Apply structured content based on section
      Object.entries(contentData).forEach(([section, data]) => {
        if (data && section !== 'timestamp') {
          if (Array.isArray(data)) {
            // For array-based sections (education, experience, etc.)
            const currentData = cvData[section] || [];
            
            // Update first item or create new one
            if (currentData.length > 0) {
              const updatedData = currentData.map((item, idx) => {
                if (idx === 0 && data[0]) {
                  // Merge AI suggestions with existing data
                  return { ...item, ...data[0] };
                }
                return item;
              });
              updateCVData(section, updatedData);
              applied = true;
            }
          } else {
            // For object-based sections (personal)
            const currentData = cvData[section] || {};
            updateCVData(section, { ...currentData, ...data });
            applied = true;
          }
        }
      });

      if (applied) {
        toast.success('AI suggestions applied successfully!');
      } else {
        toast.info('No changes to apply');
      }
    } catch (error) {
      console.error('Error applying suggestions:', error);
      toast.error('Failed to apply suggestions');
    }
  };

  const handleAnalyzeCV = async () => {
    setIsLoading(true);
    setAnalysisMode('full');

    try {
      const response = await fetch('/api/cv/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvData,
          analysisType: 'comprehensive'
        })
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();

      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: data.analysis,
        score: data.score,
        strengths: data.strengths,
        improvements: data.improvements,
        atsScore: data.atsScore,
        timestamp: new Date()
      }]);

      toast.success('CV analysis completed!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze CV');
    } finally {
      setIsLoading(false);
      setAnalysisMode(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTimestamp = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cvBorder bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold cv-heading">AI CV Assistant</h2>
              <p className="text-xs text-gray-500">Powered by Gemini AI</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAnalyzeCV}
              disabled={isLoading}
              className="text-blue-600 hover:bg-blue-50"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Analyze CV
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {showSuggestions && chatHistory.length === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {aiSuggestions.map((suggestion, index) => {
                const Icon = suggestion.icon;
                return (
                  <Card
                    key={index}
                    className="cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-300"
                    onClick={() => handleSuggestionClick(suggestion.prompt)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold cv-heading text-sm mb-1">
                            {suggestion.title}
                          </h4>
                          <p className="text-xs cv-body text-gray-600">
                            {suggestion.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : msg.isError
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center space-x-2 mb-2">
                    <Bot className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-semibold text-gray-500">AI Assistant</span>
                  </div>
                )}

                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap cv-body">{msg.content}</p>
                </div>

                {msg.score && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Overall Score</span>
                      <span className="text-2xl font-bold text-blue-600">{msg.score}%</span>
                    </div>
                    {msg.atsScore && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">ATS Score</span>
                        <span className="text-xl font-bold text-green-600">{msg.atsScore}%</span>
                      </div>
                    )}
                  </div>
                )}

                {msg.strengths && msg.strengths.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-semibold text-green-700 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Strengths
                    </p>
                    <ul className="text-sm space-y-1">
                      {msg.strengths.map((strength, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {msg.improvements && msg.improvements.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-semibold text-orange-700 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Areas for Improvement
                    </p>
                    <ul className="text-sm space-y-1">
                      {msg.improvements.map((improvement, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-orange-500 mr-2">•</span>
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {msg.sectionUpdates && (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      onClick={() => handleApplySuggestion(msg.sectionUpdates)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Apply Suggestions
                    </Button>
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-400">
                  {formatTimestamp(msg.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="text-sm cv-body">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-cvBorder bg-white">
          <div className="flex space-x-2">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about improving your CV... (Press Enter to send, Shift+Enter for new line)"
              className="flex-1 min-h-[80px] max-h-[120px] border-cvBorder focus:border-blue-500 resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 self-end"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>Currently editing: <strong>{activeSection}</strong> section</span>
            <span className="flex items-center">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-powered suggestions
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};