// components/AIAssistant.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  X, Bot, Send, Lightbulb, Wand2, FileText, Target, 
  Sparkles, CheckCircle, AlertCircle, Loader2, TrendingUp,
  Plus, Edit, Trash2, Copy, Zap, ChevronRight
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
    { icon: TrendingUp, title: 'Analyze Full CV', description: 'Get comprehensive feedback', prompt: 'Please analyze my entire CV and provide detailed feedback on all sections' },
    { icon: Wand2, title: 'Enhance Current Section', description: `Improve ${activeSection} section`, prompt: `Enhance my ${activeSection} section with better language and formatting` },
    { icon: Target, title: 'Tailor for Role', description: 'Customize for specific position', prompt: 'Help me tailor this CV for [specify role/company]' },
    { icon: FileText, title: 'Generate Content', description: 'Create bullet points', prompt: `Generate professional content for my ${activeSection} section` },
    { icon: Sparkles, title: 'ATS Optimization', description: 'Optimize for ATS systems', prompt: 'Analyze and optimize my CV for Applicant Tracking Systems' },
    { icon: Lightbulb, title: 'Quick Tips', description: 'Get actionable suggestions', prompt: `Give me 5 quick tips to improve my ${activeSection} section` }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus();
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

    setChatHistory(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/cv/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          cvData,
          activeSection,
          chatHistory: chatHistory.slice(-5)
        })
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const data = await response.json();

      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        suggestions: data.suggestions,
        sectionUpdates: data.structuredContent,
        timestamp: new Date()
      }]);

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

  const handleApplySuggestion = (contentData) => {
    try {
      if (!contentData) {
        toast.error('No suggestions to apply');
        return;
      }

      let applied = false;

      Object.entries(contentData).forEach(([section, data]) => {
        if (data && section !== 'timestamp') {
          if (Array.isArray(data)) {
            const currentData = cvData[section] || [];
            if (currentData.length > 0) {
              const updatedData = currentData.map((item, idx) => {
                if (idx === 0 && data[0]) return { ...item, ...data[0] };
                return item;
              });
              updateCVData(section, updatedData);
              applied = true;
            }
          } else {
            const currentData = cvData[section] || {};
            updateCVData(section, { ...currentData, ...data });
            applied = true;
          }
        }
      });

      if (applied) toast.success('AI suggestions applied successfully!');
      else toast.info('No changes to apply');
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
        body: JSON.stringify({ cvData, analysisType: 'comprehensive' })
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
    return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#002147] flex items-center justify-center shadow-lg shadow-[#002147]/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#002147]">AI CV Assistant</h2>
              <p className="text-[11px] text-slate-500">Powered by Gemini AI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAnalyzeCV}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#3598FE] bg-[#3598FE]/10 rounded-lg hover:bg-[#3598FE]/20 transition-colors disabled:opacity-50"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Analyze CV
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
          {showSuggestions && chatHistory.length === 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
              {aiSuggestions.map((suggestion, index) => {
                const Icon = suggestion.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion.prompt)}
                    className="p-3 bg-white border border-slate-100 rounded-xl hover:border-[#3598FE] hover:shadow-md transition-all text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#3598FE]/10 flex items-center justify-center mb-2 group-hover:bg-[#3598FE]/20 transition-colors">
                      <Icon className="w-4 h-4 text-[#3598FE]" />
                    </div>
                    <h4 className="text-[12px] font-semibold text-[#002147] mb-0.5 group-hover:text-[#3598FE] transition-colors">{suggestion.title}</h4>
                    <p className="text-[11px] text-slate-500">{suggestion.description}</p>
                  </button>
                );
              })}
            </div>
          )}

          {chatHistory.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-[#002147] text-white rounded-br-md shadow-lg shadow-[#002147]/20'
                  : msg.isError
                  ? 'bg-red-50 border border-red-200 rounded-bl-md'
                  : 'bg-white border border-slate-100 rounded-bl-md shadow-sm'
              }`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                    <div className="w-5 h-5 rounded-md bg-[#3598FE]/10 flex items-center justify-center">
                      <Bot className="w-3 h-3 text-[#3598FE]" />
                    </div>
                    <span className="text-[11px] font-semibold text-[#002147]">AI Assistant</span>
                  </div>
                )}

                <div className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</div>

                {msg.score && (
                  <div className="mt-3 p-3 bg-[#3598FE]/5 rounded-xl border border-[#3598FE]/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-semibold text-[#002147]">Overall Score</span>
                      <span className="text-xl font-bold text-[#3598FE]">{msg.score}%</span>
                    </div>
                    {msg.atsScore && (
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-semibold text-[#002147]">ATS Score</span>
                        <span className="text-lg font-bold text-green-600">{msg.atsScore}%</span>
                      </div>
                    )}
                  </div>
                )}

                {msg.strengths && msg.strengths.length > 0 && (
                  <div className="mt-3 p-3 bg-green-50 rounded-xl">
                    <p className="text-[11px] font-bold text-green-700 flex items-center gap-1 mb-2">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Strengths
                    </p>
                    <ul className="space-y-1">
                      {msg.strengths.map((strength, i) => (
                        <li key={i} className="text-[12px] text-green-800 flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-green-500 mt-1.5 shrink-0"></span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {msg.improvements && msg.improvements.length > 0 && (
                  <div className="mt-2 p-3 bg-amber-50 rounded-xl">
                    <p className="text-[11px] font-bold text-amber-700 flex items-center gap-1 mb-2">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Areas for Improvement
                    </p>
                    <ul className="space-y-1">
                      {msg.improvements.map((improvement, i) => (
                        <li key={i} className="text-[12px] text-amber-800 flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {msg.sectionUpdates && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleApplySuggestion(msg.sectionUpdates)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-[#002147] text-white rounded-lg hover:bg-[#003167] transition-colors shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Apply Suggestions
                    </button>
                  </div>
                )}

                <div className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-white/60' : 'text-slate-400'}`}>
                  {formatTimestamp(msg.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#3598FE]" />
                  <span className="text-[12px] text-slate-500">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-100 p-4 bg-white">
          <div className="flex gap-3">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your CV... (Enter to send)"
              className="flex-1 min-h-[70px] max-h-[100px] px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-[#002147] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3598FE]/20 focus:border-[#3598FE] transition-all resize-none"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
              className="px-5 py-2.5 bg-[#002147] text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 self-end shadow-lg shadow-[#002147]/20 hover:bg-[#003167]"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
            <span>Editing: <strong className="text-[#002147]">{activeSection}</strong></span>
            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-[#3598FE]" />AI-powered suggestions</span>
          </div>
        </div>
      </div>
    </div>
  );
};