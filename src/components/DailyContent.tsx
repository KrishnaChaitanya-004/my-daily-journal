import { useState } from 'react';
import { Type, CheckSquare } from 'lucide-react';
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
    setEditingId(item.id);
    setEditText(item.text);
  };

  const saveEdit = () => {
    if (editingId && editText.trim()) {
      onUpdateItem(editingId, editText.trim());
    }
    setEditingId(null);
    setEditText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    }
    if (e.key === 'Escape') {
      setEditingId(null);
      setEditText('');
    }
  };

  return (
    <div className="w-full p-4 animate-fade-in flex flex-col h-full">
      {/* Document-style flowing content */}
      <div className="flex-1 mb-4 overflow-y-auto">
        <div className="text-sm font-light leading-relaxed text-foreground">
          {items.length === 0 ? (
            <p className="text-muted-foreground/60 py-8 text-center">
              Start writing...
            </p>
          ) : (
            items.map((item, index) => (
              <span key={item.id} className="inline">
                {item.type === 'task' ? (
                  <span className="inline-flex items-baseline group">
                    <button
                      onClick={() => onToggleItem(item.id)}
                      className={`
                        inline-flex items-center justify-center
                        w-4 h-4 mr-1 align-middle
                        transition-smooth tap-highlight-none
                        ${item.completed ? 'text-primary' : 'text-muted-foreground'}
                      `}
                    >
                      {item.completed ? '✓' : '□'}
                    </button>
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="
                          bg-transparent border-b border-primary
                          focus:outline-none text-sm font-light
                        "
                        style={{ width: `${editText.length + 1}ch` }}
                      />
                    ) : (
                      <span
                        onClick={() => startEdit(item)}
                        onDoubleClick={() => onDeleteItem(item.id)}
                        className={`
                          cursor-pointer hover:text-primary transition-smooth
                          ${item.completed ? 'line-through text-muted-foreground' : ''}
                        `}
                        title="Click to edit, double-click to delete"
                      >
                        {item.text}
                      </span>
                    )}
                    {index < items.length - 1 && <br />}
                  </span>
                ) : (
                  <span className="inline group">
                    {editingId === item.id ? (
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        rows={Math.max(1, editText.split('\n').length)}
                        className="
                          bg-transparent border-b border-primary
                          focus:outline-none text-sm font-light
                          w-full resize-none
                        "
                      />
                    ) : (
                      <span
                        onClick={() => startEdit(item)}
                        onDoubleClick={() => onDeleteItem(item.id)}
                        className="cursor-pointer hover:text-foreground/80 transition-smooth whitespace-pre-wrap"
                        title="Click to edit, double-click to delete"
                      >
                        {item.text}
                      </span>
                    )}
                    {index < items.length - 1 && ' '}
                  </span>
                )}
              </span>
            ))
          )}
        </div>
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
