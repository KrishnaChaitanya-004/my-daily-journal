import { useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'diary-app-data';

export const useAutoSave = () => {
  const saveCallbackRef = useRef<(() => void) | null>(null);

  const registerSaveCallback = useCallback((callback: () => void) => {
    saveCallbackRef.current = callback;
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // App is going to background, trigger save
        if (saveCallbackRef.current) {
          saveCallbackRef.current();
        }
        
        // Also ensure localStorage is flushed
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
          // Force a write to ensure data is persisted
          localStorage.setItem(STORAGE_KEY, data);
        }
      }
    };

    const handleBeforeUnload = () => {
      // Trigger save before page unload
      if (saveCallbackRef.current) {
        saveCallbackRef.current();
      }
    };

    const handlePageHide = () => {
      // Handle page hide (works better on mobile)
      if (saveCallbackRef.current) {
        saveCallbackRef.current();
      }
    };

    // Listen for visibility changes (app going to background)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Listen for page hide (better mobile support)
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  return { registerSaveCallback };
};
