export const TASKS_KEY = 'diary-tasks';
export const TASKS_UPDATE_EVENT = 'diary-tasks-update';

export interface DiaryTask {
  id: string;
  title: string;
  createdAt: number;
  scheduledDate: string | null;
  completed: boolean;
  completedAt?: number | null;
}

export const formatDateKey = (date: Date): string => {
  return new Intl.DateTimeFormat('en-CA').format(date);
};

export const normalizeDateKey = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;
  if (value instanceof Date) return formatDateKey(value);
  return value;
};

export const loadTasksFromStorage = (): DiaryTask[] => {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((task): task is DiaryTask => {
      return typeof task?.id === 'string' && typeof task?.title === 'string';
    });
  } catch {
    return [];
  }
};

export const saveTasksToStorage = (tasks: DiaryTask[]) => {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));

  try {
    window.dispatchEvent(new Event(TASKS_UPDATE_EVENT));
    window.dispatchEvent(new Event('diary-data-changed'));
  } catch {
    // no-op outside the browser
  }
};

export const sortTasks = (tasks: DiaryTask[]): DiaryTask[] => {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    if ((a.scheduledDate || '') !== (b.scheduledDate || '')) {
      return (a.scheduledDate || '').localeCompare(b.scheduledDate || '');
    }

    return b.createdAt - a.createdAt;
  });
};

export const getTasksForDate = (tasks: DiaryTask[], dateKey: string): DiaryTask[] => {
  return sortTasks(tasks.filter((task) => task.scheduledDate === dateKey));
};

export const getPendingScheduledTasks = (tasks: DiaryTask[]): DiaryTask[] => {
  return tasks
    .filter((task) => task.scheduledDate && !task.completed)
    .sort((a, b) => {
      if (a.scheduledDate !== b.scheduledDate) {
        return (a.scheduledDate || '').localeCompare(b.scheduledDate || '');
      }

      return a.createdAt - b.createdAt;
    });
};

export const hasTasksForDate = (tasks: DiaryTask[], dateKey: string): boolean => {
  return tasks.some((task) => task.scheduledDate === dateKey);
};

export const getStructuredTaskCountsForDate = (
  tasks: DiaryTask[],
  dateKey: string
): { total: number; completed: number } => {
  const tasksForDate = tasks.filter((task) => task.scheduledDate === dateKey);

  return {
    total: tasksForDate.length,
    completed: tasksForDate.filter((task) => task.completed).length,
  };
};
