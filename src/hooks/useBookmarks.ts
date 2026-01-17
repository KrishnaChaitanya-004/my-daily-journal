import { useState, useCallback, useEffect } from 'react';

const BOOKMARKS_KEY = 'diary-bookmarks';

// Helper to format date consistently (timezone-safe)
const formatDateKey = (date: Date): string => {
  return new Intl.DateTimeFormat('en-CA').format(date);
};

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  }, [bookmarks]);

  const toggleBookmark = useCallback((date: Date) => {
    const dateKey = formatDateKey(date);
    setBookmarks(prev => {
      if (prev.includes(dateKey)) {
        return prev.filter(d => d !== dateKey);
      }
      return [...prev, dateKey];
    });
  }, []);

  const isBookmarked = useCallback((date: Date): boolean => {
    const dateKey = formatDateKey(date);
    return bookmarks.includes(dateKey);
  }, [bookmarks]);

  const getBookmarkedDates = useCallback((): Date[] => {
    return bookmarks.map(dateKey => {
      // Parse yyyy-MM-dd as local date
      const [year, month, day] = dateKey.split('-').map(Number);
      return new Date(year, month - 1, day);
    }).sort((a, b) => b.getTime() - a.getTime());
  }, [bookmarks]);

  return {
    bookmarks,
    toggleBookmark,
    isBookmarked,
    getBookmarkedDates
  };
};
