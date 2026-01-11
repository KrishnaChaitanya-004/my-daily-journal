import { Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered } from 'lucide-react';

interface RichTextToolbarProps {
  onFormat: (format: string) => void;
}

const RichTextToolbar = ({ onFormat }: RichTextToolbarProps) => {
  const buttons = [
    { icon: Bold, format: 'bold', title: 'Bold' },
    { icon: Italic, format: 'italic', title: 'Italic' },
    { icon: Underline, format: 'underline', title: 'Underline/Highlight' },
    { icon: Heading1, format: 'h1', title: 'Heading 1' },
    { icon: Heading2, format: 'h2', title: 'Heading 2' },
    { icon: List, format: 'bullet', title: 'Bullet List' },
    { icon: ListOrdered, format: 'numbered', title: 'Numbered List' },
  ];

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-secondary/30 overflow-x-auto">
      {buttons.map(({ icon: Icon, format, title }) => (
        <button
          key={format}
          onClick={() => onFormat(format)}
          title={title}
          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-smooth tap-highlight-none flex-shrink-0"
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
};

export default RichTextToolbar;
