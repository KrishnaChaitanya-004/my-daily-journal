import { widgetsBridge } from './widgetsBridge';
import { DayFileData } from '@/hooks/useFileStorage';
import { subDays } from 'date-fns';

/**
 * Single, atomic sync of ALL widget data (stats + calendar + habits).
 * Replaces the old separate syncWidgetStats + syncCalendarWidget which had
 * a race condition — both would read the same cache, then the last writer
 * would overwrite the other's fields.
 *
 * Call this after ANY data change (diary save, habit toggle, photo add, etc.).
 */
export const syncAllWidgetData = async () => {
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

    // ──── Stats ────
    let totalEntries = 0;
    let totalWords = 0;
    const entryDates: string[] = [];

    // ──── Calendar ────
    const calendarDays: Record<string, { habitProgress: number; hasEntry: boolean }> = {};

    // Process ALL diary entries in a single pass (no date filter – include everything)
    Object.entries(allDiaryData).forEach(([dateKey, rawDay]) => {
      const data = rawDay as DayFileData;
      const hasContent = !!(data?.content?.trim() || data?.photos?.length);

      // Stats accumulation
      if (hasContent) {
        totalEntries++;
        totalWords += countWords(data?.content || '');
        entryDates.push(dateKey);
      }

      // Calendar day data (habit progress)
      let habitProgress = 0;
      if (totalHabits > 0 && data?.habits) {
        const completedCount = habitIds.filter(id => data.habits?.[id] === true).length;
        habitProgress = Math.round((completedCount / totalHabits) * 100);
      }

      calendarDays[dateKey] = { habitProgress, hasEntry: hasContent };
    });

    // ──── Streak calculation ────
    entryDates.sort();
    let currentStreak = 0;
    const today = new Intl.DateTimeFormat('en-CA').format(new Date());
    const yesterday = new Intl.DateTimeFormat('en-CA').format(subDays(new Date(), 1));
    const hasRecentEntry = entryDates.includes(today) || entryDates.includes(yesterday);

    if (hasRecentEntry) {
      let checkDate = entryDates.includes(today) ? new Date() : subDays(new Date(), 1);
      while (entryDates.includes(new Intl.DateTimeFormat('en-CA').format(checkDate))) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      }
    }

    // ──── Habits progress (today) ────
    const todayKey = new Intl.DateTimeFormat('en-CA').format(new Date());
    const todayData = allDiaryData[todayKey] as DayFileData | undefined;
    let habitsCompleted = 0;
    if (totalHabits > 0 && todayData?.habits) {
      habitsCompleted = habitIds.filter(id => todayData.habits?.[id] === true).length;
    }

    // ──── Today snippet ────
    const todayContent = todayData?.content?.trim() || '';
    const todaySnippet = todayContent.length > 100 ? todayContent.substring(0, 100) + '…' : todayContent;

    // ──── Single atomic write (ALL fields, no read-modify-write) ────
    await widgetsBridge.syncAll({
      statsEntries: totalEntries,
      statsStreak: currentStreak,
      statsWords: totalWords,
      habitsCompleted,
      habitsTotal: totalHabits,
      habitsDate: todayKey,
      todaySnippet,
      todayDate: todayKey,
      calendarDays,
    });

    console.log('[syncAllWidgetData] entries:', totalEntries, 'streak:', currentStreak, 'calDays:', Object.keys(calendarDays).length, 'habits:', habitsCompleted + '/' + totalHabits);
  } catch (e) {
    console.warn('[syncAllWidgetData] Failed:', e);
  }
};

const countWords = (text: string): number => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
};
