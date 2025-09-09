"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"

export function EssayEditor({ 
  content = '', 
  onChange, 
  wordLimit = 500,
  essayId,
  onSave,
  lastSaved,
  hasUnsavedChanges = false,
  isSaving = false 
}) {
  const editorRef = useRef(null)
  const [currentWordCount, setCurrentWordCount] = useState(0)
  const [isReady, setIsReady] = useState(false)
  
  // Prevent re-render loops with stable refs
  const debounceTimerRef = useRef(null)
  const lastProcessedContentRef = useRef('')
  const isInternalUpdateRef = useRef(false)
  const onChangeRef = useRef(onChange)
  const contentRef = useRef(content)
  
  // Update refs when props change but don't trigger re-renders
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])
  
  useEffect(() => {
    contentRef.current = content
  }, [content])

  /**
   * Stable word counting function
   */
  const countWords = useCallback((text) => {
    if (!text || typeof text !== 'string') return 0
    
    const plainText = text
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&[#\w]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    return plainText ? plainText.split(' ').filter(word => word.length > 0).length : 0
  }, [])

  /**
   * Stable cursor position utilities
   */
  const saveCursorPosition = useCallback(() => {
    if (!editorRef.current) return null
    
    try {
      const selection = window.getSelection()
      if (selection.rangeCount === 0) return null
      
      const range = selection.getRangeAt(0)
      return {
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        endContainer: range.endContainer,
        endOffset: range.endOffset
      }
    } catch (error) {
      return null
    }
  }, [])

  const restoreCursorPosition = useCallback((savedSelection) => {
    if (!savedSelection || !editorRef.current) return
    
    try {
      const selection = window.getSelection()
      const range = document.createRange()
      
      range.setStart(savedSelection.startContainer, savedSelection.startOffset)
      range.setEnd(savedSelection.endContainer, savedSelection.endOffset)
      
      selection.removeAllRanges()
      selection.addRange(range)
    } catch (error) {
      // Fallback: set cursor at end
      const editor = editorRef.current
      const range = document.createRange()
      range.selectNodeContents(editor)
      range.collapse(false)
      
      const selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }, [])

  /**
   * Stable content cleaning
   */
  const cleanContent = useCallback((html) => {
    if (!html) return ''
    
    // More conservative cleaning to avoid disrupting cursor
    return html
      .replace(/<div><br><\/div>/gi, '<br>')
      .replace(/<div>/gi, '<br>')
      .replace(/<\/div>/gi, '')
      .replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>')
      .replace(/^(<br\s*\/?>)+|(<br\s*\/?>)+$/gi, '')
      .replace(/<br>/gi, '<br/>') // Standardize line breaks
  }, [])

  /**
   * Optimized input handler with minimal re-renders
   */
  const handleInput = useCallback(() => {
    if (!editorRef.current || isInternalUpdateRef.current) return

    const editor = editorRef.current
    const htmlContent = editor.innerHTML
    
    // Save cursor position before any changes
    const savedSelection = saveCursorPosition()
    
    const wordCount = countWords(htmlContent)
    
    // Update word count immediately for UI
    setCurrentWordCount(wordCount)

    // Clean content if needed without disrupting cursor
    const cleanedContent = cleanContent(htmlContent)
    if (cleanedContent !== htmlContent) {
      isInternalUpdateRef.current = true
      editor.innerHTML = cleanedContent
      isInternalUpdateRef.current = false
      
      // Restore cursor position after cleaning
      if (savedSelection) {
        requestAnimationFrame(() => {
          restoreCursorPosition(savedSelection)
        })
      }
    }

    // Store processed content
    lastProcessedContentRef.current = cleanedContent

    // Clear existing debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Debounce onChange to prevent excessive calls
    debounceTimerRef.current = setTimeout(() => {
      if (onChangeRef.current && !isInternalUpdateRef.current) {
        onChangeRef.current(cleanedContent, wordCount)
      }
    }, 100)
  }, [cleanContent, countWords, saveCursorPosition, restoreCursorPosition])

  /**
   * Stable keyboard event handler
   */
  const handleKeyDown = useCallback((e) => {
    if (!editorRef.current || !isReady) return

    // Handle shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          document.execCommand('bold')
          handleInput()
          break
        case 'i':
          e.preventDefault()
          document.execCommand('italic')
          handleInput()
          break
        case 'u':
          e.preventDefault()
          document.execCommand('underline')
          handleInput()
          break
        case 's':
          e.preventDefault()
          if (onSave) onSave()
          break
      }
      return
    }

    // Handle Enter key for proper line breaks
    if (e.key === 'Enter') {
      e.preventDefault()
      
      const selection = window.getSelection()
      if (selection.rangeCount) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        
        const br = document.createElement('br')
        range.insertNode(br)
        
        range.setStartAfter(br)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
        
        // Trigger input handler after DOM is updated
        setTimeout(handleInput, 0)
      }
    }
  }, [isReady, handleInput, onSave])

  /**
   * Stable paste handler
   */
  const handlePaste = useCallback((e) => {
    e.preventDefault()
    
    if (!editorRef.current || !isReady) return
    
    const text = (e.clipboardData || window.clipboardData).getData('text/plain')
    if (!text) return
    
    const selection = window.getSelection()
    if (selection.rangeCount === 0) return
    
    const cleanText = text
      .replace(/\r?\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    const range = selection.getRangeAt(0)
    range.deleteContents()
    
    const textNode = document.createTextNode(cleanText)
    range.insertNode(textNode)
    
    range.setStartAfter(textNode)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
    
    setTimeout(handleInput, 0)
  }, [isReady, handleInput])

  /**
   * Stable formatting commands
   */
  const executeCommand = useCallback((command) => {
    if (!editorRef.current || !isReady) return
    
    // Save cursor position before formatting
    const savedSelection = saveCursorPosition()
    
    editorRef.current.focus()
    document.execCommand(command, false, null)
    
    if (savedSelection) {
      requestAnimationFrame(() => {
        restoreCursorPosition(savedSelection)
        handleInput()
      })
    } else {
      handleInput()
    }
  }, [isReady, saveCursorPosition, restoreCursorPosition, handleInput])

  const isCommandActive = useCallback((command) => {
    if (!isReady || !editorRef.current) return false
    try {
      return document.queryCommandState(command)
    } catch {
      return false
    }
  }, [isReady])

  /**
   * Initialize editor once
   */
  useEffect(() => {
    if (!editorRef.current) return

    const editor = editorRef.current
    
    editor.contentEditable = true
    editor.spellcheck = true
    editor.style.outline = 'none'
    editor.style.minHeight = '500px'
    
    const initialContent = cleanContent(content)
    isInternalUpdateRef.current = true
    editor.innerHTML = initialContent
    lastProcessedContentRef.current = initialContent
    isInternalUpdateRef.current = false
    
    const wordCount = countWords(initialContent)
    setCurrentWordCount(wordCount)
    setIsReady(true)
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, []) // Empty dependency array - run only once

  /**
   * Handle external content changes efficiently
   */
  useEffect(() => {
    if (!isReady || !editorRef.current || isInternalUpdateRef.current) return

    const newContent = cleanContent(content || '')
    
    // Only update if content is truly different
    if (newContent !== lastProcessedContentRef.current && newContent !== editorRef.current.innerHTML) {
      const editor = editorRef.current
      const hadFocus = document.activeElement === editor
      const savedSelection = hadFocus ? saveCursorPosition() : null
      
      isInternalUpdateRef.current = true
      editor.innerHTML = newContent
      lastProcessedContentRef.current = newContent
      
      const wordCount = countWords(newContent)
      setCurrentWordCount(wordCount)
      
      isInternalUpdateRef.current = false
      
      if (hadFocus && savedSelection) {
        requestAnimationFrame(() => {
          editor.focus()
          restoreCursorPosition(savedSelection)
        })
      }
    }
  }, [content, isReady, cleanContent, countWords, saveCursorPosition, restoreCursorPosition])

  /**
   * Stable event listeners
   */
  useEffect(() => {
    if (!isReady || !editorRef.current) return

    const editor = editorRef.current

    editor.addEventListener('input', handleInput, { passive: false })
    editor.addEventListener('keydown', handleKeyDown, { passive: false })
    editor.addEventListener('paste', handlePaste, { passive: false })

    return () => {
      editor.removeEventListener('input', handleInput)
      editor.removeEventListener('keydown', handleKeyDown)
      editor.removeEventListener('paste', handlePaste)
    }
  }, [isReady, handleInput, handleKeyDown, handlePaste])

  // Word limit calculations
  const wordLimitStatus = {
    percentage: Math.min(100, (currentWordCount / wordLimit) * 100),
    isOverLimit: currentWordCount > wordLimit,
    isNearLimit: currentWordCount > wordLimit * 0.9,
    wordsRemaining: Math.max(0, wordLimit - currentWordCount),
    isUnderTarget: currentWordCount < wordLimit * 0.5
  }

  const ToolbarButton = ({ onClick, isActive, children, title, disabled = false }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled || !isReady}
      className={`h-9 w-9 p-0 rounded transition-colors ${
        isActive
          ? "bg-blue-500 text-white hover:bg-blue-600"
          : "hover:bg-gray-100 text-gray-600 hover:text-gray-800"
      } ${disabled || !isReady ? "opacity-50 cursor-not-allowed" : ""} flex items-center justify-center`}
    >
      {children}
    </button>
  )

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
      {/* Toolbar */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-3">
        <div className="flex items-center justify-between">
          
          {/* Formatting controls */}
          <div className="flex items-center space-x-1">
            <ToolbarButton
              onClick={() => executeCommand('bold')}
              isActive={isCommandActive('bold')}
              title="Bold (Ctrl+B)"
            >
              <span className="font-bold text-sm">B</span>
            </ToolbarButton>

            <ToolbarButton
              onClick={() => executeCommand('italic')}
              isActive={isCommandActive('italic')}
              title="Italic (Ctrl+I)"
            >
              <span className="italic text-sm">I</span>
            </ToolbarButton>

            <ToolbarButton
              onClick={() => executeCommand('underline')}
              isActive={isCommandActive('underline')}
              title="Underline (Ctrl+U)"
            >
              <span className="underline text-sm">U</span>
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            <ToolbarButton
              onClick={() => executeCommand('insertUnorderedList')}
              title="Bullet List"
            >
              <span className="text-sm">•</span>
            </ToolbarButton>

            <ToolbarButton
              onClick={() => executeCommand('insertOrderedList')}
              title="Numbered List"
            >
              <span className="text-sm">1.</span>
            </ToolbarButton>
          </div>

          {/* Word count and status */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-1 bg-white rounded-lg border border-gray-200">
              <span className={`text-sm font-semibold ${
                wordLimitStatus.isOverLimit 
                  ? 'text-red-600' 
                  : wordLimitStatus.isNearLimit 
                    ? 'text-amber-600' 
                    : 'text-green-600'
              }`}>
                {currentWordCount}/{wordLimit}
              </span>
              
              <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(wordLimitStatus.percentage, 100)}%`,
                    backgroundColor: wordLimitStatus.isOverLimit 
                      ? '#EF4444' 
                      : wordLimitStatus.isNearLimit 
                        ? '#F59E0B' 
                        : '#10B981'
                  }}
                />
              </div>
            </div>

            {/* Save status */}
            {isSaving && (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                Saving...
              </span>
            )}
            {!isSaving && hasUnsavedChanges && (
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded">
                Unsaved
              </span>
            )}
            {!isSaving && !hasUnsavedChanges && lastSaved && (
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                Saved
              </span>
            )}

            {/* Manual save */}
            {onSave && (
              <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className="h-8 px-3 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                Save
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="bg-white relative">
        {!isReady && (
          <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500">Initializing editor...</p>
            </div>
          </div>
        )}

        <div
          ref={editorRef}
          className={`min-h-[500px] p-6 text-gray-800 leading-relaxed transition-opacity duration-200 ${
            !isReady ? 'opacity-30' : 'opacity-100'
          }`}
          style={{
            fontSize: '16px',
            lineHeight: '1.7',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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

        {/* Placeholder */}
        {currentWordCount === 0 && isReady && (
          <div className="absolute top-6 left-6 pointer-events-none z-10 text-gray-400">
            <p className="text-lg mb-2">Start writing your essay...</p>
            <p className="text-sm">Use the toolbar for formatting, or press Ctrl+B for bold, Ctrl+I for italic</p>
          </div>
        )}

        {/* Word limit warning */}
        {wordLimitStatus.isOverLimit && (
          <div className="absolute top-4 right-4 p-3 bg-red-50 border border-red-200 rounded-lg z-20">
            <p className="text-sm font-semibold text-red-700">Over Word Limit!</p>
            <p className="text-xs text-red-600">
              Remove {currentWordCount - wordLimit} words
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Ctrl+B bold, Ctrl+I italic, Ctrl+S save
          </div>
          <div className="text-xs text-gray-500">
            {wordLimitStatus.isOverLimit ? 'Over limit' :
             wordLimitStatus.isNearLimit ? 'Near limit' : 'Good length'}
          </div>
        </div>
      </div>
    </div>
  )
}