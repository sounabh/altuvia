"use client"

import React, { useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Type,
  Strikethrough,
} from "lucide-react"


// EssayEditor component accepts content, onChange handler, and wordLimit as props
export function EssayEditor({ content, onChange, wordLimit }) {

  // Initialize TipTap editor with StarterKit and styles
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none focus:outline-none min-h-[500px] p-6 text-gray-800 leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const text = editor.getText()
      const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
      onChange(html, wordCount)
    },
  })

  // Sync content when prop changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) return null

  // Toolbar button with dynamic styling and tooltip
  const ToolbarButton = ({
    onClick,
    isActive,
    children,
    title,
    variant = "default",
  }) => (
    <Button
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      title={title}
      className={`h-9 w-9 p-0 transition-all duration-200 ${
        isActive
          ? "bg-[#3598FE] text-white shadow-md hover:bg-[#2563EB]"
          : "hover:bg-gray-100 text-gray-600 hover:text-gray-800"
      }`}
    >
      {children}
    </Button>
  )

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">

      {/* Toolbar */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-3">
        <div className="flex items-center space-x-1 flex-wrap gap-1">

          {/* Text formatting options */}
          <div className="flex items-center space-x-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive("strike")}
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </ToolbarButton>
          </div>

          {/* Divider */}
          <Separator orientation="vertical" className="h-6 mx-2" />

          {/* Heading levels */}
          <div className="flex items-center space-x-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive("heading", { level: 2 })}
              title="Heading 2"
            >
              <Type className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive("heading", { level: 3 })}
              title="Heading 3"
            >
              <Type className="w-3 h-3" />
            </ToolbarButton>
          </div>

          {/* Divider */}
          <Separator orientation="vertical" className="h-6 mx-2" />

          {/* Lists and Quote */}
          <div className="flex items-center space-x-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive("bulletList")}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive("blockquote")}
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </ToolbarButton>
          </div>

          {/* Divider */}
          <Separator orientation="vertical" className="h-6 mx-2" />

          {/* Undo / Redo */}
          <div className="flex items-center space-x-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </ToolbarButton>
          </div>
        </div>
      </div>

      {/* Main Editor Body */}
      <div className="bg-white relative">
        <EditorContent editor={editor} className="min-h-[500px] focus-within:outline-none" />

        {/* Placeholder Tips when editor is empty */}
        {editor.getText().length === 0 && (
          <div className="absolute top-6 left-6 pointer-events-none">
            <p className="text-gray-400 text-lg">Start writing your compelling story...</p>
            <div className="mt-4 space-y-2 text-sm text-gray-300">
              <p>💡 Tip: Begin with a specific moment or challenge</p>
              <p>🎯 Focus: Answer the prompt directly and personally</p>
              <p>📝 Structure: Introduction → Story → Impact → Future</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer with info and autosave status */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-xs text-gray-500">

          <div className="flex items-center space-x-4">
            <span>Use Ctrl+B for bold, Ctrl+I for italic</span>
            <span>•</span>
            <span>Press Tab for suggestions</span>
          </div>

          <div className="flex items-center space-x-2">
            <span>Auto-save enabled</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>

        </div>
      </div>
    </div>
  )
}
