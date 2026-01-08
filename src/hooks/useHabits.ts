import { useState, useCallback, useMemo, useEffect } from 'react';
import { getAllDiaryData, DayFileData } from './useFileStorage';
import { subDays, parseISO, differenceInDays } from 'date-fns';
import { widgetsBridge } from '@/lib/widgetsBridge';

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: number;
}

const HABITS_KEY = 'diary-habits-list';
const STORAGE_KEY = 'diary-app-data';

const defaultColors = [
  'hsl(var(--primary))',
  'hsl(142, 76%, 36%)', // green
  'hsl(262, 83%, 58%)', // purple
  'hsl(24, 94%, 50%)',  // orange
  'hsl(199, 89%, 48%)', // blue
  'hsl(340, 82%, 52%)', // pink
];

const defaultIcons = ['🏃', '📚', '💧', '🧘', '💪', '🎯', '✍️', '🎨', '🎵', '💤'];

export const useHabits = () => {
  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const saved = localStorage.getItem(HABITS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Bump this whenever we write habits completion data to storage, so memoized
  // calculations (including widget syncing) refresh reliably.
  const [dataVersion, setDataVersion] = useState(0);

  const allData = useMemo(() => getAllDiaryData(), [dataVersion]);

  const addHabit = useCallback((name: string, icon: string = '🎯') => {
    const newHabit: Habit = {
      id: `habit_${Date.now()}`,
      name,
      icon,
      color: defaultColors[habits.length % defaultColors.length],
      createdAt: Date.now()
    };

    const updated = [...habits, newHabit];
    setHabits(updated);
    localStorage.setItem(HABITS_KEY, JSON.stringify(updated));
    setDataVersion(v => v + 1);
    return newHabit;
  }, [habits]);

  const updateHabit = useCallback((id: string, updates: Partial<Habit>) => {
    const updated = habits.map(h => h.id === id ? { ...h, ...updates } : h);
    setHabits(updated);
    localStorage.setItem(HABITS_KEY, JSON.stringify(updated));
    setDataVersion(v => v + 1);
  }, [habits]);

  const deleteHabit = useCallback((id: string) => {
    const updated = habits.filter(h => h.id !== id);
    setHabits(updated);
    localStorage.setItem(HABITS_KEY, JSON.stringify(updated));
    setDataVersion(v => v + 1);
  }, [habits]);

  const toggleHabitForDate = useCallback((habitId: string, dateKey: string) => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const parsed = data ? JSON.parse(data) : {};

      if (!parsed[dateKey]) {
        parsed[dateKey] = { content: '', photos: [] };
      }

      const currentHabits = parsed[dateKey].habits || {};
      currentHabits[habitId] = !currentHabits[habitId];
      parsed[dateKey].habits = currentHabits;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      setDataVersion(v => v + 1);

      // Force re-render by returning new state
      return currentHabits[habitId];
    } catch (e) {
      console.error('Failed to toggle habit:', e);
      return false;
    }
  }, []);

  const getHabitCompletions = useCallback((habitId: string, dateKey: string): boolean => {
    const dayData = allData[dateKey] as DayFileData | undefined;
    return dayData?.habits?.[habitId] ?? false;
  }, [allData]);

  const getHabitStreak = useCallback((habitId: string): number => {
    let streak = 0;
    const today = new Date();

    // Check from today going backwards
    for (let i = 0; i < 365; i++) {
      const date = subDays(today, i);
      const dateKey = date.toISOString().split('T')[0];
      const dayData = allData[dateKey] as DayFileData | undefined;

      if (dayData?.habits?.[habitId]) {
        streak++;
      } else if (i > 0) { // Allow today to be incomplete
        break;
      }
    }

    return streak;
  }, [allData]);

  const getHabitStats = useCallback((habitId: string) => {
    let totalCompleted = 0;
    let last7Days = 0;
    let last30Days = 0;

    const today = new Date();

    Object.entries(allData).forEach(([dateKey, dayData]) => {
      const data = dayData as DayFileData;
      if (data?.habits?.[habitId]) {
        totalCompleted++;

        const daysAgo = differenceInDays(today, parseISO(dateKey));
        if (daysAgo < 7) last7Days++;
        if (daysAgo < 30) last30Days++;
      }
    });

    const streak = getHabitStreak(habitId);

    return {
      totalCompleted,
      last7Days,
      last30Days,
      streak
    };
  }, [allData, getHabitStreak]);

  const getTodayProgress = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const dayData = allData[today] as DayFileData | undefined;
    const completed = habits.filter(h => dayData?.habits?.[h.id]).length;
    return {
      completed,
      total: habits.length,
      percentage: habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0
    };
  }, [habits, allData]);

  // Push today's habits progress into native widget storage (real-time)
  useEffect(() => {
    widgetsBridge.setHabitsProgress(getTodayProgress.completed, getTodayProgress.total);
  }, [getTodayProgress.completed, getTodayProgress.total]);

  return {
    habits,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitForDate,
    getHabitCompletions,
    getHabitStreak,
    getHabitStats,
    getTodayProgress,
    defaultIcons,
    defaultColors
  };
};
