import { useMemo, useState, useEffect } from 'react';
import { DayFileData } from './useFileStorage';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, subDays, differenceInDays, parseISO } from 'date-fns';

const STORAGE_KEY = 'diary-app-data';

// Helper to load data from localStorage (reactive version)
const loadDiaryData = (): Record<string, DayFileData> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

export interface DailyStats {
  date: string;
  wordCount: number;
  photoCount: number;
  taskCount: number;
  completedTasks: number;
  hasEntry: boolean;
}

export interface WeekdayStats {
  day: string;
  entries: number;
}

export interface MonthlyStats {
  month: string;
  entries: number;
  words: number;
  photos: number;
}

export interface StatsSummary {
  totalEntries: number;
  totalWords: number;
  totalPhotos: number;
  totalTasks: number;
  completedTasks: number;
  currentStreak: number;
  longestStreak: number;
  averageWordsPerEntry: number;
}

const countWords = (text: string): number => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

const countTasks = (content: string): { total: number; completed: number } => {
  if (!content) return { total: 0, completed: 0 };
  const lines = content.split('\n');
  let total = 0;
  let completed = 0;
  
  lines.forEach(line => {
    if (line.startsWith('□ ')) {
      total++;
    } else if (line.startsWith('✓ ')) {
      total++;
      completed++;
    }
  });
  
  return { total, completed };
};

export const useStatistics = () => {
  // Use state to make data reactive after import
  const [allData, setAllData] = useState<Record<string, DayFileData>>(loadDiaryData);
  
  // Listen for storage changes (e.g., after import)
  useEffect(() => {
    const handleStorageChange = () => {
      setAllData(loadDiaryData());
    };
    
    // Listen for storage events from other tabs
    window.addEventListener('storage', handleStorageChange);
    // Listen for custom event from import (same-tab)
    window.addEventListener('diary-data-changed', handleStorageChange);
    
    // Also reload on mount in case data changed
    setAllData(loadDiaryData());
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('diary-data-changed', handleStorageChange);
    };
  }, []);

  const dailyStats = useMemo<DailyStats[]>(() => {
    const stats: DailyStats[] = [];
    const today = new Date();
    
    // Get last 30 days of stats
    for (let i = 29; i >= 0; i--) {
      const date = subDays(today, i);
      const dateKey = new Intl.DateTimeFormat('en-CA').format(date)

      const dayData = allData[dateKey] as DayFileData | undefined;
      
      const tasks = countTasks(dayData?.content || '');
      
      stats.push({
        date: dateKey,
        wordCount: countWords(dayData?.content || ''),
        photoCount: dayData?.photos?.length || 0,
        taskCount: tasks.total,
        completedTasks: tasks.completed,
        hasEntry: !!(dayData?.content?.trim() || dayData?.photos?.length)
      });
    }
    
    return stats;
  }, [allData]);

  const weekdayStats = useMemo<WeekdayStats[]>(() => {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts: number[] = [0, 0, 0, 0, 0, 0, 0];
    
    Object.entries(allData).forEach(([dateKey, dayData]) => {
      const data = dayData as DayFileData;
      if (data?.content?.trim() || data?.photos?.length) {
        const date = new Date(dateKey);
        counts[date.getDay()]++;
      }
    });
    
    return weekdays.map((day, index) => ({
      day,
      entries: counts[index]
    }));
  }, [allData]);

  const monthlyStats = useMemo<MonthlyStats[]>(() => {
    const stats: Record<string, MonthlyStats> = {};
    
    Object.entries(allData).forEach(([dateKey, dayData]) => {
      const data = dayData as DayFileData;
      const monthKey = dateKey.substring(0, 7);

      
      if (!stats[monthKey]) {
        stats[monthKey] = {
          month: monthKey,
          entries: 0,
          words: 0,
          photos: 0
        };
      }
      
      if (data?.content?.trim() || data?.photos?.length) {
        stats[monthKey].entries++;
        stats[monthKey].words += countWords(data?.content || '');
        stats[monthKey].photos += data?.photos?.length || 0;
      }
    });
    
    return Object.values(stats).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  }, [allData]);

  const summary = useMemo<StatsSummary>(() => {
    let totalEntries = 0;
    let totalWords = 0;
    let totalPhotos = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    
    const entryDates: string[] = [];
    
    Object.entries(allData).forEach(([dateKey, dayData]) => {
      const data = dayData as DayFileData;
      if (data?.content?.trim() || data?.photos?.length) {
        totalEntries++;
        totalWords += countWords(data?.content || '');
        totalPhotos += data?.photos?.length || 0;
        entryDates.push(dateKey);
        
        const tasks = countTasks(data?.content || '');
        totalTasks += tasks.total;
        completedTasks += tasks.completed;
      }
    });
    
    // Calculate streaks
    entryDates.sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = new Intl.DateTimeFormat('en-CA').format(new Date());
const yesterday = new Intl.DateTimeFormat('en-CA').format(subDays(new Date(), 1));

    
    // Check if there's an entry today or yesterday for current streak
    const hasRecentEntry = entryDates.includes(today) || entryDates.includes(yesterday);
    
    if (hasRecentEntry) {
      // Count backwards from today/yesterday
      let checkDate = entryDates.includes(today) ? new Date() : subDays(new Date(), 1);
      while (entryDates.includes(
    new Intl.DateTimeFormat('en-CA').format(checkDate)
  )) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      }
    }
    
    // Calculate longest streak
    for (let i = 0; i < entryDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
      const prevDate = new Date(entryDates[i - 1]);
const currDate = new Date(entryDates[i]);

        const diff = differenceInDays(currDate, prevDate);
        
        if (diff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    
    return {
      totalEntries,
      totalWords,
      totalPhotos,
      totalTasks,
      completedTasks,
      currentStreak,
      longestStreak,
      averageWordsPerEntry: totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0
    };
  }, [allData]);

  return {
    dailyStats,
    weekdayStats,
    monthlyStats,
    summary
  };
};
