import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DiaryTask,
  TASKS_UPDATE_EVENT,
  getPendingScheduledTasks,
  getTasksForDate,
  hasTasksForDate,
  loadTasksFromStorage,
  normalizeDateKey,
  saveTasksToStorage,
  sortTasks,
} from '@/lib/tasks';

const createTaskId = () => `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const useTasks = (selectedDate?: Date | string | null) => {
  const [tasks, setTasks] = useState<DiaryTask[]>(loadTasksFromStorage);
  const selectedDateKey = normalizeDateKey(selectedDate);

  useEffect(() => {
    const refreshTasks = () => {
      setTasks(loadTasksFromStorage());
    };

    window.addEventListener('storage', refreshTasks);
    window.addEventListener(TASKS_UPDATE_EVENT, refreshTasks);
    window.addEventListener('diary-data-changed', refreshTasks);

    return () => {
      window.removeEventListener('storage', refreshTasks);
      window.removeEventListener(TASKS_UPDATE_EVENT, refreshTasks);
      window.removeEventListener('diary-data-changed', refreshTasks);
    };
  }, []);

  const writeTasks = useCallback((updater: (current: DiaryTask[]) => DiaryTask[]) => {
    setTasks((current) => {
      const next = updater(current);
      saveTasksToStorage(next);
      return next;
    });
  }, []);

  const addTask = useCallback((title: string, scheduledDate?: Date | string | null) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return null;

    const newTask: DiaryTask = {
      id: createTaskId(),
      title: trimmedTitle,
      createdAt: Date.now(),
      scheduledDate: normalizeDateKey(scheduledDate),
      completed: false,
      completedAt: null,
    };

    writeTasks((current) => [newTask, ...current]);
    return newTask;
  }, [writeTasks]);

  const scheduleTask = useCallback((taskId: string, date: Date | string) => {
    const dateKey = normalizeDateKey(date);
    if (!dateKey) return;

    writeTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              scheduledDate: dateKey,
              completed: false,
              completedAt: null,
            }
          : task
      )
    );
  }, [writeTasks]);

  const createTaskForDate = useCallback((title: string, date: Date | string) => {
    return addTask(title, date);
  }, [addTask]);

  const toggleTask = useCallback((taskId: string) => {
    writeTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed: !task.completed,
              completedAt: task.completed ? null : Date.now(),
            }
          : task
      )
    );
  }, [writeTasks]);

  const deleteTask = useCallback((taskId: string) => {
    writeTasks((current) => current.filter((task) => task.id !== taskId));
  }, [writeTasks]);

  const tasksForSelectedDate = useMemo(() => {
    if (!selectedDateKey) return [];
    return getTasksForDate(tasks, selectedDateKey);
  }, [selectedDateKey, tasks]);

  const pendingScheduledTasks = useMemo(() => {
    return getPendingScheduledTasks(tasks);
  }, [tasks]);

  const allTasks = useMemo(() => sortTasks(tasks), [tasks]);

  const hasTasksOnDate = useCallback((date: Date | string) => {
    const dateKey = normalizeDateKey(date);
    if (!dateKey) return false;
    return hasTasksForDate(tasks, dateKey);
  }, [tasks]);

  return {
    tasks: allTasks,
    tasksForSelectedDate,
    pendingScheduledTasks,
    addTask,
    scheduleTask,
    createTaskForDate,
    toggleTask,
    deleteTask,
    hasTasksOnDate,
  };
};
