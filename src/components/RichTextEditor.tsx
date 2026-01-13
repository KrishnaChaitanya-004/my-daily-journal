import { useRef, useEffect, useCallback } from 'react';
import { Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered } from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

const RichTextEditor = ({ 
  content, 
  onChange, 
  placeholder = 'Start writing...', 
  autoFocus = false,
  className = ''
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Sync content from props to editor
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      // Only update if content is actually different
      if (editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content || '';
      }
    }
    isInternalChange.current = false;
  }, [content]);

  // Auto focus
  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus();
      // Move cursor to end
      const selection = window.getSelection();
      if (selection) {
        selection.selectAllChildren(editorRef.current);
        selection.collapseToEnd();
      }
    }
  }, [autoFocus]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      const html = editorRef.current.innerHTML;
      // Convert <br> only content to empty
      const cleaned = html === '<br>' ? '' : html;
      onChange(cleaned);
    }
  }, [onChange]);

  const applyFormat = useCallback((command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
  }, [handleInput]);

  const applyHeading = useCallback((level: 1 | 2) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    editorRef.current?.focus();
    
    // Get the current block element
    const range = selection.getRangeAt(0);
    let container = range.commonAncestorContainer;
    
    // Find the block-level parent
    while (container && container !== editorRef.current) {
      if (container.nodeType === Node.ELEMENT_NODE) {
        const el = container as HTMLElement;
        if (['P', 'DIV', 'H1', 'H2', 'H3'].includes(el.tagName)) {
          break;
        }
      }
      container = container.parentNode as Node;
    }

    // Use formatBlock command
    const tag = level === 1 ? 'h1' : 'h2';
    
    // Check if already this heading - toggle off
    if (container && container.nodeType === Node.ELEMENT_NODE) {
      const el = container as HTMLElement;
      if (el.tagName.toLowerCase() === tag) {
        document.execCommand('formatBlock', false, 'div');
        handleInput();
        return;
      }
    }
    
    document.execCommand('formatBlock', false, tag);
    handleInput();
  }, [handleInput]);

  const applyList = useCallback((ordered: boolean) => {
    editorRef.current?.focus();
    document.execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList', false);
    handleInput();
  }, [handleInput]);

  const buttons = [
    { icon: Bold, action: () => applyFormat('bold'), title: 'Bold' },
    { icon: Italic, action: () => applyFormat('italic'), title: 'Italic' },
    { icon: Underline, action: () => applyFormat('underline'), title: 'Underline' },
    { icon: Heading1, action: () => applyHeading(1), title: 'Heading 1' },
    { icon: Heading2, action: () => applyHeading(2), title: 'Heading 2' },
    { icon: List, action: () => applyList(false), title: 'Bullet List' },
    { icon: ListOrdered, action: () => applyList(true), title: 'Numbered List' },
  ];

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-secondary/30 overflow-x-auto shrink-0">
        {buttons.map(({ icon: Icon, action, title }) => (
          <button
            key={title}
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent blur
            }}
            onClick={action}
            title={title}
            type="button"
            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-smooth tap-highlight-none flex-shrink-0"
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        className="
          flex-1 p-4 overflow-auto
          bg-transparent text-foreground text-sm font-light
          focus:outline-none
          leading-relaxed
          [&:empty]:before:content-[attr(data-placeholder)]
          [&:empty]:before:text-muted-foreground/60
          [&:empty]:before:pointer-events-none
          [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-3 [&_h1]:mb-1
          [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-2 [&_h2]:mb-1
          [&_ul]:list-disc [&_ul]:pl-5
          [&_ol]:list-decimal [&_ol]:pl-5
          [&_li]:py-0.5
          [&_u]:underline [&_u]:decoration-primary
        "
        suppressContentEditableWarning
      />
    </div>
  );
};

export default RichTextEditor;