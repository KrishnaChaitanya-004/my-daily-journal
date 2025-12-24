import { useMemo, useCallback } from 'react';
import { getAllDiaryData, DayFileData } from './useFileStorage';

const STORAGE_KEY = 'diary-app-data';

export const useTags = () => {
  const allData = getAllDiaryData();

  // Get all unique tags across all entries
  const allTags = useMemo<string[]>(() => {
    const tagSet = new Set<string>();
    
    Object.values(allData).forEach((dayData) => {
      const data = dayData as DayFileData;
      if (data?.tags) {
        data.tags.forEach(tag => tagSet.add(tag));
      }
    });
    
    return Array.from(tagSet).sort();
  }, [allData]);

  // Get tag counts
  const tagCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    
    Object.values(allData).forEach((dayData) => {
      const data = dayData as DayFileData;
      if (data?.tags) {
        data.tags.forEach(tag => {
          counts[tag] = (counts[tag] || 0) + 1;
        });
      }
    });
    
    return counts;
  }, [allData]);

  // Get entries by tag
  const getEntriesByTag = useCallback((tag: string): string[] => {
    const entries: string[] = [];
    
    Object.entries(allData).forEach(([dateKey, dayData]) => {
      const data = dayData as DayFileData;
      if (data?.tags?.includes(tag)) {
        entries.push(dateKey);
      }
    });
    
    return entries.sort().reverse();
  }, [allData]);

  // Save tags for a specific date
  const saveTags = useCallback((dateKey: string, tags: string[]) => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const parsed = data ? JSON.parse(data) : {};
      
      if (!parsed[dateKey]) {
        parsed[dateKey] = { content: '', photos: [] };
      }
      parsed[dateKey].tags = tags;
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch (e) {
      console.error('Failed to save tags:', e);
    }
  }, []);

  return {
    allTags,
    tagCounts,
    getEntriesByTag,
    saveTags
  };
};
