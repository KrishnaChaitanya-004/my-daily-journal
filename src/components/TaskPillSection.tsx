import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import TaskPillList from '@/components/TaskPillList';
import { DiaryTask } from '@/lib/tasks';
import { cn } from '@/lib/utils';

interface TaskPillSectionProps {
  tasks: DiaryTask[];
  onToggleTask: (taskId: string) => void;
  className?: string;
  defaultOpen?: boolean;
}

const TaskPillSection = ({
  tasks,
  onToggleTask,
  className,
  defaultOpen = false,
}: TaskPillSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (tasks.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn('space-y-3', className)}>
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-card/40 px-3 py-2 text-left transition-smooth hover:bg-secondary/20">
            <span className="text-xs font-medium text-muted-foreground">
              {isOpen ? 'Hide tasks' : 'Show tasks'} ({tasks.length})
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <TaskPillList tasks={tasks} onToggleTask={onToggleTask} />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default TaskPillSection;
