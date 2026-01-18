import { widgetsBridge } from './widgetsBridge';
import { DayFileData } from '@/hooks/useFileStorage';
import { subDays } from 'date-fns';

/**
 * Sync diary statistics to native widgets.
 * Call this whenever diary data changes to keep widgets up-to-date.
 */
export const syncWidgetStats = async () => {
  if (!widgetsBridge.isAvailable()) return;

  try {
    const STORAGE_KEY = 'diary-app-data';
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      await widgetsBridge.setStats(0, 0, 0);
      return;
    }

    const allData: Record<string, DayFileData> = JSON.parse(raw);
    
    let totalEntries = 0;
    let totalWords = 0;
    const entryDates: string[] = [];

    Object.entries(allData).forEach(([dateKey, dayData]) => {
      const data = dayData as DayFileData;
      if (data?.content?.trim() || data?.photos?.length) {
        totalEntries++;
        totalWords += countWords(data?.content || '');
        entryDates.push(dateKey);
      }
    });

    // Calculate current streak
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

    // Sync to widget
    await widgetsBridge.setStats(totalEntries, currentStreak, totalWords);
  } catch (e) {
    console.warn('[syncWidgetStats] Failed:', e);
  }
};

const countWords = (text: string): number => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};
