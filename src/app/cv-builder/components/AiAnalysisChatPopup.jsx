// app/components/AIAnalysisChatPopup.jsx - COMPLETE FIXED VERSION
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Copy, Check, Sparkles, CheckCircle } from 'lucide-react';
import { useCVData } from '../page';
import { toast } from 'sonner';

/**
 * AIAnalysisChatPopup - Modal chat interface for AI-powered CV assistance
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Callback to close the popup
 * @param {Object} props.cvData - Current CV data
 * @param {string} props.activeSection - Currently active CV section
 * @returns {JSX.Element} AI chat popup component
 */
export default function AIAnalysisChatPopup({ onClose, cvData, activeSection }) {
  // Access global CV data context
  const { updateCVData } = useCVData();
  
  // Chat messages state
  const [messages, setMessages] = useState([]);
  
  // User input state
  const [input, setInput] = useState('');
  
  // Loading state for AI responses
  const [isLoading, setIsLoading] = useState(false);
  
  // Track which message was copied to clipboard
  const [copiedId, setCopiedId] = useState(null);
  
  // Refs for DOM elements
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize chat with greeting message
  useEffect(() => {
    const initialMessage = generateInitialMessage();
    setMessages([initialMessage]);
    inputRef.current?.focus();
  }, []);

  // Scroll to bottom when messages or loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  /**
   * Scrolls chat to the bottom
   */
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Generates the initial greeting message based on CV data
   * @returns {Object} Initial chat message object
   */
  const generateInitialMessage = () => {
    // Check which sections have data
    const filledSections = checkFilledSections();
    const emptySections = checkEmptySections();
    
    let greeting = '👋 Hello! I\'m your AI CV Assistant.\n\n';
    
    // Customize greeting based on CV completion status
    if (filledSections.length === 0) {
      // Empty CV
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
      // Partially filled CV
      greeting += `Great! I can see you've filled in: **${filledSections.join(', ')}**. 🎉\n\n`;
      greeting += `**Still need:** ${emptySections.join(', ')}\n\n`;
      greeting += '**I can help you:**\n';
      greeting += '• Analyze what you have and suggest improvements\n';
      greeting += '• Generate content for missing sections\n';
      greeting += '• Improve your writing and language\n';
      greeting += '• Answer any questions about CV best practices\n\n';
      greeting += '💬 What would you like me to do?';
    } else {
      // Complete CV
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

  /**
   * Checks which CV sections have data
   * @returns {Array} List of filled section names
   */
  const checkFilledSections = () => {
    const filled = [];
    
    // Check personal info
    if (cvData.personal && (cvData.personal.fullName || cvData.personal.email || cvData.personal.summary)) {
      filled.push('Personal Info');
    }
    
    // Check education
    if (cvData.education && cvData.education.some(e => e.institution || e.degree)) {
      filled.push('Education');
    }
    
    // Check experience
    if (cvData.experience && cvData.experience.some(e => e.company || e.position)) {
      filled.push('Experience');
    }
    
    // Check projects
    if (cvData.projects && cvData.projects.some(p => p.name || p.description)) {
      filled.push('Projects');
    }
    
    // Check skills
    if (cvData.skills && cvData.skills.some(s => s.skills && s.skills.length > 0)) {
      filled.push('Skills');
    }
    
    // Check achievements
    if (cvData.achievements && cvData.achievements.some(a => a.title)) {
      filled.push('Achievements');
    }
    
    // Check volunteer experience
    if (cvData.volunteer && cvData.volunteer.some(v => v.organization)) {
      filled.push('Volunteer');
    }
    
    return filled;
  };

  /**
   * Checks which CV sections are empty
   * @returns {Array} List of empty section names
   */
  const checkEmptySections = () => {
    const allSections = ['Personal Info', 'Education', 'Experience', 'Projects', 'Skills', 'Achievements', 'Volunteer'];
    const filled = checkFilledSections();
    return allSections.filter(s => !filled.includes(s));
  };

  /**
   * Pre-defined quick action prompts for user convenience
   */
  const quickActions = [
    { label: 'Write Professional Summary', prompt: 'Write me a compelling professional summary based on my background', icon: '✍️' },
    { label: 'Analyze My CV', prompt: 'Analyze my entire CV and give me detailed feedback on all sections', icon: '📊' },
    { label: 'Improve Current Section', prompt: `Analyze my ${activeSection} section and suggest specific improvements`, icon: '🔧' },
    { label: 'Generate Bullet Points', prompt: `Generate professional bullet points for my ${activeSection} section`, icon: '📝' },
    { label: 'ATS Optimization Tips', prompt: 'How can I optimize my CV for Applicant Tracking Systems?', icon: '🎯' },
    { label: 'Career Advice', prompt: 'Give me advice on how to improve my career prospects', icon: '💡' }
  ];

  /**
   * Handles quick action button clicks
   * @param {string} prompt - The prompt to insert into input
   */
  const handleQuickAction = (prompt) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  /**
   * Adds a new message to the chat history
   * @param {Object} msg - Message object to add
   */
  const addMessage = (msg) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString() + Math.random(),
      role: msg.role,
      content: msg.content,
      timestamp: new Date(),
      structuredContent: msg.structuredContent || null,
      analysis: msg.analysis || null
    }]);
  };

  /**
   * Handles sending user messages to the AI
   * @param {Event} e - Form submit event
   */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    // Don't send empty or during loading
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message to chat
    addMessage({ role: 'user', content: userMessage });
    setIsLoading(true);

    try {
      // Send message to AI API
      const response = await fetch('/api/cv/ai-assist', {
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
      
      console.log('AI Response received:', data);
      
      // Add AI response to chat
      addMessage({
        role: 'assistant',
        content: data.response,
        structuredContent: data.structuredContent,
        analysis: data.analysis
      });

    } catch (error) {
      console.error('Chat error:', error);
      
      // Add error message
      addMessage({
        role: 'assistant',
        content: `❌ I apologize, but I encountered an error. Please try again or rephrase your question. I'm here to help!`
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Applies AI-generated content directly to the CV
   * @param {Object} structuredContent - Structured content from AI
   */
  const handleApplyContent = (structuredContent) => {
    try {
      // Validate structured content
      if (!structuredContent || !structuredContent.section || !structuredContent.data) {
        toast.error('No content to apply');
        return;
      }

      const { section, data } = structuredContent;
      let applied = false;

      console.log('Applying content for section:', section, data);

      // Handle different section types
      switch (section) {
        case 'personal':
          if (data.personal) {
            updateCVData('personal', { ...cvData.personal, ...data.personal });
            applied = true;
            toast.success('Professional summary applied! Check the Personal Info section.');
          }
          break;

        case 'experience':
          if (data.experience && Array.isArray(data.experience)) {
            updateCVData('experience', data.experience);
            applied = true;
            toast.success('Experience details applied! Check the Experience section.');
          }
          break;

        case 'education':
          if (data.education && Array.isArray(data.education)) {
            updateCVData('education', data.education);
            applied = true;
            toast.success('Education details applied! Check the Education section.');
          }
          break;

        case 'projects':
          if (data.projects && Array.isArray(data.projects)) {
            updateCVData('projects', data.projects);
            applied = true;
            toast.success('Project details applied! Check the Projects section.');
          }
          break;

        case 'skills':
          if (data.skills && Array.isArray(data.skills)) {
            updateCVData('skills', data.skills);
            applied = true;
            toast.success('Skills applied! Check the Skills section.');
          }
          break;

        case 'achievements':
          if (data.achievements && Array.isArray(data.achievements)) {
            updateCVData('achievements', data.achievements);
            applied = true;
            toast.success('Achievement details applied! Check the Achievements section.');
          }
          break;

        case 'volunteer':
          if (data.volunteer && Array.isArray(data.volunteer)) {
            updateCVData('volunteer', data.volunteer);
            applied = true;
            toast.success('Volunteer details applied! Check the Volunteer section.');
          }
          break;

        default:
          console.warn('Unknown section:', section);
      }

      if (!applied) {
        toast.info('Content ready to copy! Click the copy button to use it manually.');
      }

    } catch (error) {
      console.error('Error applying content:', error);
      toast.error('Failed to apply content. Please copy and paste manually.');
    }
  };

  /**
   * Copies text to clipboard
   * @param {string} text - Text to copy
   * @param {string} id - Message ID for feedback
   */
  const copyToClipboard = (text, id) => {
    // Clean text of markdown and emojis
    const cleanText = text.replace(/\*\*/g, '').replace(/✍️|💡|📊|🔧|📝|🎯|✓|❌|⚠️/g, '').replace(/---/g, '').trim();
    
    navigator.clipboard.writeText(cleanText);
    setCopiedId(id);
    
    // Reset copied state after 2 seconds
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copied to clipboard!');
  };

  /**
   * Handles Enter key press for sending messages
   * @param {KeyboardEvent} e - Keyboard event
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    /* Overlay background */
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      
      {/* Main chat container */}
      <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header section */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
          
          {/* Left side: Title and icon */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#002147] flex items-center justify-center shadow-lg shadow-[#002147]/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#002147]">AI CV Assistant</h2>
              <p className="text-[11px] text-slate-500">Ask me anything about your CV</p>
            </div>
          </div>
          
          {/* Close button */}
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat messages area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
          
          {/* Render chat messages */}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              {/* Message bubble */}
              <div className={`max-w-[75%] ${
                msg.role === 'user' 
                  ? 'bg-[#002147] text-white rounded-2xl rounded-br-md shadow-lg shadow-[#002147]/20' 
                  : 'bg-white text-slate-700 rounded-2xl rounded-bl-md border border-slate-100 shadow-sm'
              } px-4 py-3`}>
                
                {/* Assistant message header */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                    <div className="w-5 h-5 rounded-md bg-[#3598FE]/10 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-[#3598FE]" />
                    </div>
                    <span className="text-[11px] font-semibold text-[#002147]">AI Assistant</span>
                  </div>
                )}

                {/* Message content with formatting */}
                <div className="text-[13px] leading-relaxed">
                  {msg.content.split('\n').map((line, i) => {
                    // Handle bold text formatting
                    if (line.includes('**')) {
                      const parts = line.split('**');
                      return (
                        <div key={i} className={`${msg.role === 'user' ? '' : 'font-semibold text-[#002147]'} mb-1`}>
                          {parts.map((part, idx) => (idx % 2 === 0 ? part : <strong key={idx}>{part}</strong>))}
                        </div>
                      );
                    }
                    
                    // Handle bullet points
                    if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                      return <div key={i} className="ml-3 mb-1 flex items-start gap-2"><span className="text-[#3598FE]">•</span>{line.replace(/^[•-]\s*/, '')}</div>;
                    }
                    
                    // Regular line
                    return <div key={i} className="mb-1">{line || <br />}</div>;
                  })}
                </div>
                
                {/* Apply to CV button (for structured content) */}
                {msg.structuredContent && msg.role === 'assistant' && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => handleApplyContent(msg.structuredContent)}
                      className="flex items-center gap-1.5 text-[12px] bg-[#002147] text-white px-3 py-1.5 rounded-lg hover:bg-[#003167] transition font-medium shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Apply to CV
                    </button>
                    <button
                      onClick={() => {
                        const contentToCopy = typeof msg.structuredContent.data === 'string' 
                          ? msg.structuredContent.data 
                          : JSON.stringify(msg.structuredContent.data, null, 2);
                        copyToClipboard(contentToCopy, msg.id + '-apply');
                      }}
                      className="flex items-center gap-1.5 text-[12px] bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-[#3598FE]/10 hover:text-[#3598FE] transition"
                    >
                      {copiedId === msg.id + '-apply' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Copy button for regular responses */}
                {!msg.structuredContent && msg.role === 'assistant' && msg.content.length > 100 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="flex items-center gap-1.5 text-[11px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md hover:bg-[#3598FE]/10 hover:text-[#3598FE] transition"
                    >
                      {copiedId === msg.id ? <><Check className="w-3 h-3" />Copied!</> : <><Copy className="w-3 h-3" />Copy Response</>}
                    </button>
                  </div>
                )}

                {/* Message timestamp */}
                <div className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-white/60' : 'text-slate-400'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
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

          {/* Quick action buttons (shown only on initial load) */}
          {messages.length === 1 && !isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="p-3 bg-white border border-slate-100 rounded-xl hover:border-[#3598FE] hover:shadow-md transition-all text-left group"
                >
                  <div className="text-xl mb-1.5">{action.icon}</div>
                  <div className="text-[12px] font-semibold text-[#002147] group-hover:text-[#3598FE] transition-colors">{action.label}</div>
                </button>
              ))}
            </div>
          )}

          {/* Empty div for scrolling to bottom */}
          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-slate-100 p-4 bg-white">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            
            {/* Message textarea */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me anything... (Enter to send, Shift+Enter for new line)"
              disabled={isLoading}
              rows={2}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-[#002147] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3598FE]/20 focus:border-[#3598FE] transition-all resize-none disabled:bg-slate-100"
            />
            
            {/* Send button */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-5 py-2.5 bg-[#002147] text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 self-end shadow-lg shadow-[#002147]/20 hover:bg-[#003167]"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
          
          {/* Footer info */}
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
            <span>Editing: <strong className="text-[#002147]">{activeSection}</strong></span>
            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-[#3598FE]" />Powered by Gemini AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}