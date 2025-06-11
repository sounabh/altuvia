import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3,
  Quote,
  Undo,
  Redo,
  Type
} from 'lucide-react';



export const TiptapEditor = ({
  content,
  onChange,
  placeholder = "Start crafting your compelling essay...",
  limit = 500
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
      onChange(html, wordCount);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-essay max-w-none focus:outline-none',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const wordCount = editor.storage.characterCount.words();
  const characterCount = editor.storage.characterCount.characters();
  const wordPercentage = Math.round((wordCount / limit) * 100);

  return (
    <div className="border border-essay-gray-200 rounded-xl overflow-hidden bg-white shadow-premium">
      {/* Premium Toolbar */}
      <div className="editor-toolbar px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-1">
          {/* Text Formatting */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`toolbar-button ${editor.isActive('bold') ? 'is-active' : ''}`}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`toolbar-button ${editor.isActive('italic') ? 'is-active' : ''}`}
            >
              <Italic className="h-4 w-4" />
            </Button>
          </div>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          {/* Headings */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`toolbar-button ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`toolbar-button ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`toolbar-button ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
            >
              <Heading3 className="h-4 w-4" />
            </Button>
          </div>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          {/* Lists */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`toolbar-button ${editor.isActive('bulletList') ? 'is-active' : ''}`}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`toolbar-button ${editor.isActive('orderedList') ? 'is-active' : ''}`}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`toolbar-button ${editor.isActive('blockquote') ? 'is-active' : ''}`}
            >
              <Quote className="h-4 w-4" />
            </Button>
          </div>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          {/* Undo/Redo */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="toolbar-button"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="toolbar-button"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Word Count Display */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <Type className="h-4 w-4 text-essay-gray-400" />
            <span className={`font-medium ${
              wordPercentage > 100 ? 'text-essay-error' :
              wordPercentage > 90 ? 'text-essay-warning' :
              'text-essay-gray-600'
            }`}>
              {wordCount} / {limit} words
            </span>
          </div>
          <div className="text-essay-gray-400">
            {characterCount} characters
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="relative">
        <EditorContent 
          editor={editor} 
          className="min-h-[400px] custom-scroll"
        />
        
        {/* Progress indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-essay-gray-100">
          <div 
            className={`h-full transition-all duration-300 ${
              wordPercentage > 100 ? 'bg-essay-error' :
              wordPercentage > 90 ? 'bg-essay-warning' :
              'bg-essay-blue'
            }`}
            style={{ width: `${Math.min(wordPercentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
