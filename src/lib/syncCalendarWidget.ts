import { widgetsBridge } from './widgetsBridge';
import { DayFileData } from '@/hooks/useFileStorage';

/**
 * Sync calendar widget data with all diary entries and habit progress.
 * Call this when diary entries or habits change.
 */
export const syncCalendarWidget = async () => {
  if (!widgetsBridge.isAvailable()) return;

  try {
    const DIARY_STORAGE_KEY = 'diary-app-data';
    const HABITS_STORAGE_KEY = 'diary-habits';

    const diaryRaw = localStorage.getItem(DIARY_STORAGE_KEY);
    const habitsRaw = localStorage.getItem(HABITS_STORAGE_KEY);

    const allDiaryData: Record<string, DayFileData> = diaryRaw ? JSON.parse(diaryRaw) : {};
    const habits = habitsRaw ? JSON.parse(habitsRaw) : [];

    // Get all habit IDs
    const totalHabits = habits.length;

    // Build calendar days data
    const calendarDays: Record<string, { habitProgress: number; hasEntry: boolean }> = {};

    // Get current month range for optimization (widget shows current month)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Include data for current month and potentially last month for streak calculation
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0);

    // Process all diary entries
    Object.entries(allDiaryData).forEach(([dateKey, dayData]) => {
      const data = dayData as DayFileData;
      const hasContent = !!(data?.content?.trim() || data?.photos?.length);
      
      // Check if this date is within our range
      const [year, month] = dateKey.split('-').map(Number);
      if (year < startDate.getFullYear() || year > endDate.getFullYear()) return;
      if (year === startDate.getFullYear() && month < startDate.getMonth() + 1) return;
      if (year === endDate.getFullYear() && month > endDate.getMonth() + 1) return;

      if (!calendarDays[dateKey]) {
        calendarDays[dateKey] = { habitProgress: 0, hasEntry: false };
      }
      calendarDays[dateKey].hasEntry = hasContent;
    });

    // Process habits completion data
    if (totalHabits > 0) {
      habits.forEach((habit: { completedDates?: string[] }) => {
        const completedDates = habit.completedDates || [];
        completedDates.forEach((dateKey: string) => {
          // Check if within range
          const [year, month] = dateKey.split('-').map(Number);
          if (year < startDate.getFullYear() || year > endDate.getFullYear()) return;
          if (year === startDate.getFullYear() && month < startDate.getMonth() + 1) return;
          if (year === endDate.getFullYear() && month > endDate.getMonth() + 1) return;

          if (!calendarDays[dateKey]) {
            calendarDays[dateKey] = { habitProgress: 0, hasEntry: false };
          }
          // Increment progress for each completed habit
          const currentProgress = calendarDays[dateKey].habitProgress;
          const increment = Math.round(100 / totalHabits);
          calendarDays[dateKey].habitProgress = Math.min(100, currentProgress + increment);
        });
      });
    }

    // Sync to widget - this triggers the native file write
    await widgetsBridge.setCalendarDays(calendarDays);
    console.log('[syncCalendarWidget] Synced', Object.keys(calendarDays).length, 'days');

  } catch (e) {
    console.warn('[syncCalendarWidget] Failed:', e);
  }
};

/**
 * Force immediate widget refresh by triggering all sync functions.
 * Call after any data change that affects widgets.
 */
export const forceWidgetRefresh = async () => {
  // Import dynamically to avoid circular dependencies
  const { syncWidgetStats } = await import('./syncWidgetStats');
  await Promise.all([
    syncWidgetStats(),
    syncCalendarWidget(),
  ]);
};
