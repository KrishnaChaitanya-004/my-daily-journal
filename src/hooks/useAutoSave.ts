import { useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'diary-app-data';
const STORAGE_UPDATE_EVENT = 'diary-storage-update';

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
      } else if (document.visibilityState === 'visible') {
        // App coming back to foreground - trigger data refresh
        // Dispatch event to notify storage hooks to refresh
        window.dispatchEvent(new CustomEvent(STORAGE_UPDATE_EVENT));
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

    const handlePageShow = (event: PageTransitionEvent) => {
      // Handle page coming back (handles bfcache on mobile)
      if (event.persisted) {
        window.dispatchEvent(new CustomEvent(STORAGE_UPDATE_EVENT));
      }
    };

    // Handle Android back button - trigger refresh on resume
    const handleResume = () => {
      window.dispatchEvent(new CustomEvent(STORAGE_UPDATE_EVENT));
    };

    // Listen for visibility changes (app going to background)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Listen for page hide (better mobile support)
    window.addEventListener('pagehide', handlePageHide);
    
    // Listen for page show (handles bfcache)
    window.addEventListener('pageshow', handlePageShow);
    
    // Listen for Capacitor app resume event
    document.addEventListener('resume', handleResume);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('resume', handleResume);
    };
  }, []);

  return { registerSaveCallback };
};
