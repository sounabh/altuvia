"use client"

import React, { useState, useRef, useEffect, useCallback, memo, useMemo } from "react"
import { toast } from "sonner" // Added import
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Undo2,
  Redo2,
  Loader2,
  Check,
  AlertCircle,
  Quote,
  Type,
  Heading1,
  Heading2,
  Strikethrough,
  Link2,
  Unlink,
  Minus,
  Sparkles,
  Copy,
  CheckCheck,
  RotateCcw,
  Maximize2,
  Minimize2,
  FileText,
  Clock,
  Target,
  TrendingUp,
  Zap
} from "lucide-react"

// Memoized editor to prevent unnecessary re-renders
export const EssayEditor = memo(function EssayEditor({ 
  content = '', 
  onChange, 
  wordLimit = 500,
  essayId,
  onSave,
  lastSaved,
}) {
  const editorRef = useRef(null)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [sentenceCount, setSentenceCount] = useState(0)
  const [paragraphCount, setParagraphCount] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [activeFormats, setActiveFormats] = useState(new Set())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [copied, setCopied] = useState(false)
  const [readingTime, setReadingTime] = useState(0)
  const [selectedText, setSelectedText] = useState('')
  
  // Refs to prevent stale closures and re-renders
  const onChangeRef = useRef(onChange)
  const onSaveRef = useRef(onSave)
  const debounceRef = useRef(null)
  const lastSyncedContentRef = useRef(content)
  const isUserTypingRef = useRef(false)
  const skipNextSyncRef = useRef(false)
  const initialContentRef = useRef(content)
  
  // Auto-save refs - completely isolated from render cycle
  const autoSaveIntervalRef = useRef(null)
  const lastAutoSavedContentRef = useRef(content)
  const saveIndicatorRef = useRef(null)
  const isSavingRef = useRef(false)
  const hasUnsavedChangesRef = useRef(false)

  // Update refs without triggering re-renders
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  // Count words utility
  const countWords = useCallback((text) => {
    if (!text) return 0
    const plainText = text
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return plainText ? plainText.split(' ').filter(w => w.length > 0).length : 0
  }, [])

  // Count characters
  const countChars = useCallback((text) => {
    if (!text) return 0
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&[a-z]+;/gi, '')
      .length
  }, [])

  // Count sentences
  const countSentences = useCallback((text) => {
    if (!text) return 0
    const plainText = text.replace(/<[^>]*>/g, ' ')
    const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 0)
    return sentences.length
  }, [])

  // Count paragraphs
  const countParagraphs = useCallback((text) => {
    if (!text) return 0
    const paragraphs = text.split(/<\/p>|<br\s*\/?>\s*<br\s*\/?>|\n\n/).filter(p => {
      const cleaned = p.replace(/<[^>]*>/g, '').trim()
      return cleaned.length > 0
    })
    return Math.max(1, paragraphs.length)
  }, [])

  // Calculate reading time (avg 200 words per minute)
  const calculateReadingTime = useCallback((words) => {
    return Math.max(1, Math.ceil(words / 200))
  }, [])

  // Get plain text
  const getPlainText = useCallback((html) => {
    if (!html) return ''
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }, [])

  // Check active formatting
  const updateActiveFormats = useCallback(() => {
    const formats = new Set()
    try {
      if (document.queryCommandState('bold')) formats.add('bold')
      if (document.queryCommandState('italic')) formats.add('italic')
      if (document.queryCommandState('underline')) formats.add('underline')
      if (document.queryCommandState('strikeThrough')) formats.add('strikethrough')
      if (document.queryCommandState('insertUnorderedList')) formats.add('ul')
      if (document.queryCommandState('insertOrderedList')) formats.add('ol')
      if (document.queryCommandState('justifyLeft')) formats.add('left')
      if (document.queryCommandState('justifyCenter')) formats.add('center')
      if (document.queryCommandState('justifyRight')) formats.add('right')
      if (document.queryCommandState('justifyFull')) formats.add('justify')
    } catch (e) {
      // Ignore errors
    }
    setActiveFormats(formats)
    
    // Get selected text
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim())
    } else {
      setSelectedText('')
    }
  }, [])

  // Update all stats
  const updateStats = useCallback((html) => {
    const words = countWords(html)
    const chars = countChars(html)
    const sentences = countSentences(html)
    const paragraphs = countParagraphs(html)
    const reading = calculateReadingTime(words)
    
    setWordCount(words)
    setCharCount(chars)
    setSentenceCount(sentences)
    setParagraphCount(paragraphs)
    setReadingTime(reading)
  }, [countWords, countChars, countSentences, countParagraphs, calculateReadingTime])

  // Silent auto-save function - uses DOM manipulation only, no state updates
  const performAutoSave = useCallback(() => {
    if (!editorRef.current || !onSaveRef.current || isSavingRef.current) return
    
    const currentContent = editorRef.current.innerHTML
    
    // Only save if content has changed since last auto-save
    if (currentContent === lastAutoSavedContentRef.current) return
    
    isSavingRef.current = true
    
    // Show subtle saving indicator using pure DOM manipulation
    if (saveIndicatorRef.current) {
      saveIndicatorRef.current.style.opacity = '1'
      saveIndicatorRef.current.classList.add('pulse-save')
    }
    
    // Perform save
    try {
      onSaveRef.current(currentContent, countWords(currentContent))
      lastAutoSavedContentRef.current = currentContent
      hasUnsavedChangesRef.current = false
      
      // Update indicator to show success after brief delay
      setTimeout(() => {
        if (saveIndicatorRef.current) {
          saveIndicatorRef.current.classList.remove('pulse-save')
          saveIndicatorRef.current.classList.add('saved-success')
          
          // Fade out after showing success
          setTimeout(() => {
            if (saveIndicatorRef.current) {
              saveIndicatorRef.current.classList.remove('saved-success')
              saveIndicatorRef.current.style.opacity = '0.6'
            }
            isSavingRef.current = false
          }, 800)
        }
      }, 300)
    } catch (error) {
      console.error('Auto-save failed:', error)
      isSavingRef.current = false
      if (saveIndicatorRef.current) {
        saveIndicatorRef.current.classList.remove('pulse-save')
        saveIndicatorRef.current.style.opacity = '0.6'
      }
    }
  }, [countWords])

  // Initialize auto-save interval - runs completely in background
  useEffect(() => {
    // Start auto-save interval (15 seconds)
    autoSaveIntervalRef.current = setInterval(() => {
      performAutoSave()
    }, 15000)
    
    // Also save on page visibility change (when user switches tabs)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        performAutoSave()
      }
    }
    
    // Save before unload
    const handleBeforeUnload = () => {
      if (hasUnsavedChangesRef.current && editorRef.current && onSaveRef.current) {
        onSaveRef.current(editorRef.current.innerHTML, countWords(editorRef.current.innerHTML))
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [performAutoSave, countWords])

  // Handle content changes with debounce
  const handleContentChange = useCallback(() => {
    if (!editorRef.current) return

    isUserTypingRef.current = true
    skipNextSyncRef.current = true
    hasUnsavedChangesRef.current = true

    const htmlContent = editorRef.current.innerHTML
    
    updateStats(htmlContent)
    updateActiveFormats()

    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Debounce the onChange callback to prevent parent re-renders
    debounceRef.current = setTimeout(() => {
      isUserTypingRef.current = false
      
      if (onChangeRef.current && editorRef.current) {
        const currentContent = editorRef.current.innerHTML
        // Only call onChange if content actually changed
        if (currentContent !== lastSyncedContentRef.current) {
          lastSyncedContentRef.current = currentContent
          onChangeRef.current(currentContent, countWords(currentContent))
        }
      }
    }, 400)
  }, [updateStats, updateActiveFormats, countWords])

  // Execute formatting command
  const execCommand = useCallback((command, value = null) => {
    if (!editorRef.current) return
    
    editorRef.current.focus()
    document.execCommand(command, false, value)
    
    // Update after command
    requestAnimationFrame(() => {
      handleContentChange()
    })
  }, [handleContentChange])

  // Insert link
  const insertLink = useCallback(() => {
    const url = prompt('Enter URL:', 'https://')
    if (url) {
      execCommand('createLink', url)
    }
  }, [execCommand])

  // Remove link
  const removeLink = useCallback(() => {
    execCommand('unlink')
  }, [execCommand])

  // Insert horizontal rule
  const insertHorizontalRule = useCallback(() => {
    execCommand('insertHorizontalRule')
  }, [execCommand])

  // Copy content
  const copyContent = useCallback(async () => {
    if (!editorRef.current) return
    
    const text = getPlainText(editorRef.current.innerHTML)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [getPlainText])

  // Clear formatting
  const clearFormatting = useCallback(() => {
    execCommand('removeFormat')
  }, [execCommand])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    // Only handle shortcuts with modifier keys
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault()
          execCommand('bold')
          break
        case 'i':
          e.preventDefault()
          execCommand('italic')
          break
        case 'u':
          e.preventDefault()
          execCommand('underline')
          break
        case 's':
          e.preventDefault()
          // ✅ FIX: Call onSave callback directly
          if (onSaveRef.current && editorRef.current) {
            const currentContent = editorRef.current.innerHTML
            const currentWordCount = countWords(currentContent)
            onSaveRef.current(currentContent, currentWordCount)
            toast.success('Changes saved')
          }
          break
        case 'z':
          if (e.shiftKey) {
            e.preventDefault()
            execCommand('redo')
          }
          break
        case 'y':
          e.preventDefault()
          execCommand('redo')
          break
        case 'k':
          e.preventDefault()
          insertLink()
          break
        default:
          break
      }
    }
    
    // Handle Escape for fullscreen
    if (e.key === 'Escape' && isFullscreen) {
      setIsFullscreen(false)
    }
  }, [execCommand, insertLink, isFullscreen])

  // Handle paste - preserve some formatting
  const handlePaste = useCallback((e) => {
    e.preventDefault()
    
    // Try to get HTML first, fallback to plain text
    let content = e.clipboardData.getData('text/html')
    
    if (content) {
      // Clean up the HTML - remove scripts, styles, and dangerous content
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = content
      
      // Remove scripts and styles
      tempDiv.querySelectorAll('script, style, meta, link').forEach(el => el.remove())
      
      // Get cleaned content
      content = tempDiv.innerHTML
        .replace(/class="[^"]*"/gi, '')
        .replace(/style="[^"]*"/gi, '')
        .replace(/id="[^"]*"/gi, '')
    } else {
      content = e.clipboardData.getData('text/plain')
      // Convert newlines to br tags
      content = content.replace(/\n/g, '<br>')
    }
    
    if (!content) return

    // Insert at cursor position
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    range.deleteContents()
    
    const fragment = range.createContextualFragment(content)
    range.insertNode(fragment)
    
    // Move cursor to end
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)

    handleContentChange()
  }, [handleContentChange])

  // Initialize editor - only once
  useEffect(() => {
    if (!editorRef.current || isInitialized) return

    const editor = editorRef.current

    // Set initial content
    if (content) {
      editor.innerHTML = content
      lastSyncedContentRef.current = content
      lastAutoSavedContentRef.current = content
      initialContentRef.current = content
    }

    updateStats(content)
    setIsInitialized(true)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // Sync external content changes - but only when not typing (FIXED VERSION)
  useEffect(() => {
    if (!isInitialized || !editorRef.current) return;
    
    // Don't sync if user is currently typing
    if (isUserTypingRef.current) {
      // But we should reset the typing flag after a delay
      setTimeout(() => {
        isUserTypingRef.current = false;
      }, 100);
      return;
    }
    
    // Don't sync if we should skip this sync (used for internal changes)
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    const currentContent = editorRef.current.innerHTML;
    const externalContent = content || '';
    
    // Only sync if this is truly an external change that's different from what we have
    if (externalContent !== lastSyncedContentRef.current) {
      
      // Check if the external content is actually different from what's in the editor
      // This prevents unnecessary DOM updates
      if (externalContent !== currentContent) {
        // Preserve cursor position
        const selection = window.getSelection();
        let range = null;
        if (selection.rangeCount > 0) {
          range = selection.getRangeAt(0).cloneRange();
        }
        
        // Store if editor had focus
        const hadFocus = document.activeElement === editorRef.current;
        
        // Update the editor content
        editorRef.current.innerHTML = externalContent;
        lastSyncedContentRef.current = externalContent;
        lastAutoSavedContentRef.current = externalContent;
        updateStats(externalContent);
        
        // Restore cursor position if editor had focus
        if (hadFocus && editorRef.current) {
          editorRef.current.focus();
          
          // Try to restore the exact cursor position
          if (range) {
            try {
              selection.removeAllRanges();
              selection.addRange(range);
            } catch (e) {
              // If we can't restore the exact position, put cursor at end
              const newRange = document.createRange();
              newRange.selectNodeContents(editorRef.current);
              newRange.collapse(false);
              selection.removeAllRanges();
              selection.addRange(newRange);
            }
          } else {
            // Otherwise move cursor to end
            const newRange = document.createRange();
            newRange.selectNodeContents(editorRef.current);
            newRange.collapse(false);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }
      } else {
        // Even if content is the same, update the sync reference
        lastSyncedContentRef.current = externalContent;
      }
    }
  }, [content, isInitialized, updateStats]);

  // Word limit status
  const limitStatus = useMemo(() => {
    const percentage = Math.min(100, (wordCount / wordLimit) * 100)
    const isOver = wordCount > wordLimit
    const isNear = wordCount > wordLimit * 0.9
    const remaining = Math.max(0, wordLimit - wordCount)
    const isGood = wordCount >= wordLimit * 0.8 && wordCount <= wordLimit
    
    return { percentage, isOver, isNear, remaining, isGood }
  }, [wordCount, wordLimit])

  // Get progress color
  const getProgressColor = useCallback(() => {
    if (limitStatus.isOver) return 'bg-red-500'
    if (limitStatus.isNear) return 'bg-amber-500'
    if (limitStatus.isGood) return 'bg-green-500'
    return 'bg-blue-500'
  }, [limitStatus])

  // Get progress text color
  const getProgressTextColor = useCallback(() => {
    if (limitStatus.isOver) return 'text-red-600'
    if (limitStatus.isNear) return 'text-amber-600'
    if (limitStatus.isGood) return 'text-green-600'
    return 'text-blue-600'
  }, [limitStatus])

  // Toolbar button component
  const ToolbarButton = useCallback(({ 
    onClick, 
    active = false, 
    disabled = false,
    title,
    children,
    className = ''
  }) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
      disabled={disabled}
      title={title}
      className={`
        p-2 rounded-lg transition-all duration-150 flex items-center justify-center
        ${active 
          ? 'bg-blue-500 text-white shadow-md scale-105' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
        ${className}
      `}
    >
      {children}
    </button>
  ), [])

  // Toolbar group component
  const ToolbarGroup = useCallback(({ children }) => (
    <div className="flex items-center gap-0.5 bg-white rounded-lg p-1 shadow-sm border border-gray-100">
      {children}
    </div>
  ), [])

  // Divider component
  const ToolbarDivider = () => (
    <div className="w-px h-6 bg-gray-200 mx-1" />
  )

  // Container class for fullscreen
  const containerClass = isFullscreen 
    ? 'fixed inset-0 z-50 bg-white flex flex-col'
    : 'bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden'

  return (
    <div className={containerClass}>
      {/* Auto-save indicator styles - injected once */}
      <style jsx global>{`
        @keyframes pulse-save-animation {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
        
        @keyframes saved-success-animation {
          0% { transform: scale(1); }
          30% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        
        .pulse-save {
          animation: pulse-save-animation 0.5s ease-in-out infinite;
        }
        
        .pulse-save .save-dot {
          background-color: #3b82f6 !important;
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
        }
        
        .saved-success .save-dot {
          background-color: #22c55e !important;
          box-shadow: 0 0 12px rgba(34, 197, 94, 0.8);
          animation: saved-success-animation 0.4s ease-out;
        }
      `}</style>

      {/* Main Toolbar */}
      <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-200 p-2 flex-shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Formatting buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Text formatting */}
            <ToolbarGroup>
              <ToolbarButton
                onClick={() => execCommand('bold')}
                active={activeFormats.has('bold')}
                title="Bold (Ctrl+B)"
              >
                <Bold className="w-4 h-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => execCommand('italic')}
                active={activeFormats.has('italic')}
                title="Italic (Ctrl+I)"
              >
                <Italic className="w-4 h-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => execCommand('underline')}
                active={activeFormats.has('underline')}
                title="Underline (Ctrl+U)"
              >
                <Underline className="w-4 h-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => execCommand('strikeThrough')}
                active={activeFormats.has('strikethrough')}
                title="Strikethrough"
              >
                <Strikethrough className="w-4 h-4" />
              </ToolbarButton>
            </ToolbarGroup>

            <ToolbarDivider />

            {/* Headings */}
            <ToolbarGroup>
              <ToolbarButton
                onClick={() => execCommand('formatBlock', 'h1')}
                title="Heading 1"
              >
                <Heading1 className="w-4 h-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => execCommand('formatBlock', 'h2')}
                title="Heading 2"
              >
                <Heading2 className="w-4 h-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => execCommand('formatBlock', 'p')}
                title="Normal Text"
              >
                <Type className="w-4 h-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => execCommand('formatBlock', 'blockquote')}
                title="Quote"
              >
                <Quote className="w-4 h-4" />
              </ToolbarButton>
            </ToolbarGroup>

            <ToolbarDivider />

            {/* Lists */}
            <ToolbarGroup>
              <ToolbarButton
                onClick={() => execCommand('insertUnorderedList')}
                active={activeFormats.has('ul')}
                title="Bullet List"
              >
                <List className="w-4 h-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => execCommand('insertOrderedList')}
                active={activeFormats.has('ol')}
                title="Numbered List"
              >
                <ListOrdered className="w-4 h-4" />
              </ToolbarButton>
            </ToolbarGroup>

            <ToolbarDivider />

            {/* Alignment */}
            <ToolbarGroup>
              <ToolbarButton
                onClick={() => execCommand('justifyLeft')}
                active={activeFormats.has('left')}
                title="Align Left"
              >
                <AlignLeft className="w-4 h-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => execCommand('justifyCenter')}
                active={activeFormats.has('center')}
                title="Align Center"
              >
                <AlignCenter className="w-4 h-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => execCommand('justifyRight')}
                active={activeFormats.has('right')}
                title="Align Right"
              >
                <AlignRight className="w-4 h-4" />
              </ToolbarButton>
            </ToolbarGroup>

            <ToolbarDivider />

            {/* Links & More */}
            <ToolbarGroup>
              <ToolbarButton
                onClick={insertLink}
                title="Insert Link (Ctrl+K)"
              >
                <Link2 className="w-4 h-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={removeLink}
                title="Remove Link"
              >
                <Unlink className="w-4 h-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={insertHorizontalRule}
                title="Horizontal Line"
              >
                <Minus className="w-4 h-4" />
              </ToolbarButton>
            </ToolbarGroup>

            <ToolbarDivider />

            {/* Undo/Redo & Utils */}
            <ToolbarGroup>
              <ToolbarButton
                onClick={() => execCommand('undo')}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => execCommand('redo')}
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-4 h-4" />
              </ToolbarButton>
              
              <ToolbarButton
                onClick={clearFormatting}
                title="Clear Formatting"
              >
                <RotateCcw className="w-4 h-4" />
              </ToolbarButton>
            </ToolbarGroup>
          </div>

          {/* Right side - Stats & Actions */}
          <div className="flex items-center gap-2">
            {/* Quick stats toggle */}
            <button
              type="button"
              onClick={() => setShowStats(!showStats)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                transition-all duration-150
                ${showStats 
                  ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                }
              `}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Stats
            </button>

            {/* Copy button */}
            <button
              type="button"
              onClick={copyContent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 transition-all"
            >
              {copied ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>

            {/* Fullscreen toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 transition-all"
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar (Collapsible) */}
      {showStats && (
        <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 border-b border-gray-200 px-4 py-2 flex-shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div>
                  <span className="font-bold text-gray-800">{wordCount}</span>
                  <span className="text-gray-500 ml-1">words</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <Type className="w-3.5 h-3.5 text-green-600" />
                </div>
                <div>
                  <span className="font-bold text-gray-800">{charCount}</span>
                  <span className="text-gray-500 ml-1">characters</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 rounded-lg">
                  <Target className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div>
                  <span className="font-bold text-gray-800">{sentenceCount}</span>
                  <span className="text-gray-500 ml-1">sentences</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded-lg">
                  <List className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <div>
                  <span className="font-bold text-gray-800">{paragraphCount}</span>
                  <span className="text-gray-500 ml-1">paragraphs</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <div>
                  <span className="font-bold text-gray-800">{readingTime}</span>
                  <span className="text-gray-500 ml-1">min read</span>
                </div>
              </div>
            </div>
            
            {selectedText && (
              <div className="text-xs bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                <span className="text-gray-500">Selected:</span>
                <span className="font-bold text-gray-800 ml-1">
                  {selectedText.split(' ').filter(w => w).length} words
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Word Count Progress Bar with Auto-save Indicator */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium
              ${limitStatus.isOver 
                ? 'bg-red-50 border-red-200 text-red-700' 
                : limitStatus.isNear 
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : limitStatus.isGood
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-blue-50 border-blue-200 text-blue-700'
              }
            `}>
              <span className="text-lg font-bold">{wordCount}</span>
              <span className="text-sm opacity-75">/ {wordLimit}</span>
            </div>
            
            {/* Progress bar */}
            <div className="flex-1 max-w-xs h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getProgressColor()}`}
                style={{ width: `${Math.min(limitStatus.percentage, 100)}%` }}
              />
            </div>
            
            <span className={`text-sm font-medium ${getProgressTextColor()}`}>
              {limitStatus.isOver 
                ? `${wordCount - wordLimit} over` 
                : `${limitStatus.remaining} remaining`
              }
            </span>
          </div>

          {/* Auto-save indicator - subtle, non-intrusive */}
          <div className="flex items-center gap-2">
            <div 
              ref={saveIndicatorRef}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300"
              style={{ opacity: 0.6 }}
            >
              <div 
                className="save-dot w-2 h-2 rounded-full bg-green-400 transition-all duration-300"
              />
              <span className="text-xs text-gray-500 font-medium">
                Auto-saving
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className={`relative ${isFullscreen ? 'flex-1 overflow-auto' : ''}`}>
        {/* Placeholder */}
        {wordCount === 0 && !isFocused && isInitialized && (
          <div className="absolute top-8 left-8 pointer-events-none text-gray-400 z-10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5" />
              <p className="text-lg font-medium">Start writing your essay...</p>
            </div>
            <div className="space-y-2 text-sm">
              <p className="opacity-75">Quick tips:</p>
              <ul className="space-y-1 opacity-75 ml-4">
                <li className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Ctrl+B</kbd>
                  <span>Bold</span>
                </li>
                <li className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Ctrl+I</kbd>
                  <span>Italic</span>
                </li>
                <li className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Ctrl+U</kbd>
                  <span>Underline</span>
                </li>
                <li className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Ctrl+S</kbd>
                  <span>Save now</span>
                </li>
                <li className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Ctrl+K</kbd>
                  <span>Insert Link</span>
                </li>
              </ul>
              <p className="opacity-60 text-xs mt-3 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                Your work is auto-saved every 15 seconds
              </p>
            </div>
          </div>
        )}

        {/* Word limit warning overlay */}
        {limitStatus.isOver && (
          <div className="absolute top-4 right-4 z-20">
            <div className="bg-red-500 text-white px-4 py-3 rounded-xl shadow-lg animate-pulse">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <p className="font-bold">Over word limit!</p>
                  <p className="text-sm opacity-90">
                    Remove {wordCount - wordLimit} words
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Good progress indicator */}
        {limitStatus.isGood && !limitStatus.isOver && (
          <div className="absolute top-4 right-4 z-20">
            <div className="bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Great length!</span>
            </div>
          </div>
        )}

        {/* Content Editable Area */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleContentChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => {
            setIsFocused(true)
            updateActiveFormats()
          }}
          onBlur={() => setIsFocused(false)}
          onMouseUp={updateActiveFormats}
          onKeyUp={updateActiveFormats}
          className={`
            outline-none focus:ring-0
            prose prose-lg max-w-none
            transition-all duration-200
            ${isFullscreen ? 'min-h-full p-12' : 'min-h-[500px] p-8'}
            ${isFocused ? 'bg-white' : 'bg-gray-50/30'}
          `}
          style={{
            fontSize: '17px',
            lineHeight: '1.9',
            fontFamily: 'Georgia, "Times New Roman", serif',
            color: '#1f2937',
            caretColor: '#3b82f6',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'pre-wrap'
          }}
          role="textbox"
          aria-label="Essay editor"
          aria-multiline="true"
          spellCheck
          data-gramm="false"
          data-gramm_editor="false"
          data-enable-grammarly="false"
        />
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 px-4 py-2.5 flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-gray-200 rounded font-mono">Ctrl+S</kbd>
              <span>save now</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-gray-200 rounded font-mono">Ctrl+B</kbd>
              <span>bold</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-gray-200 rounded font-mono">Ctrl+I</kbd>
              <span>italic</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-gray-200 rounded font-mono">Ctrl+Z</kbd>
              <span>undo</span>
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-green-600">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Auto-save enabled
            </span>
            {lastSaved && (
              <span className="text-gray-400">
                Last saved: {new Date(lastSaved).toLocaleTimeString()}
              </span>
            )}
            <span className={`font-medium ${getProgressTextColor()}`}>
              {limitStatus.isOver 
                ? '⚠️ Over limit' 
                : limitStatus.isNear 
                  ? '⚡ Almost there' 
                  : limitStatus.isGood
                    ? '✓ Good length'
                    : `${Math.round(limitStatus.percentage)}% complete`
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison - prevent re-renders during typing and auto-save
  return (
    prevProps.essayId === nextProps.essayId &&
    prevProps.wordLimit === nextProps.wordLimit &&
    prevProps.lastSaved === nextProps.lastSaved
    // NOT comparing content, onChange, onSave - all handled via refs
  )
})

export default EssayEditor