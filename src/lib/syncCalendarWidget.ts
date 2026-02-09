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
    const HABITS_LIST_KEY = 'diary-habits-list';

    const diaryRaw = localStorage.getItem(DIARY_STORAGE_KEY);
    const habitsListRaw = localStorage.getItem(HABITS_LIST_KEY);

    const allDiaryData: Record<string, DayFileData> = diaryRaw ? JSON.parse(diaryRaw) : {};
    const habitsList: { id: string }[] = habitsListRaw ? JSON.parse(habitsListRaw) : [];

    const totalHabits = habitsList.length;
    const habitIds = habitsList.map(h => h.id);

    // Build calendar days data
    const calendarDays: Record<string, { habitProgress: number; hasEntry: boolean }> = {};

    // Get current month range for optimization (widget shows current month)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Include data for current month and previous month for streak calculation
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0);

    // Process all diary entries - check content AND habit completions
    Object.entries(allDiaryData).forEach(([dateKey, dayData]) => {
      const data = dayData as DayFileData;
      
      // Check if this date is within our range
      const [year, month] = dateKey.split('-').map(Number);
      if (year < startDate.getFullYear() || year > endDate.getFullYear()) return;
      if (year === startDate.getFullYear() && month < startDate.getMonth() + 1) return;
      if (year === endDate.getFullYear() && month > endDate.getMonth() + 1) return;

      const hasContent = !!(data?.content?.trim() || data?.photos?.length);

      // Calculate habit progress from the habits map in diary data
      let habitProgress = 0;
      if (totalHabits > 0 && data?.habits) {
        const completedCount = habitIds.filter(id => data.habits?.[id] === true).length;
        habitProgress = Math.round((completedCount / totalHabits) * 100);
      }

      calendarDays[dateKey] = {
        habitProgress,
        hasEntry: hasContent,
      };
    });

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
  const { syncWidgetStats } = await import('./syncWidgetStats');
  await Promise.all([
    syncWidgetStats(),
    syncCalendarWidget(),
  ]);
};
