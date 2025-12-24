import { useState } from 'react';
import { Plus, Check, X, Type, CheckSquare } from 'lucide-react';
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
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleAdd = (type: 'note' | 'task') => {
    if (newText.trim()) {
      onAddItem(newText.trim(), type);
      setNewText('');
    }
  };

  const startEdit = (item: ContentItem) => {
    if (item.type === 'note') {
      setEditingId(item.id);
      setEditText(item.text);
    }
  };

  const saveEdit = () => {
    if (editingId && editText.trim()) {
      onUpdateItem(editingId, editText.trim());
    }
    setEditingId(null);
    setEditText('');
  };

  return (
    <div className="w-full p-4 animate-fade-in flex flex-col h-full">
      {/* Content list */}
      <div className="flex-1 space-y-3 mb-4 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 group animate-slide-up"
          >
            {item.type === 'task' ? (
              <>
                <button
                  onClick={() => onToggleItem(item.id)}
                  className={`
                    flex-shrink-0 w-5 h-5 mt-0.5 rounded border
                    flex items-center justify-center
                    transition-smooth tap-highlight-none
                    ${item.completed 
                      ? 'bg-primary border-primary' 
                      : 'border-muted-foreground/40 hover:border-muted-foreground'
                    }
                  `}
                >
                  {item.completed && <Check className="w-3 h-3 text-primary-foreground" />}
                </button>
                <span
                  className={`
                    flex-1 text-sm font-light transition-smooth leading-relaxed
                    ${item.completed ? 'text-muted-foreground line-through' : 'text-foreground'}
                  `}
                >
                  {item.text}
                </span>
              </>
            ) : (
              <>
                <div className="flex-shrink-0 w-5 h-5 mt-0.5 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                </div>
                {editingId === item.id ? (
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                    autoFocus
                    className="
                      flex-1 text-sm font-light leading-relaxed
                      bg-transparent text-foreground
                      border-b border-primary
                      focus:outline-none
                    "
                  />
                ) : (
                  <span
                    onClick={() => startEdit(item)}
                    className="
                      flex-1 text-sm font-light text-foreground leading-relaxed
                      cursor-text hover:text-foreground/80 transition-smooth
                    "
                  >
                    {item.text}
                  </span>
                )}
              </>
            )}
            
            <button
              onClick={() => onDeleteItem(item.id)}
              className="
                opacity-0 group-hover:opacity-100
                p-1 text-muted-foreground hover:text-destructive
                transition-smooth tap-highlight-none flex-shrink-0
              "
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground/60 font-light py-8 text-center">
            Start writing...
          </p>
        )}
      </div>

      {/* Input area */}
      <div className="flex items-center gap-2 border-t border-border pt-4">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newText.trim()) {
              handleAdd('note');
            }
          }}
          placeholder="Write something..."
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
          onClick={() => handleAdd('note')}
          disabled={!newText.trim()}
          title="Add as note"
          className="
            p-2 text-muted-foreground
            hover:text-primary disabled:opacity-40
            transition-smooth tap-highlight-none
          "
        >
          <Type className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleAdd('task')}
          disabled={!newText.trim()}
          title="Add as task"
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
