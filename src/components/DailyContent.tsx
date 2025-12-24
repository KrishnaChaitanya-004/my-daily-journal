import { useState, useRef, useEffect } from 'react';
import { CheckSquare } from 'lucide-react';

interface DailyContentProps {
  content: string;
  onUpdateContent: (content: string) => void;
  onAddTask: (taskText: string) => void;
  onToggleTask: (lineIndex: number) => void;
}

const DailyContent = ({ 
  content, 
  onUpdateContent, 
  onAddTask,
  onToggleTask 
}: DailyContentProps) => {
  const [taskText, setTaskText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Sync localContent when content changes (e.g., date change or task toggle)
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    onUpdateContent(newContent);
  };

  const handleAddTask = () => {
    if (taskText.trim()) {
      onAddTask(taskText.trim());
      setTaskText('');
    }
  };

  // Parse content into lines for rendering with interactive checkboxes
  const renderContent = () => {
    if (!content) return null;
    
    const lines = content.split('\n');
    
    return lines.map((line, index) => {
      const isUncheckedTask = line.startsWith('□ ');
      const isCheckedTask = line.startsWith('✓ ');
      
      if (isUncheckedTask || isCheckedTask) {
        const taskContent = line.slice(2);
        return (
          <div key={index} className="flex items-start gap-2 py-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleTask(index);
              }}
              className={`
                text-base leading-relaxed transition-smooth tap-highlight-none flex-shrink-0
                ${isCheckedTask ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
              `}
            >
              {isCheckedTask ? '✓' : '□'}
            </button>
            <span
              className={`
                text-sm font-light leading-relaxed
                ${isCheckedTask ? 'line-through text-muted-foreground' : 'text-foreground'}
              `}
            >
              {taskContent}
            </span>
          </div>
        );
      }
      
      return (
        <div key={index} className="text-sm font-light leading-relaxed text-foreground py-0.5">
          {line || <br />}
        </div>
      );
    });
  };

  return (
    <div className="w-full p-4 animate-fade-in flex flex-col h-full">
      {/* Main content area - click to edit */}
      <div 
        className="flex-1 mb-4 overflow-y-auto cursor-text"
        onClick={() => {
          setIsEditing(true);
          setTimeout(() => textareaRef.current?.focus(), 0);
        }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={localContent}
            onChange={handleContentChange}
            onBlur={() => setIsEditing(false)}
            placeholder="Start writing..."
            className="
              w-full h-full min-h-[200px]
              bg-transparent text-foreground text-sm font-light
              placeholder:text-muted-foreground/60
              focus:outline-none resize-none
              leading-relaxed
            "
            autoFocus
          />
        ) : (
          <div className="min-h-[200px]">
            {content ? (
              renderContent()
            ) : (
              <span className="text-muted-foreground/60 text-sm font-light">
                Start writing...
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom bar - for adding tasks */}
      <div className="flex items-center gap-2 border-t border-border pt-4">
        <input
          type="text"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && taskText.trim()) {
              handleAddTask();
            }
          }}
          placeholder="Add a task..."
          className="
            flex-1 py-2 px-0
            bg-transparent text-foreground text-sm font-light
            placeholder:text-muted-foreground/60
            border-b border-border
            focus:outline-none focus:border-primary
            transition-smooth
          "
        />
        <button
          onClick={handleAddTask}
          disabled={!taskText.trim()}
          title="Add task"
          className="
            p-2 text-muted-foreground
            hover:text-primary disabled:opacity-40
            transition-smooth tap-highlight-none
          "
        >
          <CheckSquare className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default DailyContent;
