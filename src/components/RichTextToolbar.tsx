import { Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered } from 'lucide-react';
import { useCallback } from 'react';

interface RichTextToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  content: string;
  onContentChange: (content: string) => void;
}

const RichTextToolbar = ({ textareaRef, content, onContentChange }: RichTextToolbarProps) => {
  const buttons = [
    { icon: Bold, format: 'bold', title: 'Bold' },
    { icon: Italic, format: 'italic', title: 'Italic' },
    { icon: Underline, format: 'underline', title: 'Underline/Highlight' },
    { icon: Heading1, format: 'h1', title: 'Heading 1' },
    { icon: Heading2, format: 'h2', title: 'Heading 2' },
    { icon: List, format: 'bullet', title: 'Bullet List' },
    { icon: ListOrdered, format: 'numbered', title: 'Numbered List' },
  ];

  const applyInlineFormat = useCallback((prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Get current selection from textarea directly
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = textarea.value;
    const selectedText = currentContent.substring(start, end);

    let newContent: string;
    let newCursorPos: number;

    if (selectedText.length > 0) {
      // Text is selected - wrap it with formatting
      newContent = 
        currentContent.substring(0, start) + 
        prefix + selectedText + suffix + 
        currentContent.substring(end);
      // Place cursor after the formatted text
      newCursorPos = start + prefix.length + selectedText.length + suffix.length;
    } else {
      // No selection - insert markers and place cursor in middle
      newContent = 
        currentContent.substring(0, start) + 
        prefix + suffix + 
        currentContent.substring(end);
      // Place cursor between the markers
      newCursorPos = start + prefix.length;
    }

    // Update content
    onContentChange(newContent);

    // Set cursor position after React re-renders
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  }, [textareaRef, onContentChange]);

  const applyLinePrefix = useCallback((prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const currentContent = textarea.value;

    // Find the start of the current line
    const lineStart = currentContent.lastIndexOf('\n', start - 1) + 1;
    // Find the end of the current line
    const lineEndIndex = currentContent.indexOf('\n', start);
    const lineEnd = lineEndIndex === -1 ? currentContent.length : lineEndIndex;
    
    const currentLine = currentContent.substring(lineStart, lineEnd);

    // Check if line already has the same prefix - toggle it off
    if (currentLine.startsWith(prefix)) {
      const newLine = currentLine.substring(prefix.length);
      const newContent = 
        currentContent.substring(0, lineStart) + 
        newLine + 
        currentContent.substring(lineEnd);
      
      onContentChange(newContent);

      requestAnimationFrame(() => {
        textarea.focus();
        const newCursorPos = Math.max(lineStart, start - prefix.length);
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      });
      return;
    }

    // Remove any existing prefix (headers, bullets, numbers)
    const cleanLine = currentLine.replace(/^(#{1,2}\s|•\s|\d+\.\s)/, '');
    const newLine = prefix + cleanLine;
    const newContent = 
      currentContent.substring(0, lineStart) + 
      newLine + 
      currentContent.substring(lineEnd);

    onContentChange(newContent);

    requestAnimationFrame(() => {
      textarea.focus();
      const newCursorPos = lineStart + newLine.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  }, [textareaRef, onContentChange]);

  const applyNumberedPrefix = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const currentContent = textarea.value;

    // Find the start of the current line
    const lineStart = currentContent.lastIndexOf('\n', start - 1) + 1;
    // Find the end of the current line
    const lineEndIndex = currentContent.indexOf('\n', start);
    const lineEnd = lineEndIndex === -1 ? currentContent.length : lineEndIndex;
    
    const currentLine = currentContent.substring(lineStart, lineEnd);

    // Check if already numbered - toggle off
    const numberedMatch = currentLine.match(/^(\d+)\.\s/);
    if (numberedMatch) {
      const newLine = currentLine.substring(numberedMatch[0].length);
      const newContent = 
        currentContent.substring(0, lineStart) + 
        newLine + 
        currentContent.substring(lineEnd);
      
      onContentChange(newContent);

      requestAnimationFrame(() => {
        textarea.focus();
        const newCursorPos = Math.max(lineStart, start - numberedMatch[0].length);
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      });
      return;
    }

    // Find previous numbered item to continue sequence
    const beforeContent = currentContent.substring(0, lineStart);
    const lines = beforeContent.split('\n');
    let lastNum = 0;
    for (let i = lines.length - 1; i >= 0; i--) {
      const match = lines[i].match(/^(\d+)\./);
      if (match) {
        lastNum = parseInt(match[1], 10);
        break;
      } else if (lines[i].trim() !== '') {
        break;
      }
    }

    // Remove any existing prefix
    const cleanLine = currentLine.replace(/^(#{1,2}\s|•\s)/, '');
    const prefix = `${lastNum + 1}. `;
    const newLine = prefix + cleanLine;
    const newContent = 
      currentContent.substring(0, lineStart) + 
      newLine + 
      currentContent.substring(lineEnd);

    onContentChange(newContent);

    requestAnimationFrame(() => {
      textarea.focus();
      const newCursorPos = lineStart + newLine.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  }, [textareaRef, onContentChange]);

  const handleFormat = useCallback((format: string) => {
    switch (format) {
      case 'bold':
        applyInlineFormat('**', '**');
        break;
      case 'italic':
        applyInlineFormat('_', '_');
        break;
      case 'underline':
        applyInlineFormat('__', '__');
        break;
      case 'h1':
        applyLinePrefix('# ');
        break;
      case 'h2':
        applyLinePrefix('## ');
        break;
      case 'bullet':
        applyLinePrefix('• ');
        break;
      case 'numbered':
        applyNumberedPrefix();
        break;
    }
  }, [applyInlineFormat, applyLinePrefix, applyNumberedPrefix]);

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-secondary/30 overflow-x-auto">
      {buttons.map(({ icon: Icon, format, title }) => (
        <button
          key={format}
          onMouseDown={(e) => {
            // Prevent blur of textarea
            e.preventDefault();
          }}
          onClick={() => handleFormat(format)}
          title={title}
          type="button"
          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-smooth tap-highlight-none flex-shrink-0"
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
};

export default RichTextToolbar;