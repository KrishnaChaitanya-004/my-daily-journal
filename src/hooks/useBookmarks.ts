import { useState, useCallback, useEffect } from 'react';

const BOOKMARKS_KEY = 'diary-bookmarks';

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
    const dateKey = date.toISOString().split('T')[0];
    setBookmarks(prev => {
      if (prev.includes(dateKey)) {
        return prev.filter(d => d !== dateKey);
      }
      return [...prev, dateKey];
    });
  }, []);

  const isBookmarked = useCallback((date: Date): boolean => {
    const dateKey = date.toISOString().split('T')[0];
    return bookmarks.includes(dateKey);
  }, [bookmarks]);

  const getBookmarkedDates = useCallback((): Date[] => {
    return bookmarks.map(dateKey => new Date(dateKey)).sort((a, b) => b.getTime() - a.getTime());
  }, [bookmarks]);

  return {
    bookmarks,
    toggleBookmark,
    isBookmarked,
    getBookmarkedDates
  };
};
