import { Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered } from 'lucide-react';

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

  const handleFormat = (format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.slice(start, end);

    switch (format) {
      case 'bold':
        applyInlineFormat('**', '**', selectedText, start, end);
        break;
      case 'italic':
        applyInlineFormat('_', '_', selectedText, start, end);
        break;
      case 'underline':
        applyInlineFormat('__', '__', selectedText, start, end);
        break;
      case 'h1':
        applyLinePrefix('# ', start);
        break;
      case 'h2':
        applyLinePrefix('## ', start);
        break;
      case 'bullet':
        applyLinePrefix('• ', start);
        break;
      case 'numbered':
        applyNumberedPrefix(start);
        break;
    }
  };

  const applyInlineFormat = (prefix: string, suffix: string, selectedText: string, start: number, end: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (selectedText) {
      // Wrap selected text
      const newContent = content.slice(0, start) + prefix + selectedText + suffix + content.slice(end);
      onContentChange(newContent);
      
      // Position cursor after the formatted text
      setTimeout(() => {
        const newPos = start + prefix.length + selectedText.length + suffix.length;
        textarea.setSelectionRange(newPos, newPos);
        textarea.focus();
      }, 0);
    } else {
      // Insert markers and place cursor between them
      const newContent = content.slice(0, start) + prefix + suffix + content.slice(end);
      onContentChange(newContent);
      
      setTimeout(() => {
        const cursorPos = start + prefix.length;
        textarea.setSelectionRange(cursorPos, cursorPos);
        textarea.focus();
      }, 0);
    }
  };

  const applyLinePrefix = (prefix: string, cursorPos: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Find start of current line
    const lineStart = content.lastIndexOf('\n', cursorPos - 1) + 1;
    const lineEnd = content.indexOf('\n', cursorPos);
    const actualLineEnd = lineEnd === -1 ? content.length : lineEnd;
    const currentLine = content.slice(lineStart, actualLineEnd);

    // Remove any existing prefix (headers, bullets)
    const cleanLine = currentLine.replace(/^(#{1,2}\s|•\s|\d+\.\s)/, '');

    // Check if same prefix already exists - toggle it off
    if (currentLine.startsWith(prefix)) {
      const newContent = content.slice(0, lineStart) + cleanLine + content.slice(actualLineEnd);
      onContentChange(newContent);
      setTimeout(() => {
        textarea.setSelectionRange(lineStart, lineStart);
        textarea.focus();
      }, 0);
    } else {
      // Apply new prefix
      const newContent = content.slice(0, lineStart) + prefix + cleanLine + content.slice(actualLineEnd);
      onContentChange(newContent);
      setTimeout(() => {
        const newCursorPos = lineStart + prefix.length + cleanLine.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);
    }
  };

  const applyNumberedPrefix = (cursorPos: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Find start of current line
    const lineStart = content.lastIndexOf('\n', cursorPos - 1) + 1;
    const lineEnd = content.indexOf('\n', cursorPos);
    const actualLineEnd = lineEnd === -1 ? content.length : lineEnd;
    const currentLine = content.slice(lineStart, actualLineEnd);

    // Check if already numbered - toggle off
    if (currentLine.match(/^\d+\.\s/)) {
      const cleanLine = currentLine.replace(/^\d+\.\s/, '');
      const newContent = content.slice(0, lineStart) + cleanLine + content.slice(actualLineEnd);
      onContentChange(newContent);
      setTimeout(() => {
        textarea.setSelectionRange(lineStart, lineStart);
        textarea.focus();
      }, 0);
      return;
    }

    // Find previous numbered item to continue sequence
    const beforeContent = content.slice(0, lineStart);
    const lines = beforeContent.split('\n');
    let lastNum = 0;
    for (let i = lines.length - 1; i >= 0; i--) {
      const match = lines[i].match(/^(\d+)\./);
      if (match) {
        lastNum = parseInt(match[1]);
        break;
      } else if (lines[i].trim() !== '') {
        break;
      }
    }

    const cleanLine = currentLine.replace(/^(•\s)/, '');
    const prefix = `${lastNum + 1}. `;
    const newContent = content.slice(0, lineStart) + prefix + cleanLine + content.slice(actualLineEnd);
    onContentChange(newContent);
    
    setTimeout(() => {
      const newCursorPos = lineStart + prefix.length + cleanLine.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-secondary/30 overflow-x-auto">
      {buttons.map(({ icon: Icon, format, title }) => (
        <button
          key={format}
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
