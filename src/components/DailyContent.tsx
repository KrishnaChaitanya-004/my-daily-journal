import { useState, useRef, useEffect } from 'react';
import { CheckSquare } from 'lucide-react';
import type { ContentItem } from '@/hooks/useDiaryStorage';

interface DailyContentProps {
  items: ContentItem[];
  onAddItem: (text: string, type: 'note' | 'task') => void;
  onUpdateItem: (id: string, text: string) => void;
  onToggleItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
}

const DailyContent = ({ 
  items, 
  onAddItem, 
  onUpdateItem, 
  onToggleItem, 
  onDeleteItem 
}: DailyContentProps) => {
  const [taskText, setTaskText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Get the note item (we'll use a single note for free-form text)
  const noteItem = items.find(item => item.type === 'note');
  const tasks = items.filter(item => item.type === 'task');
  
  const [noteText, setNoteText] = useState(noteItem?.text || '');
  
  // Sync noteText when noteItem changes (e.g., date change)
  useEffect(() => {
    setNoteText(noteItem?.text || '');
  }, [noteItem?.id, noteItem?.text]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setNoteText(newText);
    
    if (noteItem) {
      if (newText.trim()) {
        onUpdateItem(noteItem.id, newText);
      } else {
        onDeleteItem(noteItem.id);
      }
    } else if (newText.trim()) {
      onAddItem(newText, 'note');
    }
  };

  const handleAddTask = () => {
    if (taskText.trim()) {
      onAddItem(taskText.trim(), 'task');
      setTaskText('');
    }
  };

  return (
    <div className="w-full p-4 animate-fade-in flex flex-col h-full">
      {/* Free-form note area */}
      <div className="flex-1 mb-4 overflow-y-auto">
        <textarea
          ref={textareaRef}
          value={noteText}
          onChange={handleNoteChange}
          placeholder="Start writing..."
          className="
            w-full h-full min-h-[200px]
            bg-transparent text-foreground text-sm font-light
            placeholder:text-muted-foreground/60
            focus:outline-none resize-none
            leading-relaxed
          "
        />
        
        {/* Tasks displayed below notes */}
        {tasks.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-border pt-4">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className="flex items-center gap-2 group"
              >
                <button
                  onClick={() => onToggleItem(task.id)}
                  className={`
                    text-lg transition-smooth tap-highlight-none
                    ${task.completed ? 'text-primary' : 'text-muted-foreground'}
                  `}
                >
                  {task.completed ? '✓' : '□'}
                </button>
                <span
                  className={`
                    flex-1 text-sm font-light
                    ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}
                  `}
                >
                  {task.text}
                </span>
                <button
                  onClick={() => onDeleteItem(task.id)}
                  className="
                    opacity-0 group-hover:opacity-100
                    text-xs text-muted-foreground hover:text-destructive
                    transition-smooth
                  "
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom bar - only for adding tasks */}
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
