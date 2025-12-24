import { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import type { Todo } from '@/hooks/useDiaryStorage';

interface TodoSectionProps {
  todos: Todo[];
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const TodoSection = ({ todos, onAdd, onToggle, onDelete }: TodoSectionProps) => {
  const [newTodo, setNewTodo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      onAdd(newTodo);
      setNewTodo('');
    }
  };

  return (
    <div className="w-full p-4 animate-fade-in">
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4 font-medium">
        Tasks for the day
      </h3>

      {/* Todo list */}
      <div className="space-y-2 mb-4">
        {todos.map((todo) => (
          <div
            key={todo.id}
            className="flex items-center gap-3 group animate-slide-up"
          >
            <button
              onClick={() => onToggle(todo.id)}
              className={`
                flex-shrink-0 w-5 h-5 rounded border
                flex items-center justify-center
                transition-smooth tap-highlight-none
                ${todo.completed 
                  ? 'bg-primary border-primary' 
                  : 'border-muted-foreground/40 hover:border-muted-foreground'
                }
              `}
            >
              {todo.completed && <Check className="w-3 h-3 text-primary-foreground" />}
            </button>
            
            <span
              className={`
                flex-1 text-sm font-light transition-smooth
                ${todo.completed ? 'text-muted-foreground line-through' : 'text-foreground'}
              `}
            >
              {todo.text}
            </span>
            
            <button
              onClick={() => onDelete(todo.id)}
              className="
                opacity-0 group-hover:opacity-100
                p-1 text-muted-foreground hover:text-destructive
                transition-smooth tap-highlight-none
              "
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        {todos.length === 0 && (
          <p className="text-sm text-muted-foreground/60 font-light py-2">
            No tasks yet
          </p>
        )}
      </div>

      {/* Add new todo */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
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
          type="submit"
          disabled={!newTodo.trim()}
          className="
            p-2 text-muted-foreground
            hover:text-primary disabled:opacity-40
            transition-smooth tap-highlight-none
          "
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default TodoSection;
