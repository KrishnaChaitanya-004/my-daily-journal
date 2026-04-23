import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ListTodo,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTasks } from '@/hooks/useTasks';
import { DiaryTask, formatDateKey } from '@/lib/tasks';

const formatTaskDate = (dateKey: string | null) => {
  if (!dateKey) return 'Not scheduled yet';

  try {
    return format(parseISO(dateKey), 'EEE, MMM d, yyyy');
  } catch {
    return dateKey;
  }
};

const Tasks = () => {
  const navigate = useNavigate();
  const {
    tasks,
    pendingScheduledTasks,
    addTask,
    scheduleTask,
    toggleTask,
    deleteTask,
  } = useTasks();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [dateDialogTask, setDateDialogTask] = useState<DiaryTask | null>(null);
  const [pickedDate, setPickedDate] = useState(formatDateKey(new Date()));
  const [isAllTasksOpen, setIsAllTasksOpen] = useState(false);

  const unscheduledTasks = useMemo(() => {
    return tasks.filter((task) => !task.scheduledDate);
  }, [tasks]);

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;
    addTask(newTaskTitle);
    setNewTaskTitle('');
  };

  const handleScheduleToday = (taskId: string) => {
    scheduleTask(taskId, new Date());
  };

  const handleOpenDateDialog = (task: DiaryTask) => {
    setDateDialogTask(task);
    setPickedDate(task.scheduledDate || formatDateKey(new Date()));
  };

  const handleConfirmDate = () => {
    if (!dateDialogTask || !pickedDate) return;
    scheduleTask(dateDialogTask.id, pickedDate);
    setDateDialogTask(null);
  };

  const openDiaryDate = (dateKey: string) => {
    navigate(`/?date=${dateKey}`);
  };

  return (
    <main className="min-h-screen bg-background max-w-md mx-auto">
      <header className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border">
        <button
          onClick={() => navigate('/')}
          className="p-2 text-muted-foreground hover:text-foreground transition-smooth"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-medium text-foreground">Tasks</h1>
      </header>

      <div className="p-4 space-y-4 pb-8">
        <section className="overflow-hidden rounded-[28px] border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <div className="border-b border-primary/10 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ListTodo className="w-4 h-4 text-primary" />
              Task shelf
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Add tasks here, then send them to today or any diary date.
            </p>
          </div>

          <div className="space-y-3 p-4">
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTaskTitle.trim()) {
                  handleCreateTask();
                }
              }}
              placeholder="Add a new task..."
              className="border-primary/20 bg-background/80"
            />
            <Button onClick={handleCreateTask} className="w-full" disabled={!newTaskTitle.trim()}>
              Add Task
            </Button>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-2xl border border-border/70 bg-background/70 px-3 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pending</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{pendingScheduledTasks.length}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 px-3 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Unscheduled</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{unscheduledTasks.length}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-foreground">Pending scheduled tasks</h2>
              <p className="text-xs text-muted-foreground">Tap a date card to jump straight into that diary day.</p>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {pendingScheduledTasks.length}
            </span>
          </div>

          {pendingScheduledTasks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/60 px-4 py-6 text-center">
              <p className="text-sm font-medium text-foreground">No pending scheduled tasks</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Schedule a task and it will appear here until it gets marked done.
              </p>
            </div>
          ) : (
            pendingScheduledTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-3xl border border-border bg-card p-3 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-smooth hover:border-primary hover:text-primary"
                    title="Mark done"
                  >
                    <Check className="w-4 h-4" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{task.title}</p>
                    {task.scheduledDate && (
                      <button
                        onClick={() => openDiaryDate(task.scheduledDate!)}
                        className="mt-2 flex w-full items-center justify-between rounded-2xl border border-primary/15 bg-primary/5 px-3 py-2 text-left transition-smooth hover:bg-primary/10"
                      >
                        <div className="flex items-center gap-2 text-primary">
                          <CalendarDays className="w-4 h-4" />
                          <span className="text-xs font-medium">{formatTaskDate(task.scheduledDate)}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-primary/70" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        <Collapsible open={isAllTasksOpen} onOpenChange={setIsAllTasksOpen}>
          <section className="overflow-hidden rounded-3xl border border-border bg-card/40">
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-smooth hover:bg-secondary/20">
                <div>
                  <h2 className="text-sm font-medium text-foreground">All tasks</h2>
                  <p className="text-xs text-muted-foreground">
                    Use quick schedule buttons to push a task to today or a specific date.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {tasks.length}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${isAllTasksOpen ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="space-y-3 border-t border-border/70 p-4">
                {tasks.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border bg-card/60 px-4 py-8 text-center">
                    <CheckSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
                    <p className="text-sm font-medium text-foreground">No tasks yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Add your first task above and start sending it to your diary days.
                    </p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`
                        rounded-3xl border p-4 transition-smooth
                        ${task.completed
                          ? 'border-primary/15 bg-primary/5'
                          : 'border-border bg-card'}
                      `}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className={`text-sm font-medium ${task.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {task.title}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatTaskDate(task.scheduledDate)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleTask(task.id)}
                            className={`
                              flex h-9 w-9 items-center justify-center rounded-full border transition-smooth
                              ${task.completed
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}
                            `}
                            title={task.completed ? 'Mark not done' : 'Mark done'}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-smooth hover:border-destructive hover:text-destructive"
                            title="Delete task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleScheduleToday(task.id)}>
                          Today
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleOpenDateDialog(task)}>
                          Pick day
                        </Button>
                        {task.scheduledDate && (
                          <Button variant="secondary" size="sm" onClick={() => openDiaryDate(task.scheduledDate!)}>
                            Open day
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CollapsibleContent>
          </section>
        </Collapsible>
      </div>

      <Dialog open={!!dateDialogTask} onOpenChange={(open) => !open && setDateDialogTask(null)}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>Choose a diary date</DialogTitle>
            <DialogDescription>
              This will push the task onto that day so it shows up in the diary page and the pending list.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            <div className="rounded-2xl border border-border bg-secondary/40 px-3 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Task</p>
              <p className="mt-1 text-sm font-medium text-foreground">{dateDialogTask?.title}</p>
            </div>

            <label className="space-y-2 block">
              <span className="text-sm font-medium text-foreground">Date</span>
              <Input
                type="date"
                value={pickedDate}
                onChange={(e) => setPickedDate(e.target.value)}
              />
            </label>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setDateDialogTask(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmDate} disabled={!pickedDate}>
              Save date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Tasks;
