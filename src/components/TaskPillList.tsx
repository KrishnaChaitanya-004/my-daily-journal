import { Check } from 'lucide-react';
import { DiaryTask } from '@/lib/tasks';
import { cn } from '@/lib/utils';

interface TaskPillListProps {
  tasks: DiaryTask[];
  onToggleTask: (taskId: string) => void;
  className?: string;
}

const TaskPillList = ({ tasks, onToggleTask, className }: TaskPillListProps) => {
  if (tasks.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {tasks.map((task) => (
        <button
          key={task.id}
          onClick={() => onToggleTask(task.id)}
          className={cn(
            'inline-flex w-fit max-w-full items-center gap-2 rounded-full border px-3 py-2 text-left text-sm leading-none transition-all duration-200',
            task.completed
              ? 'border-primary/30 bg-primary/10 text-foreground/70'
              : 'border-border/80 bg-card/70 text-foreground hover:border-primary/25 hover:bg-secondary/40 active:scale-[0.99]'
          )}
        >
          <span
            className={cn(
              'flex h-[0.9em] w-[0.9em] flex-none items-center justify-center rounded-[0.24em] border',
              task.completed ? 'border-primary bg-primary text-primary-foreground' : 'border-primary/45 text-transparent'
            )}
          >
            {task.completed ? <Check className="h-[0.72em] w-[0.72em]" /> : null}
          </span>
          <span className={cn('truncate', task.completed && 'line-through')}>{task.title}</span>
        </button>
      ))}
    </div>
  );
};

export default TaskPillList;
