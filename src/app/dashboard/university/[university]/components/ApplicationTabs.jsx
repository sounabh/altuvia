"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  MessageSquare,
  Save,
  CheckCircle,
  AlertCircle,
  Calendar,
  BookOpen,
  Plus,
  X,
  CalendarDays,
  MapPin,
  Timer,
  Target,
  CheckCircle2,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  History,
  BarChart3,
  Loader2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Undo2,
  Trash2,
  Copy,
  RefreshCw,
  Lightbulb,
  AlertTriangle,
  Zap,
  Award,
  Edit3,
  RotateCcw,
  Settings,
  PanelRightOpen,
  PanelRightClose,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Layers,
  Brain,
  PieChart,
  TrendingDown,
  Flame,
  Star,
} from "lucide-react";

// ============================================
// EMBEDDED RICH TEXT EDITOR COMPONENT
// ============================================

function EmbeddedEssayEditor({
  content = '',
  onChange,
  wordLimit = 500,
  essayId,
  onSave,
  lastSaved,
  hasUnsavedChanges = false,
  isSaving = false,
  compact = false
}) {
  const editorRef = useRef(null);
  const [currentWordCount, setCurrentWordCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const debounceTimerRef = useRef(null);
  const lastProcessedContentRef = useRef('');
  const isInternalUpdateRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const contentRef = useRef(content);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const countWords = useCallback((text) => {
    if (!text || typeof text !== 'string') return 0;
    const plainText = text
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&[#\w]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return plainText ? plainText.split(' ').filter(word => word.length > 0).length : 0;
  }, []);

  const saveCursorPosition = useCallback(() => {
    if (!editorRef.current) return null;
    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;
      const range = selection.getRangeAt(0);
      return {
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        endContainer: range.endContainer,
        endOffset: range.endOffset
      };
    } catch {
      return null;
    }
  }, []);

  const restoreCursorPosition = useCallback((savedSelection) => {
    if (!savedSelection || !editorRef.current) return;
    try {
      const selection = window.getSelection();
      if (!selection) return;
      const range = document.createRange();
      range.setStart(savedSelection.startContainer, savedSelection.startOffset);
      range.setEnd(savedSelection.endContainer, savedSelection.endOffset);
      selection.removeAllRanges();
      selection.addRange(range);
    } catch {
      const editor = editorRef.current;
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, []);

  const cleanContent = useCallback((html) => {
    if (!html) return '';
    return html
      .replace(/<div><br><\/div>/gi, '<br>')
      .replace(/<div>/gi, '<br>')
      .replace(/<\/div>/gi, '')
      .replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>')
      .replace(/^(<br\s*\/?>)+|(<br\s*\/?>)+$/gi, '')
      .replace(/<br>/gi, '<br/>');
  }, []);

  const handleInput = useCallback(() => {
    if (!editorRef.current || isInternalUpdateRef.current) return;

    const editor = editorRef.current;
    const htmlContent = editor.innerHTML;
    const savedSelection = saveCursorPosition();
    const wordCount = countWords(htmlContent);
    
    setCurrentWordCount(wordCount);

    const cleanedContent = cleanContent(htmlContent);
    if (cleanedContent !== htmlContent) {
      isInternalUpdateRef.current = true;
      editor.innerHTML = cleanedContent;
      isInternalUpdateRef.current = false;
      
      if (savedSelection) {
        requestAnimationFrame(() => {
          restoreCursorPosition(savedSelection);
        });
      }
    }

    lastProcessedContentRef.current = cleanedContent;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (onChangeRef.current && !isInternalUpdateRef.current) {
        onChangeRef.current(cleanedContent, wordCount);
      }
    }, 100);
  }, [cleanContent, countWords, saveCursorPosition, restoreCursorPosition]);

  const handleKeyDown = useCallback((e) => {
    if (!editorRef.current || !isReady) return;

    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          document.execCommand('bold');
          handleInput();
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic');
          handleInput();
          break;
        case 'u':
          e.preventDefault();
          document.execCommand('underline');
          handleInput();
          break;
        case 's':
          e.preventDefault();
          if (onSave) onSave();
          break;
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const selection = window.getSelection();
      if (selection && selection.rangeCount) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const br = document.createElement('br');
        range.insertNode(br);
        range.setStartAfter(br);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        setTimeout(handleInput, 0);
      }
    }
  }, [isReady, handleInput, onSave]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    if (!editorRef.current || !isReady) return;

    const clipboardData = e.clipboardData || window.clipboardData;
    const text = clipboardData?.getData('text/plain');
    if (!text) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const cleanText = text.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(cleanText);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    setTimeout(handleInput, 0);
  }, [isReady, handleInput]);

  const executeCommand = useCallback((command) => {
    if (!editorRef.current || !isReady) return;
    const savedSelection = saveCursorPosition();
    editorRef.current.focus();
    document.execCommand(command, false, undefined);
    if (savedSelection) {
      requestAnimationFrame(() => {
        restoreCursorPosition(savedSelection);
        handleInput();
      });
    } else {
      handleInput();
    }
  }, [isReady, saveCursorPosition, restoreCursorPosition, handleInput]);

  const isCommandActive = useCallback((command) => {
    if (!isReady || !editorRef.current) return false;
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  }, [isReady]);

  // Initialize editor
  useEffect(() => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    editor.contentEditable = 'true';
    editor.spellcheck = true;
    editor.style.outline = 'none';

    const initialContent = cleanContent(content);
    isInternalUpdateRef.current = true;
    editor.innerHTML = initialContent;
    lastProcessedContentRef.current = initialContent;
    isInternalUpdateRef.current = false;

    const wordCount = countWords(initialContent);
    setCurrentWordCount(wordCount);
    setIsReady(true);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle external content changes
  useEffect(() => {
    if (!isReady || !editorRef.current || isInternalUpdateRef.current) return;
    const newContent = cleanContent(content || '');
    if (newContent !== lastProcessedContentRef.current && newContent !== editorRef.current.innerHTML) {
      const editor = editorRef.current;
      const hadFocus = document.activeElement === editor;
      const savedSelection = hadFocus ? saveCursorPosition() : null;
      
      isInternalUpdateRef.current = true;
      editor.innerHTML = newContent;
      lastProcessedContentRef.current = newContent;
      const wordCount = countWords(newContent);
      setCurrentWordCount(wordCount);
      isInternalUpdateRef.current = false;
      
      if (hadFocus && savedSelection) {
        requestAnimationFrame(() => {
          editor.focus();
          restoreCursorPosition(savedSelection);
        });
      }
    }
  }, [content, isReady, cleanContent, countWords, saveCursorPosition, restoreCursorPosition]);

  // Event listeners
  useEffect(() => {
    if (!isReady || !editorRef.current) return;
    const editor = editorRef.current;

    editor.addEventListener('input', handleInput);
    editor.addEventListener('keydown', handleKeyDown);
    editor.addEventListener('paste', handlePaste);

    return () => {
      editor.removeEventListener('input', handleInput);
      editor.removeEventListener('keydown', handleKeyDown);
      editor.removeEventListener('paste', handlePaste);
    };
  }, [isReady, handleInput, handleKeyDown, handlePaste]);

  const wordLimitStatus = {
    percentage: Math.min(100, (currentWordCount / wordLimit) * 100),
    isOverLimit: currentWordCount > wordLimit,
    isNearLimit: currentWordCount > wordLimit * 0.9,
    wordsRemaining: Math.max(0, wordLimit - currentWordCount),
  };

  const ToolbarButton = ({ onClick, isActive, children, title, disabled = false }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled || !isReady}
      className={`h-9 w-9 p-0 rounded-lg transition-all duration-200 ${
        isActive
          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
          : "hover:bg-white/20 text-white/80 hover:text-white"
      } ${disabled || !isReady ? "opacity-50 cursor-not-allowed" : ""} flex items-center justify-center`}
    >
      {children}
    </button>
  );

  return (
    <div className={`border-2 ${isFocused ? 'border-blue-400/50' : 'border-white/20'} rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md transition-all duration-300`}>
      {/* Toolbar */}
      <div className="bg-gradient-to-r from-[#001530] to-[#002550] border-b border-white/20 px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-1.5">
            <ToolbarButton
              onClick={() => executeCommand('bold')}
              isActive={isCommandActive('bold')}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => executeCommand('italic')}
              isActive={isCommandActive('italic')}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => executeCommand('underline')}
              isActive={isCommandActive('underline')}
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-4 h-4" />
            </ToolbarButton>
            
            <div className="w-px h-6 bg-white/20 mx-2"></div>
            
            <ToolbarButton onClick={() => executeCommand('insertUnorderedList')} title="Bullet List">
              <List className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => executeCommand('insertOrderedList')} title="Numbered List">
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>
          </div>

          <div className="flex items-center space-x-3">
            {/* Word Count Display */}
            <div className="flex items-center space-x-3 px-4 py-2 bg-white/10 rounded-xl border border-white/10">
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-bold ${
                  wordLimitStatus.isOverLimit ? 'text-red-400' : 
                  wordLimitStatus.isNearLimit ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {currentWordCount}
                </span>
                <span className="text-white/40">/</span>
                <span className="text-white/60 text-sm">{wordLimit}</span>
              </div>
              <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${Math.min(wordLimitStatus.percentage, 100)}%`,
                    backgroundColor: wordLimitStatus.isOverLimit ? '#EF4444' : 
                      wordLimitStatus.isNearLimit ? '#F59E0B' : '#10B981'
                  }}
                />
              </div>
            </div>

            {/* Save Status */}
            <div className="flex items-center space-x-2">
              {isSaving && (
                <span className="bg-blue-500/30 text-blue-300 text-xs px-3 py-1.5 rounded-lg flex items-center font-medium">
                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  Saving...
                </span>
              )}
              {!isSaving && hasUnsavedChanges && (
                <span className="bg-amber-500/30 text-amber-300 text-xs px-3 py-1.5 rounded-lg font-medium flex items-center">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-1.5 animate-pulse"></div>
                  Unsaved
                </span>
              )}
              {!isSaving && !hasUnsavedChanges && lastSaved && (
                <span className="bg-emerald-500/30 text-emerald-300 text-xs px-3 py-1.5 rounded-lg flex items-center font-medium">
                  <CheckCircle className="w-3 h-3 mr-1.5" />
                  Saved
                </span>
              )}

              {onSave && (
                <button
                  type="button"
                  onClick={onSave}
                  disabled={isSaving}
                  className="h-8 px-4 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-all duration-200 flex items-center font-medium shadow-lg shadow-blue-500/20"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="bg-white relative">
        {!isReady && (
          <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <p className="text-gray-500 font-medium">Initializing editor...</p>
            </div>
          </div>
        )}

        <div
          ref={editorRef}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`${compact ? 'min-h-[380px]' : 'min-h-[480px]'} p-6 text-gray-800 leading-relaxed transition-opacity duration-200 ${
            !isReady ? 'opacity-30' : 'opacity-100'
          }`}
          style={{
            fontSize: '16px',
            lineHeight: '1.8',
            fontFamily: 'Georgia, "Times New Roman", serif',
            outline: 'none',
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          }}
          suppressContentEditableWarning={true}
          role="textbox"
          aria-label="Essay content editor"
          tabIndex={0}
          spellCheck={true}
        />

        {currentWordCount === 0 && isReady && (
          <div className="absolute top-6 left-6 pointer-events-none z-10 text-gray-400">
            <p className="text-lg mb-2">Start writing your essay...</p>
            <p className="text-sm opacity-70">Ctrl+B for bold, Ctrl+I for italic, Ctrl+S to save</p>
          </div>
        )}

        {wordLimitStatus.isOverLimit && (
          <div className="absolute top-4 right-4 p-3 bg-red-50 border border-red-200 rounded-xl z-20 shadow-lg">
            <p className="text-sm font-bold text-red-700 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Over limit by {currentWordCount - wordLimit} words
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// EMBEDDED VERSION MANAGER COMPONENT - ALWAYS VISIBLE ACTIONS
// ============================================

function EmbeddedVersionManager({
  versions = [],
  currentContent,
  onRestoreVersion,
  onDeleteVersion,
  essayId,
  universityName,
  isLoading = false,
  compact = false,
  onClose
}) {
  const [expandedVersion, setExpandedVersion] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleRestore = async (versionId) => {
    setRestoringId(versionId);
    try {
      await onRestoreVersion(versionId);
    } finally {
      setRestoringId(null);
    }
  };

  const handleDelete = async (versionId) => {
    setDeletingId(versionId);
    try {
      await onDeleteVersion(versionId);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/20 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        </div>
        <p className="text-sm text-white/60">Loading versions...</p>
      </div>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
          <Layers className="w-7 h-7 text-white/50" />
        </div>
        <p className="text-sm font-medium text-white/70">No versions yet</p>
        <p className="text-xs text-white/40 mt-1">Versions are created when you save</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${compact ? 'max-h-[280px]' : 'max-h-[380px]'} overflow-y-auto custom-scrollbar pr-1`}>
      {versions.slice(0, compact ? 5 : 10).map((version, index) => (
        <div
          key={version.id}
          className={`p-3 rounded-xl border transition-all duration-200 hover:scale-[1.01] ${
            index === 0 
              ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-400/30 shadow-lg shadow-blue-500/10' 
              : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                <span className="text-sm font-semibold text-white truncate">
                  {version.label || `Version ${versions.length - index}`}
                </span>
                {index === 0 && (
                  <span className="text-[10px] px-2 py-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full font-medium shadow-sm">
                    Current
                  </span>
                )}
                {version.isAutoSave && (
                  <span className="text-[10px] px-2 py-0.5 bg-white/10 text-white/60 rounded-full">
                    Auto
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3 mt-1.5">
                <span className="text-[11px] text-white/50 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDate(version.createdAt)}
                </span>
                <span className="text-[11px] text-white/50 flex items-center">
                  <FileText className="w-3 h-3 mr-1" />
                  {version.wordCount} words
                </span>
              </div>
            </div>

            {/* ALWAYS VISIBLE ACTION BUTTONS */}
            <div className="flex items-center space-x-1 ml-2">
              <button
                onClick={() => setExpandedVersion(expandedVersion === version.id ? null : version.id)}
                className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"
                title="Preview"
              >
                {expandedVersion === version.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              
              {index > 0 && (
                <>
                  <button
                    onClick={() => handleRestore(version.id)}
                    disabled={restoringId === version.id}
                    className="p-2 hover:bg-emerald-500/20 rounded-lg text-emerald-400 hover:text-emerald-300 transition-all disabled:opacity-50"
                    title="Restore this version"
                  >
                    {restoringId === version.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(version.id)}
                    disabled={deletingId === version.id}
                    className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-all disabled:opacity-50"
                    title="Delete version"
                  >
                    {deletingId === version.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Expanded Preview */}
          {expandedVersion === version.id && (
            <div className="mt-3 pt-3 border-t border-white/10 animate-in slide-in-from-top-2 duration-200">
              <div 
                className="text-xs text-white/80 leading-relaxed max-h-40 overflow-y-auto bg-black/20 p-3 rounded-lg"
                dangerouslySetInnerHTML={{ 
                  __html: version.content.substring(0, 500) + (version.content.length > 500 ? '...' : '') 
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// EMBEDDED AI SUGGESTIONS COMPONENT
// ============================================

function EmbeddedAISuggestions({
  content,
  prompt,
  wordCount,
  wordLimit,
  essayId,
  universityName,
  compact = false,
  onClose
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastAnalyzedContent, setLastAnalyzedContent] = useState('');

  const generateLocalSuggestions = useCallback(() => {
    const localSuggestions = [];
    const plainText = (content || '').replace(/<[^>]*>/g, ' ').trim();
    const sentences = plainText.split(/[.!?]+/).filter(s => s.trim());
    const actualWordCount = wordCount || 0;
    
    if (actualWordCount < wordLimit * 0.5 && actualWordCount > 0) {
      localSuggestions.push({
        type: 'structure',
        title: 'Expand Your Content',
        description: `Your essay is at ${Math.round((actualWordCount / wordLimit) * 100)}% of the word limit. Add more specific examples or elaborate on key points.`,
        priority: 'high',
        icon: 'target'
      });
    }

    if (actualWordCount > wordLimit) {
      localSuggestions.push({
        type: 'length',
        title: 'Trim Your Essay',
        description: `You're ${actualWordCount - wordLimit} words over. Focus on removing redundant phrases and tightening your prose.`,
        priority: 'high',
        icon: 'scissors'
      });
    }

    if (sentences.length > 0 && actualWordCount > 0) {
      const avgWordsPerSentence = actualWordCount / sentences.length;
      if (avgWordsPerSentence > 30) {
        localSuggestions.push({
          type: 'clarity',
          title: 'Vary Sentence Length',
          description: 'Some sentences are quite long. Mix in shorter sentences for better rhythm and readability.',
          priority: 'medium',
          icon: 'lightbulb'
        });
      }
    }

    if (plainText && !plainText.toLowerCase().includes('i ') && !plainText.toLowerCase().includes('my ')) {
      localSuggestions.push({
        type: 'voice',
        title: 'Add Personal Touch',
        description: 'Consider adding more first-person perspective to make your essay more authentic and engaging.',
        priority: 'medium',
        icon: 'heart'
      });
    }

    if (actualWordCount >= wordLimit * 0.8 && actualWordCount <= wordLimit) {
      localSuggestions.push({
        type: 'success',
        title: 'Great Progress!',
        description: 'Your word count is in the sweet spot. Focus on polishing and refining your content.',
        priority: 'low',
        icon: 'star'
      });
    }

    setSuggestions(localSuggestions);
    setLastAnalyzedContent(content);
  }, [content, wordCount, wordLimit]);

  const analyzeEssay = useCallback(async () => {
    if (!content || content.length < 50) {
      setSuggestions([]);
      return;
    }

    if (content === lastAnalyzedContent) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/essay/${encodeURIComponent(universityName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayId,
          content,
          prompt,
          wordCount,
          wordLimit
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setLastAnalyzedContent(content);
      } else {
        generateLocalSuggestions();
      }
    } catch (err) {
      generateLocalSuggestions();
    } finally {
      setIsLoading(false);
    }
  }, [content, prompt, wordCount, wordLimit, essayId, universityName, lastAnalyzedContent, generateLocalSuggestions]);

  const getSuggestionConfig = (type, priority) => {
    const configs = {
      structure: { 
        icon: Target, 
        gradient: 'from-orange-500/20 to-red-500/20',
        border: 'border-orange-400/30',
        iconColor: 'text-orange-400'
      },
      clarity: { 
        icon: Lightbulb, 
        gradient: 'from-yellow-500/20 to-amber-500/20',
        border: 'border-yellow-400/30',
        iconColor: 'text-yellow-400'
      },
      voice: { 
        icon: MessageSquare, 
        gradient: 'from-pink-500/20 to-rose-500/20',
        border: 'border-pink-400/30',
        iconColor: 'text-pink-400'
      },
      length: { 
        icon: AlertTriangle, 
        gradient: 'from-red-500/20 to-rose-500/20',
        border: 'border-red-400/30',
        iconColor: 'text-red-400'
      },
      grammar: { 
        icon: Edit3, 
        gradient: 'from-purple-500/20 to-indigo-500/20',
        border: 'border-purple-400/30',
        iconColor: 'text-purple-400'
      },
      success: { 
        icon: Star, 
        gradient: 'from-emerald-500/20 to-teal-500/20',
        border: 'border-emerald-400/30',
        iconColor: 'text-emerald-400'
      },
      default: { 
        icon: Sparkles, 
        gradient: 'from-blue-500/20 to-cyan-500/20',
        border: 'border-blue-400/30',
        iconColor: 'text-blue-400'
      }
    };
    return configs[type] || configs.default;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg">
            <Brain className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-sm font-semibold text-white">AI Assistant</span>
        </div>
        <button
          onClick={analyzeEssay}
          disabled={isLoading || !content || content.length < 50}
          className="text-xs px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 rounded-lg hover:from-amber-500/30 hover:to-orange-500/30 transition-all duration-200 disabled:opacity-50 flex items-center font-medium border border-amber-400/20"
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
          ) : (
            <Sparkles className="w-3 h-3 mr-1.5" />
          )}
          Analyze
        </button>
      </div>

      {isLoading && (
        <div className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <Brain className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
          <p className="text-sm text-white/70 font-medium">Analyzing your essay...</p>
          <p className="text-xs text-white/40 mt-1">This may take a moment</p>
        </div>
      )}

      {!isLoading && suggestions.length === 0 && (
        <div className="p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center">
            <Lightbulb className="w-7 h-7 text-white/40" />
          </div>
          <p className="text-sm font-medium text-white/70">
            {content && content.length >= 50 
              ? 'Click "Analyze" for AI insights'
              : 'Write at least 50 characters'}
          </p>
          <p className="text-xs text-white/40 mt-1">Get personalized suggestions</p>
        </div>
      )}

      {!isLoading && suggestions.length > 0 && (
        <div className={`space-y-2 ${compact ? 'max-h-[220px]' : 'max-h-[320px]'} overflow-y-auto custom-scrollbar pr-1`}>
          {suggestions.map((suggestion, index) => {
            const config = getSuggestionConfig(suggestion.type, suggestion.priority);
            const IconComponent = config.icon;
            
            return (
              <div
                key={index}
                className={`p-3 rounded-xl border bg-gradient-to-r ${config.gradient} ${config.border} transition-all duration-200 hover:scale-[1.01]`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg bg-white/10 ${config.iconColor}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-semibold text-white">{suggestion.title}</p>
                      {suggestion.priority === 'high' && (
                        <Flame className="w-3 h-3 text-orange-400" />
                      )}
                    </div>
                    <p className="text-xs mt-1 text-white/70 leading-relaxed">{suggestion.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-xl">
          <p className="text-xs text-red-300 flex items-center">
            <AlertCircle className="w-3 h-3 mr-1.5" />
            {error}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// EMBEDDED ANALYTICS COMPONENT
// ============================================

function EmbeddedEssayAnalytics({
  essay,
  allEssays = [],
  essayId,
  compact = false,
  onClose
}) {
  const content = essay?.content || '';
  const wordCount = essay?.wordCount || 0;
  const wordLimit = essay?.wordLimit || 500;

  const plainText = content.replace(/<[^>]*>/g, ' ').trim();
  const sentences = plainText.split(/[.!?]+/).filter(s => s.trim()).length;
  const paragraphs = content.split(/<br\s*\/?>/i).filter(p => p.trim()).length || 1;
  const avgWordsPerSentence = sentences > 0 ? Math.round(wordCount / sentences) : 0;

  const readingTimeMinutes = Math.ceil(wordCount / 200);
  const progress = wordCount > 0 ? Math.min(100, Math.round((wordCount / wordLimit) * 100)) : 0;

  const getProgressColor = () => {
    if (wordCount > wordLimit) return '#EF4444';
    if (progress >= 80) return '#10B981';
    if (progress >= 50) return '#F59E0B';
    return '#6B7280';
  };

  const stats = [
    { label: 'Sentences', value: sentences, icon: FileText, color: 'from-blue-500/20 to-cyan-500/20' },
    { label: 'Paragraphs', value: paragraphs, icon: Layers, color: 'from-purple-500/20 to-pink-500/20' },
    { label: 'Avg Words/Sent', value: avgWordsPerSentence, icon: TrendingUp, color: 'from-amber-500/20 to-orange-500/20' },
    { label: 'Read Time', value: `${readingTimeMinutes}m`, icon: Clock, color: 'from-emerald-500/20 to-teal-500/20' },
  ];

  return (
    <div className="space-y-4">
      {/* Main Progress Ring */}
      <div className="flex items-center justify-center p-4 bg-gradient-to-br from-white/5 to-white/10 rounded-2xl border border-white/10">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={getProgressColor()}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${progress * 2.51} 251`}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${
              wordCount > wordLimit ? 'text-red-400' : 
              progress >= 80 ? 'text-emerald-400' : 'text-white'
            }`}>
              {progress}%
            </span>
            <span className="text-[10px] text-white/50 uppercase tracking-wider">Complete</span>
          </div>
        </div>
        
        <div className="ml-4 space-y-1">
          <div className="text-sm text-white/60">Words Written</div>
          <div className="text-2xl font-bold text-white">{wordCount}</div>
          <div className="text-xs text-white/40">of {wordLimit} limit</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div 
              key={index} 
              className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl border border-white/10 transition-all duration-200 hover:scale-[1.02]`}
            >
              <div className="flex items-center space-x-2 mb-1">
                <IconComponent className="w-3.5 h-3.5 text-white/60" />
                <p className="text-[10px] text-white/50 uppercase tracking-wider">{stat.label}</p>
              </div>
              <p className="text-lg font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Writing Quality Indicators */}
      {!compact && wordCount > 0 && (
        <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-400/20">
          <h4 className="text-xs font-bold text-indigo-300 mb-3 flex items-center uppercase tracking-wider">
            <PieChart className="w-3.5 h-3.5 mr-2" />
            Quality Insights
          </h4>
          <div className="space-y-2">
            {avgWordsPerSentence > 25 && (
              <div className="flex items-center space-x-2 text-xs text-white/70">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                <span>Consider shorter sentences for clarity</span>
              </div>
            )}
            {progress < 50 && (
              <div className="flex items-center space-x-2 text-xs text-white/70">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                <span>Add more specific examples</span>
              </div>
            )}
            {paragraphs < 3 && wordCount > 100 && (
              <div className="flex items-center space-x-2 text-xs text-white/70">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                <span>Consider adding paragraph breaks</span>
              </div>
            )}
            {progress >= 80 && progress <= 100 && (
              <div className="flex items-center space-x-2 text-xs text-white/70">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                <span>Excellent word count balance!</span>
              </div>
            )}
            {avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20 && (
              <div className="flex items-center space-x-2 text-xs text-white/70">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                <span>Good sentence length variety</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN APPLICATION TABS COMPONENT
// ============================================

const ApplicationTabs = ({ university }) => {
  const router = useRouter();
  const params = useParams();
  const { data: session, status: sessionStatus } = useSession();

  // ========== EXTRACT USER ID AND UNIVERSITY NAME ==========
  
  const userId = session?.userId || session?.user?.id || null;
  const userEmail = session?.user?.email || null;
  
  const universityNameFromUrl = params?.university 
    ? decodeURIComponent(params.university).replace(/-/g, ' ')
    : null;
  
  const universityName = university?.name || universityNameFromUrl || '';

  // ========== STATE MANAGEMENT ==========
  
  const [activeView, setActiveView] = useState('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState('task');

  const [workspaceData, setWorkspaceData] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState(null);

  const [activeProgramId, setActiveProgramId] = useState(null);
  const [activeEssayPromptId, setActiveEssayPromptId] = useState(null);

  // Panel stack - array of panel names, last one is on top
  const [openPanels, setOpenPanels] = useState([]);

  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isCreatingEssay, setIsCreatingEssay] = useState(false);
  const [isSavingVersion, setIsSavingVersion] = useState(false);

  const autoSaveTimerRef = useRef(null);
  const lastContentRef = useRef('');
  const isUpdatingRef = useRef(false);
  const lastTypingTimeRef = useRef(Date.now());

  // ========== PANEL TOGGLE FUNCTION ==========
  
  const togglePanel = useCallback((panelName) => {
    setOpenPanels(prev => {
      if (prev.includes(panelName)) {
        // Close the panel
        return prev.filter(p => p !== panelName);
      } else {
        // Open the panel and bring to front (add to end)
        return [...prev, panelName];
      }
    });
  }, []);

  const isPanelOpen = useCallback((panelName) => {
    return openPanels.includes(panelName);
  }, [openPanels]);

  const closePanel = useCallback((panelName) => {
    setOpenPanels(prev => prev.filter(p => p !== panelName));
  }, []);

  // ========== DERIVED DATA - FILTER PROGRAMS WITH ESSAYS ==========

  const tasksAndEvents = university?.tasksAndEvents || [];

  // Filter programs to only include those with essays
  const programsWithEssays = useMemo(() => {
    if (!workspaceData?.programs) return [];
    return workspaceData.programs.filter(program => 
      program.essays && program.essays.length > 0
    );
  }, [workspaceData]);

  const currentProgram = useMemo(() => {
    return programsWithEssays.find(p => p.id === activeProgramId);
  }, [programsWithEssays, activeProgramId]);

  const currentEssayData = useMemo(() => {
    return currentProgram?.essays?.find(e => e.promptId === activeEssayPromptId);
  }, [currentProgram, activeEssayPromptId]);

  const currentEssay = useMemo(() => {
    return currentEssayData?.userEssay;
  }, [currentEssayData]);

  // ========== PROGRESS CALCULATION ==========

  const getProgressData = () => {
    if (!university) {
      return {
        overallProgress: 0,
        essayProgress: 0,
        taskProgress: 0,
        completedEssays: 0,
        totalEssays: 0,
        completedTasks: 0,
        totalTasks: 0,
        applicationStatus: 'not-started'
      };
    }

    if (university.enhancedStats) {
      return {
        overallProgress: university.overallProgress || 0,
        essayProgress: university.essayProgress || 0,
        taskProgress: university.taskProgress || 0,
        completedEssays: university.enhancedStats.essays?.completed || 0,
        totalEssays: university.enhancedStats.essays?.total || 0,
        completedTasks: university.enhancedStats.tasks?.completed || 0,
        totalTasks: university.enhancedStats.tasks?.total || 0,
        applicationStatus: university.status || 'not-started',
        upcomingDeadlines: university.upcomingDeadlines || 0,
        overdueEvents: university.overdueEvents || 0
      };
    }

    const essayPrompts = university.allEssayPrompts || [];
    const calendarEvents = university.calendarEvents || [];
    const tasksEvents = university.tasksAndEvents || [];

    const completedEssays = essayPrompts.filter(essay => 
      essay.status === 'COMPLETED' || essay.status === 'completed' || 
      (essay.wordCount && essay.wordLimit && essay.wordCount >= essay.wordLimit * 0.98)
    ).length;

    const allTasks = [...calendarEvents, ...tasksEvents];
    const completedTasks = allTasks.filter(event => 
      event.completionStatus === 'completed' || event.status === 'completed'
    ).length;

    const essayProgress = essayPrompts.length > 0 
      ? Math.round((completedEssays / essayPrompts.length) * 100)
      : 0;

    const taskProgress = allTasks.length > 0 
      ? Math.round((completedTasks / allTasks.length) * 100)
      : 0;

    const overallProgress = essayPrompts.length > 0 && allTasks.length > 0
      ? Math.round((essayProgress * 0.7) + (taskProgress * 0.3))
      : essayPrompts.length > 0 
      ? essayProgress 
      : taskProgress;

    let applicationStatus = 'not-started';
    if (completedEssays > 0 || completedTasks > 0) {
      if (completedEssays === essayPrompts.length && completedTasks === allTasks.length && (essayPrompts.length > 0 || allTasks.length > 0)) {
        applicationStatus = 'submitted';
      } else {
        applicationStatus = 'in-progress';
      }
    }

    return {
      overallProgress,
      essayProgress,
      taskProgress,
      completedEssays,
      totalEssays: essayPrompts.length,
      completedTasks,
      totalTasks: allTasks.length,
      applicationStatus,
      upcomingDeadlines: allTasks.filter(task => 
        new Date(task.date) > new Date() && 
        (task.status !== 'completed' && task.completionStatus !== 'completed')
      ).length,
      overdueEvents: allTasks.filter(task => 
        new Date(task.date) < new Date() && 
        (task.status !== 'completed' && task.completionStatus !== 'completed')
      ).length
    };
  };

  const progressData = getProgressData();

  // ========== API FUNCTIONS ==========

  const fetchWorkspaceData = useCallback(async () => {
    if (!universityName || !userId) return;

    try {
      setWorkspaceLoading(true);
      setWorkspaceError(null);

      const response = await fetch(
        `/api/essay/${encodeURIComponent(universityName)}?userId=${encodeURIComponent(userId)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-cache",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Failed to fetch data`);
      }

      const data = await response.json();
      setWorkspaceData(data);

      // Filter and set default selections - only programs with essays
      const programsWithContent = data.programs?.filter(p => p.essays && p.essays.length > 0) || [];
      
      if (programsWithContent.length > 0) {
        let programToSelect = activeProgramId
          ? programsWithContent.find(p => p.id === activeProgramId)
          : null;

        if (!programToSelect) {
          programToSelect = programsWithContent[0];
          setActiveProgramId(programToSelect.id);
        }

        if (programToSelect.essays && programToSelect.essays.length > 0) {
          let essayToSelect = activeEssayPromptId
            ? programToSelect.essays.find(e => e.promptId === activeEssayPromptId)
            : null;

          if (!essayToSelect) {
            essayToSelect = programToSelect.essays[0];
            setActiveEssayPromptId(essayToSelect.promptId);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching workspace data:", err);
      setWorkspaceError(err.message);
    } finally {
      setWorkspaceLoading(false);
    }
  }, [universityName, userId, activeProgramId, activeEssayPromptId]);

  const autoSaveEssay = useCallback(async () => {
    if (!currentEssay || isSaving || !hasUnsavedChanges || isUpdatingRef.current || !userId) {
      return false;
    }

    try {
      setIsSaving(true);
      isUpdatingRef.current = true;

      const response = await fetch(
        `/api/essay/${encodeURIComponent(universityName)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            essayId: currentEssay.id,
            content: currentEssay.content,
            wordCount: currentEssay.wordCount,
            isAutoSave: true,
            userId,
          }),
        }
      );

      if (response.ok) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Auto-save error:", error);
      return false;
    } finally {
      setIsSaving(false);
      isUpdatingRef.current = false;
    }
  }, [currentEssay, isSaving, hasUnsavedChanges, universityName, userId]);

  const createEssay = useCallback(async () => {
    if (!activeProgramId || !activeEssayPromptId || isCreatingEssay || !userId) {
      return null;
    }

    try {
      setIsCreatingEssay(true);
      setWorkspaceError(null);
      isUpdatingRef.current = true;

      const response = await fetch(
        `/api/essay/${encodeURIComponent(universityName)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create_essay",
            programId: activeProgramId,
            essayPromptId: activeEssayPromptId,
            userId,
          }),
        }
      );

      const responseData = await response.json();

      if (response.ok && responseData.essay) {
        // Immediately update state
        setWorkspaceData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            programs: prev.programs.map(program =>
              program.id === activeProgramId
                ? {
                    ...program,
                    essays: program.essays.map(essayData =>
                      essayData.promptId === activeEssayPromptId
                        ? { ...essayData, userEssay: responseData.essay }
                        : essayData
                    ),
                  }
                : program
            ),
          };
        });

        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        lastContentRef.current = responseData.essay.content || "";
        return responseData.essay;
      } else {
        setWorkspaceError(responseData.error || "Failed to create essay");
        return null;
      }
    } catch (error) {
      console.error("Error creating essay:", error);
      setWorkspaceError("Network error while creating essay");
      return null;
    } finally {
      setIsCreatingEssay(false);
      isUpdatingRef.current = false;
    }
  }, [activeProgramId, activeEssayPromptId, universityName, isCreatingEssay, userId]);

  const updateEssayContent = useCallback((content, wordCount) => {
    if (isUpdatingRef.current) return;

    if (!currentEssay) {
      createEssay();
      return;
    }

    if (content === lastContentRef.current) return;

    // Update last typing time
    lastTypingTimeRef.current = Date.now();

    try {
      isUpdatingRef.current = true;

      // Immediately update local state
      setWorkspaceData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          programs: prev.programs.map(program =>
            program.id === activeProgramId
              ? {
                  ...program,
                  essays: program.essays.map(essayData =>
                    essayData.promptId === activeEssayPromptId
                      ? {
                          ...essayData,
                          userEssay: {
                            ...essayData.userEssay,
                            content,
                            wordCount,
                            lastModified: new Date(),
                          },
                        }
                      : essayData
                  ),
                }
              : program
          ),
        };
      });

      lastContentRef.current = content;
      setHasUnsavedChanges(true);
    } finally {
      isUpdatingRef.current = false;
    }
  }, [currentEssay, activeProgramId, activeEssayPromptId, createEssay]);

  const saveVersion = useCallback(async (label) => {
    if (!currentEssay || isSaving || isSavingVersion || !userId) return false;

    try {
      setIsSavingVersion(true);

      if (hasUnsavedChanges) {
        const autoSaved = await autoSaveEssay();
        if (!autoSaved) {
          setWorkspaceError("Failed to save current changes");
          return false;
        }
      }

      const response = await fetch(
        `/api/essay/${encodeURIComponent(universityName)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save_version",
            essayId: currentEssay.id,
            content: currentEssay.content,
            wordCount: currentEssay.wordCount,
            label: label || `Version ${new Date().toLocaleString()}`,
            userId,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.version) {
          // Immediately update local state with new version
          setWorkspaceData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              programs: prev.programs.map(program =>
                program.id === activeProgramId
                  ? {
                      ...program,
                      essays: program.essays.map(essayData =>
                        essayData.promptId === activeEssayPromptId
                          ? {
                              ...essayData,
                              userEssay: {
                                ...essayData.userEssay,
                                versions: [result.version, ...(essayData.userEssay?.versions || [])],
                                lastModified: new Date(),
                              },
                            }
                          : essayData
                      ),
                    }
                  : program
              ),
            };
          });
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error saving version:", error);
      return false;
    } finally {
      setIsSavingVersion(false);
    }
  }, [currentEssay, isSaving, isSavingVersion, hasUnsavedChanges, autoSaveEssay, universityName, activeProgramId, activeEssayPromptId, userId]);

  const handleRestoreVersion = async (versionId) => {
    if (!currentEssay || !userId) return;
    
    try {
      const response = await fetch(
        `/api/essay/${encodeURIComponent(universityName)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "restore_version",
            essayId: currentEssay.id,
            versionId,
            userId,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.essay) {
          // Immediately update local state with restored content
          setWorkspaceData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              programs: prev.programs.map(program =>
                program.id === activeProgramId
                  ? {
                      ...program,
                      essays: program.essays.map(essayData =>
                        essayData.promptId === activeEssayPromptId
                          ? {
                              ...essayData,
                              userEssay: {
                                ...essayData.userEssay,
                                content: result.essay.content,
                                wordCount: result.essay.wordCount,
                                lastModified: new Date(),
                              },
                            }
                          : essayData
                      ),
                    }
                  : program
              ),
            };
          });
          lastContentRef.current = result.essay.content;
          setHasUnsavedChanges(false);
          setLastSaved(new Date());
        }
      }
    } catch (error) {
      console.error("Error restoring version:", error);
    }
  };

  const handleDeleteVersion = async (versionId) => {
    if (!currentEssay || !userId) return;
    
    try {
      const response = await fetch(
        `/api/essay/${encodeURIComponent(universityName)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "delete_version",
            versionId,
            essayId: currentEssay.id,
            userId,
          }),
        }
      );

      if (response.ok) {
        // Immediately update local state to remove version
        setWorkspaceData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            programs: prev.programs.map(program =>
              program.id === activeProgramId
                ? {
                    ...program,
                    essays: program.essays.map(essayData =>
                      essayData.promptId === activeEssayPromptId
                        ? {
                            ...essayData,
                            userEssay: {
                              ...essayData.userEssay,
                              versions: (essayData.userEssay?.versions || []).filter(v => v.id !== versionId),
                            },
                          }
                        : essayData
                    ),
                  }
                : program
            ),
          };
        });
      }
    } catch (error) {
      console.error("Error deleting version:", error);
    }
  };

  // ========== HANDLERS ==========

  const handleProgramSelect = useCallback((programId) => {
    if (programId === activeProgramId) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    setActiveProgramId(programId);
    const program = programsWithEssays.find(p => p.id === programId);
    
    if (program?.essays?.length > 0) {
      setActiveEssayPromptId(program.essays[0].promptId);
    } else {
      setActiveEssayPromptId(null);
    }

    setHasUnsavedChanges(false);
    setLastSaved(null);
    lastContentRef.current = "";
    setOpenPanels([]);
  }, [activeProgramId, programsWithEssays]);

  const handleEssayPromptSelect = useCallback((promptId) => {
    if (promptId === activeEssayPromptId) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    setActiveEssayPromptId(promptId);
    setHasUnsavedChanges(false);
    setLastSaved(null);
    setOpenPanels([]);

    const newEssayData = currentProgram?.essays?.find(e => e.promptId === promptId);
    lastContentRef.current = newEssayData?.userEssay?.content || "";
  }, [activeEssayPromptId, currentProgram]);

  const handleOpenEditor = useCallback((essay) => {
    setActiveView('editor');
    
    if (workspaceData) {
      for (const program of workspaceData.programs) {
        if (!program.essays || program.essays.length === 0) continue;
        const essayData = program.essays.find(e => 
          e.promptId === essay.id || 
          e.userEssay?.id === essay.id ||
          e.promptTitle === essay.title
        );
        if (essayData) {
          setActiveProgramId(program.id);
          setActiveEssayPromptId(essayData.promptId);
          break;
        }
      }
    }
  }, [workspaceData]);

  const handleBackToList = async () => {
    if (hasUnsavedChanges) {
      await autoSaveEssay();
    }
    setActiveView('list');
    setOpenPanels([]);
  };

  // ========== EFFECTS ==========

  // Auto-save after 25 seconds of no typing
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    if (hasUnsavedChanges && currentEssay && !isSaving && activeView === 'editor') {
      autoSaveTimerRef.current = setTimeout(() => {
        const timeSinceLastType = Date.now() - lastTypingTimeRef.current;
        // Only auto-save if user hasn't typed for at least 20 seconds
        if (timeSinceLastType >= 20000) {
          autoSaveEssay();
        }
      }, 25000); // 25 seconds
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [hasUnsavedChanges, currentEssay?.id, isSaving, autoSaveEssay, activeView]);

  useEffect(() => {
    if (activeView === 'editor' && !workspaceData && universityName && userId) {
      fetchWorkspaceData();
    }
  }, [activeView, workspaceData, universityName, userId, fetchWorkspaceData]);

  useEffect(() => {
    if (activeView === 'editor' && userId && universityName && !workspaceData) {
      fetchWorkspaceData();
    }
  }, [userId, activeView, universityName, workspaceData, fetchWorkspaceData]);

  // ========== HELPER FUNCTIONS ==========

  const getProgressBarColor = () => {
    if (progressData.applicationStatus === 'submitted') return 'bg-green-500';
    if (progressData.applicationStatus === 'in-progress') return 'bg-blue-500';
    return 'bg-gray-400';
  };

  const getStatusInfo = () => {
    switch (progressData.applicationStatus) {
      case 'submitted':
        return { text: 'Application Complete', color: 'text-green-600 bg-green-50', icon: CheckCircle2 };
      case 'in-progress':
        return { text: 'In Progress', color: 'text-blue-600 bg-blue-50', icon: ClockIcon };
      default:
        return { text: 'Not Started', color: 'text-gray-500 bg-gray-50', icon: CalendarIcon };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const getStatusColors = (status, priority = 'medium') => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'overdue':
      case 'missed': return 'bg-red-100 text-red-700';
      case 'due-today':
      case 'today': return 'bg-orange-100 text-orange-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      default:
        return priority === 'high' ? 'bg-red-100 text-red-700'
          : priority === 'medium' ? 'bg-yellow-100 text-yellow-700'
          : 'bg-gray-100 text-gray-700';
    }
  };

  const getItemIcon = (item) => {
    if (item.status === 'completed') return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (item.type === 'event') return <CalendarDays className="h-5 w-5 text-purple-600" />;
    return (
      <Calendar className={`h-5 w-5 ${
        item.priority === "high" ? "text-red-600"
        : item.priority === "medium" ? "text-yellow-600"
        : "text-blue-600"
      }`} />
    );
  };

  const getEssayProgress = (essay) => {
    const hasContent = essay.wordCount && essay.wordCount > 0;
    const hasUserEssay = essay.userEssayId || essay.hasUserContent;
    
    if (!hasContent && !hasUserEssay) {
      return 0;
    }
    
    if (essay.status === 'COMPLETED' || essay.status === 'completed' || essay.isComplete) {
      return 100;
    }
    
    if (essay.wordCount > 0 && essay.wordLimit > 0) {
      return Math.min(Math.round((essay.wordCount / essay.wordLimit) * 100), 100);
    }
    
    return 0;
  };

  const getEssayStatus = (essay) => {
    const hasContent = essay.wordCount && essay.wordCount > 0;
    
    if (essay.status === 'COMPLETED' || essay.status === 'completed' || essay.isComplete) {
      return { 
        bg: "bg-gradient-to-r from-emerald-500 to-teal-500", 
        text: "text-white", 
        label: "Completed", 
        icon: CheckCircle,
        shadow: "shadow-lg shadow-emerald-500/30"
      };
    }
    
    if (essay.status === 'IN_PROGRESS' || essay.status === 'in-progress' || hasContent) {
      return { 
        bg: "bg-gradient-to-r from-blue-500 to-indigo-500", 
        text: "text-white", 
        label: "In Progress", 
        icon: Clock,
        shadow: "shadow-lg shadow-blue-500/30"
      };
    }
    
    if (essay.status === 'DRAFT') {
      return { 
        bg: "bg-gradient-to-r from-amber-500 to-orange-500", 
        text: "text-white", 
        label: "Draft", 
        icon: FileText,
        shadow: "shadow-lg shadow-amber-500/30"
      };
    }
    
    return { 
      bg: "bg-gradient-to-r from-slate-600 to-slate-700", 
      text: "text-white", 
      label: "Not Started", 
      icon: FileText,
      shadow: "shadow-lg shadow-slate-500/30"
    };
  };

  // ========== RENDER ==========

  if (sessionStatus === 'loading') {
    return (
      <div className="my-20">
        <Card className="bg-[#002147] shadow-xl border-0 overflow-hidden">
          <CardContent className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-white mr-3" />
            <span className="text-white">Loading session...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get panels in render order (first = bottom layer, last = top layer)
  const renderPanels = () => {
    if (!currentEssay || openPanels.length === 0) return null;

    return openPanels.map((panelName, index) => {
      const zIndex = 30 + index; // Each panel gets higher z-index
      const isTopPanel = index === openPanels.length - 1;

      const panelContent = () => {
        switch (panelName) {
          case 'versions':
            return (
              <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg">
                      <Layers className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-sm font-semibold text-white">Version History</span>
                    <span className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded-full">
                      {currentEssay.versions?.length || 0} saved
                    </span>
                  </div>
                  <button
                    onClick={() => closePanel('versions')}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <EmbeddedVersionManager
                  versions={currentEssay.versions || []}
                  currentContent={currentEssay.content || ''}
                  onRestoreVersion={handleRestoreVersion}
                  onDeleteVersion={handleDeleteVersion}
                  essayId={currentEssay.id}
                  universityName={universityName}
                  isLoading={workspaceLoading}
                  compact={true}
                  onClose={() => closePanel('versions')}
                />
              </div>
            );
          case 'analytics':
            return (
              <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                      <PieChart className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-sm font-semibold text-white">Essay Analytics</span>
                  </div>
                  <button
                    onClick={() => closePanel('analytics')}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <EmbeddedEssayAnalytics
                  essay={{
                    ...currentEssay,
                    wordLimit: currentEssayData.wordLimit
                  }}
                  essayId={currentEssay.id}
                  compact={true}
                  onClose={() => closePanel('analytics')}
                />
              </div>
            );
          case 'ai':
            return (
              <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg">
                      <Brain className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-sm font-semibold text-white">AI Assistant</span>
                  </div>
                  <button
                    onClick={() => closePanel('ai')}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <EmbeddedAISuggestions
                  content={currentEssay.content || ''}
                  prompt={currentEssayData.promptText}
                  wordCount={currentEssay.wordCount || 0}
                  wordLimit={currentEssayData.wordLimit}
                  essayId={currentEssay.id}
                  universityName={universityName}
                  compact={true}
                  onClose={() => closePanel('ai')}
                />
              </div>
            );
          default:
            return null;
        }
      };

      return (
        <div
          key={panelName}
          className="mb-4 animate-in slide-in-from-top-4 duration-300"
          style={{ zIndex }}
        >
          {panelContent()}
        </div>
      );
    });
  };

  return (
    <div className="my-20">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
      
      <Card className="bg-[#002147] shadow-xl hover:shadow-2xl transition-all duration-500 border-0 overflow-hidden">
        <CardContent className="p-0">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-[#002147] to-[#003366] p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-3">
                  {activeView === 'editor' && (
                    <button
                      onClick={handleBackToList}
                      className="mr-3 p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full mr-4"></div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    {activeView === 'editor' ? 'Essay Editor' : 'Application Workspace'}
                  </h2>
                </div>
                <p className="text-white/80 text-sm font-medium">
                  {activeView === 'editor' 
                    ? `Editing: ${currentEssayData?.promptTitle || 'Essay'}`
                    : `Your personalized application center for ${universityName || 'this university'}`
                  }
                </p>
              </div>

              {/* Progress Indicator */}
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right text-sm">
                  <div className="text-white font-semibold">Application Progress</div>
                  <div className="text-white/70">{progressData.overallProgress}% Complete</div>
                </div>
                <div className="w-16 h-16 relative">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="3"
                      strokeDasharray={`${progressData.overallProgress}, 100`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#60A5FA" />
                        <stop offset="100%" stopColor="#34D399" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{progressData.overallProgress}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Info Card */}
            <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <StatusIcon className="h-4 w-4 text-white" />
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/20 text-white">
                    {statusInfo.text}
                  </span>
                </div>
                <span className="text-sm font-bold text-white">{progressData.overallProgress}%</span>
              </div>

              <div className="w-full h-2.5 bg-white/20 rounded-full mb-3 overflow-hidden">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-500 ${getProgressBarColor()}`}
                  style={{ width: `${progressData.overallProgress}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="text-center text-white p-2 bg-white/5 rounded-lg">
                  <div className="font-semibold">Essays</div>
                  <div className="text-white/70 text-lg font-bold">{progressData.completedEssays}/{progressData.totalEssays}</div>
                </div>
                <div className="text-center text-white p-2 bg-white/5 rounded-lg">
                  <div className="font-semibold">Tasks</div>
                  <div className="text-white/70 text-lg font-bold">{progressData.completedTasks}/{progressData.totalTasks}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6 space-y-8">
            {activeView === 'list' ? (
              // ========== LIST VIEW ==========
              <Tabs defaultValue="essays" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100 h-14">
                  <TabsTrigger
                    value="essays"
                    className="data-[state=active]:bg-[#002147] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-300 h-11 font-semibold"
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    <span className="hidden sm:inline">Essay Workspace</span>
                    <span className="sm:hidden">Essays</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="deadlines"
                    className="data-[state=active]:bg-[#002147] data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-300 h-11 font-semibold"
                  >
                    <Clock className="h-5 w-5 mr-2" />
                    <span className="hidden sm:inline">Tasks & Events</span>
                    <span className="sm:hidden">Tasks</span>
                  </TabsTrigger>
                </TabsList>

                {/* Essays Tab */}
                <TabsContent value="essays" className="mt-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-white">Essay Requirements</h3>
                        <p className="text-white/80 text-sm mt-1">
                          {progressData.totalEssays} essays • {progressData.completedEssays} completed
                        </p>
                      </div>
                    </div>

                    {university?.allEssayPrompts && university.allEssayPrompts.length > 0 ? (
                      <div className="space-y-4">
                        {university.allEssayPrompts.map((essay, index) => {
                          const actualProgress = getEssayProgress(essay);
                          const statusConfig = getEssayStatus(essay);
                          const EssayStatusIcon = statusConfig.icon;

                          return (
                            <div
                              key={essay.id || index}
                              className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
                            >
                              <div className="p-5">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <span className="font-bold text-[#002147] text-sm whitespace-nowrap bg-blue-50 px-3 py-1 rounded-lg">
                                      Essay {index + 1}
                                    </span>
                                    <h4 className="font-semibold text-gray-900 text-base truncate">
                                      {essay.title}
                                    </h4>
                                    {essay.isMandatory && (
                                      <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                                        Required
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.shadow}`}>
                                      <EssayStatusIcon className="h-3.5 w-3.5" />
                                      {statusConfig.label}
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenEditor(essay);
                                      }}
                                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                                    >
                                      <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                                      Edit
                                    </Button>
                                  </div>
                                </div>

                                <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-lg p-4 mb-4 border-l-4 border-[#002147]">
                                  <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">
                                    {essay.text}
                                  </p>
                                </div>

                                <div className="flex items-center justify-between text-sm text-gray-600">
                                  <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-lg">
                                      <FileText className="h-3.5 w-3.5 text-gray-500" />
                                      {essay.wordLimit || 500} words max
                                    </span>
                                    {essay.wordCount > 0 && (
                                      <span className="font-semibold text-[#002147] bg-blue-50 px-3 py-1 rounded-lg">
                                        {essay.wordCount} / {essay.wordLimit || 500} words
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <div className="w-28 bg-gray-200 rounded-full h-2 overflow-hidden">
                                      <div
                                        className={`h-2 rounded-full transition-all duration-500 ${
                                          actualProgress === 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 
                                          actualProgress > 0 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gray-300'
                                        }`}
                                        style={{ width: `${actualProgress}%` }}
                                      />
                                    </div>
                                    <span className={`font-bold w-12 text-right ${
                                      actualProgress === 100 ? 'text-emerald-600' :
                                      actualProgress > 0 ? 'text-blue-600' : 'text-gray-400'
                                    }`}>
                                      {actualProgress}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-white/5 rounded-xl">
                        <FileText className="h-12 w-12 text-white/40 mx-auto mb-3" />
                        <h4 className="text-lg font-semibold text-white mb-1">No Essay Prompts</h4>
                        <p className="text-white/60 text-sm">Essays will appear when available</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Tasks & Events Tab */}
                <TabsContent value="deadlines" className="mt-8">
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-bold text-white">Tasks & Events</h3>
                        <p className="text-white text-sm mt-1">
                          {progressData.completedTasks} of {progressData.totalTasks} tasks completed
                        </p>
                      </div>
                      <Button
                        onClick={() => router.push("/dashboard/calender")}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/30"
                      >
                        <CalendarDays className="h-4 w-4 mr-2" />
                        Manage Calendar
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      {tasksAndEvents.length === 0 ? (
                        <div className="text-center py-12">
                          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h4 className="text-lg font-semibold text-white mb-2">No Tasks or Events</h4>
                          <p className="text-gray-300 mb-6">
                            Your application tasks and events will appear here.
                          </p>
                        </div>
                      ) : (
                        tasksAndEvents.map((item, index) => (
                          <div
                            key={item.id || index}
                            className="flex items-center justify-between p-6 border-2 border-gray-100 rounded-2xl hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50"
                          >
                            <div className="flex items-center space-x-4">
                              <div className={`p-3 rounded-xl ${
                                item.status === "completed" ? "bg-green-100"
                                : item.type === "event" ? "bg-purple-100"
                                : item.priority === "high" ? "bg-red-100"
                                : item.priority === "medium" ? "bg-yellow-100"
                                : "bg-blue-100"
                              }`}>
                                {getItemIcon(item)}
                              </div>

                              <div>
                                <div className="font-bold text-[#002147] text-lg flex items-center space-x-2">
                                  <span>{item.task}</span>
                                  {item.type === "event" && (
                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">EVENT</span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center space-x-4 flex-wrap gap-2">
                                  <span>{formatDate(item.date)}</span>
                                  {item.time && <span>• {item.time}</span>}
                                  {item.daysLeft !== undefined && item.status !== "completed" && (
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      item.daysLeft <= 0 ? "bg-red-100 text-red-700"
                                      : item.daysLeft <= 7 ? "bg-orange-100 text-orange-700"
                                      : "bg-blue-100 text-blue-700"
                                    }`}>
                                      <Timer className="h-3 w-3 mr-1 inline" />
                                      {item.daysLeft === 0 ? "Due today"
                                        : item.daysLeft < 0 ? `${Math.abs(item.daysLeft)} days overdue`
                                        : `${item.daysLeft} days left`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <span className={`px-4 py-2 text-sm rounded-full font-medium ${getStatusColors(item.status, item.priority)}`}>
                              {item.status === "completed" && <CheckCircle className="h-4 w-4 mr-1 inline" />}
                              {item.status.replace("-", " ")}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              // ========== EDITOR VIEW ==========
              <div className="space-y-6">
                {!userId && sessionStatus === 'authenticated' && (
                  <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl p-4 flex items-center">
                    <AlertCircle className="w-5 h-5 text-amber-400 mr-3" />
                    <div>
                      <p className="text-amber-200 font-medium">Session issue detected</p>
                      <p className="text-amber-300/70 text-sm">User ID not found. Try refreshing or signing out and back in.</p>
                    </div>
                  </div>
                )}

                {workspaceLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                    <span className="ml-3 text-white">Loading workspace...</span>
                  </div>
                ) : workspaceError ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-white mb-2">Error Loading Workspace</h4>
                    <p className="text-white/60 mb-4">{workspaceError}</p>
                    <Button onClick={fetchWorkspaceData} className="bg-blue-500 hover:bg-blue-600">
                      Try Again
                    </Button>
                  </div>
                ) : !userId ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-white mb-2">Authentication Required</h4>
                    <p className="text-white/60 mb-4">Please sign in to access the essay editor.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-12 gap-6">
                    {/* Left Sidebar - Essay Selector */}
                    <div className="col-span-12 lg:col-span-3">
                      <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl">
                        <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-white/10">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <BookOpen className="w-5 h-5 text-blue-400" />
                          </div>
                          <h3 className="font-bold text-white">Programs & Essays</h3>
                        </div>

                        <div className="space-y-2 max-h-[450px] overflow-y-auto custom-scrollbar pr-1">
                          {programsWithEssays.length === 0 ? (
                            <div className="text-center py-6">
                              <FileText className="w-8 h-8 text-white/30 mx-auto mb-2" />
                              <p className="text-sm text-white/50">No programs with essays</p>
                            </div>
                          ) : (
                            programsWithEssays.map((program) => (
                              <div key={program.id} className="space-y-1">
                                <div
                                  onClick={() => handleProgramSelect(program.id)}
                                  className={`p-3 rounded-xl cursor-pointer transition-all text-sm ${
                                    activeProgramId === program.id
                                      ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/20 border-l-4 border-blue-400 shadow-lg'
                                      : 'hover:bg-white/10 border-l-4 border-transparent'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-white">{program.name}</span>
                                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/60">
                                      {program.essays?.length || 0}
                                    </span>
                                  </div>
                                </div>

                                {activeProgramId === program.id && program.essays?.map((essayData) => {
                                  const hasContent = essayData.userEssay?.wordCount > 0;
                                  return (
                                    <div
                                      key={essayData.promptId}
                                      onClick={() => handleEssayPromptSelect(essayData.promptId)}
                                      className={`p-2.5 pl-5 ml-3 rounded-lg cursor-pointer transition-all text-xs ${
                                        activeEssayPromptId === essayData.promptId
                                          ? 'bg-gradient-to-r from-blue-500/50 to-cyan-500/30 border-l-2 border-cyan-400'
                                          : 'hover:bg-white/10 border-l-2 border-white/10'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-white/90 truncate flex-1">{essayData.promptTitle}</span>
                                        {hasContent && (
                                          <span className="text-emerald-400 text-[10px] ml-2 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded">
                                            {Math.round((essayData.userEssay.wordCount / essayData.wordLimit) * 100)}%
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Main Editor Area */}
                    <div className="col-span-12 lg:col-span-9">
                      {currentEssayData ? (
                        <div className="space-y-5">
                          {/* Essay Header with Panel Toggles */}
                          <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                              <h3 className="text-xl font-bold text-white">{currentEssayData.promptTitle}</h3>
                              <p className="text-sm text-white/60">{currentProgram?.name}</p>
                            </div>
                            
                            {/* Panel Toggle Buttons */}
                            {currentEssay && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => togglePanel('versions')}
                                  className={`text-xs px-4 py-2 rounded-xl transition-all flex items-center font-medium ${
                                    isPanelOpen('versions') 
                                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30' 
                                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/20'
                                  }`}
                                >
                                  <Layers className="w-4 h-4 mr-2" />
                                  Versions
                                  {currentEssay.versions?.length > 0 && (
                                    <span className="ml-2 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">
                                      {currentEssay.versions.length}
                                    </span>
                                  )}
                                </button>
                                <button
                                  onClick={() => togglePanel('analytics')}
                                  className={`text-xs px-4 py-2 rounded-xl transition-all flex items-center font-medium ${
                                    isPanelOpen('analytics') 
                                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30' 
                                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/20'
                                  }`}
                                >
                                  <PieChart className="w-4 h-4 mr-2" />
                                  Stats
                                </button>
                                <button
                                  onClick={() => togglePanel('ai')}
                                  className={`text-xs px-4 py-2 rounded-xl transition-all flex items-center font-medium ${
                                    isPanelOpen('ai') 
                                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30' 
                                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/20'
                                  }`}
                                >
                                  <Brain className="w-4 h-4 mr-2" />
                                  AI
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Prompt Display */}
                          <div className="p-4 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl border border-blue-400/30">
                            <p className="text-xs text-blue-300 font-semibold mb-2 uppercase tracking-wider">Prompt</p>
                            <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
                              {currentEssayData.promptText}
                            </p>
                            <p className="text-xs text-blue-300/70 mt-3 flex items-center">
                              <FileText className="w-3 h-3 mr-1" />
                              Word limit: {currentEssayData.wordLimit}
                            </p>
                          </div>

                          {/* Stacked Panels - Appear above editor */}
                          {renderPanels()}

                          {/* Editor or Create Button */}
                          {currentEssay ? (
                            <>
                              <EmbeddedEssayEditor
                                key={`editor-${currentEssay.id}`}
                                content={currentEssay.content || ''}
                                onChange={updateEssayContent}
                                wordLimit={currentEssayData.wordLimit}
                                essayId={currentEssay.id}
                                lastSaved={lastSaved}
                                hasUnsavedChanges={hasUnsavedChanges}
                                isSaving={isSaving}
                                onSave={() => autoSaveEssay()}
                                compact={false}
                              />

                              <div className="flex justify-between items-center text-xs text-white/50 pt-2">
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Last modified: {currentEssay.lastModified ? new Date(currentEssay.lastModified).toLocaleString() : 'Never'}
                                  <span className="ml-3 text-white/30">• Auto-saves after 25s of inactivity</span>
                                </span>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => autoSaveEssay()}
                                    disabled={isSaving || !hasUnsavedChanges}
                                    className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-300 hover:from-blue-500/30 hover:to-indigo-500/30 border border-blue-400/30 disabled:opacity-50"
                                  >
                                    {isSaving ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1.5" />}
                                    Save Now
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => saveVersion()}
                                    disabled={isSaving || isSavingVersion}
                                    className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-400/30"
                                  >
                                    {isSavingVersion ? (
                                      <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                    ) : (
                                      <Save className="w-3 h-3 mr-1.5" />
                                    )}
                                    Save Version
                                  </Button>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-16 bg-gradient-to-b from-white/10 to-white/5 rounded-2xl border border-white/20">
                              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                                <BookOpen className="w-8 h-8 text-blue-400" />
                              </div>
                              <h4 className="text-xl font-bold text-white mb-2">Start Writing</h4>
                              <p className="text-white/60 mb-6">Create your essay for this prompt</p>
                              <Button
                                onClick={createEssay}
                                disabled={isCreatingEssay || !userId}
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/30 px-8"
                              >
                                {isCreatingEssay ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                  </>
                                ) : (
                                  <>
                                    <Edit3 className="w-4 h-4 mr-2" />
                                    Start Essay
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 flex items-center justify-center">
                            <Target className="w-8 h-8 text-white/40" />
                          </div>
                          <h4 className="text-lg font-semibold text-white mb-2">Select an Essay</h4>
                          <p className="text-white/60">Choose a program and essay from the left sidebar</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplicationTabs;