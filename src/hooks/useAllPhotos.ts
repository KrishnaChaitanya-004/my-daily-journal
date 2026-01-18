import { useMemo, useState, useCallback } from 'react';
import { getPhotoFromIDB, deletePhotoFromIDB } from '@/lib/photoStorage';
import { Capacitor } from '@capacitor/core';

interface PhotoData {
  filename: string;
  path: string;
  timestamp: number;
  base64?: string;
  dateKey?: string;
}

const STORAGE_KEY = 'diary-app-data';

export const useAllPhotos = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const allPhotos = useMemo(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];

      const parsed = JSON.parse(data);
      const photos: PhotoData[] = [];

      for (const [dateKey, value] of Object.entries(parsed)) {
        const dayData = value as { photos?: PhotoData[] };
        if (Array.isArray(dayData.photos)) {
          dayData.photos.forEach(photo => {
            photos.push({ ...photo, dateKey });
          });
        }
      }

      return photos.sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const getPhotoUrl = useCallback((photo: PhotoData): string => {
    // For native, base64 should always be present
    if (photo.base64) {
      return `data:image/jpeg;base64,${photo.base64}`;
    }
    return '';
  }, []);

  const loadPhotoUrl = useCallback(async (photo: PhotoData): Promise<string> => {
    // For native platforms, base64 should be in photo
    if (Capacitor.isNativePlatform() && photo.base64) {
      return `data:image/jpeg;base64,${photo.base64}`;
    }
    
    // For web, try to load from IndexedDB
    if (!Capacitor.isNativePlatform()) {
      const base64 = await getPhotoFromIDB(photo.filename);
      if (base64) {
        return `data:image/jpeg;base64,${base64}`;
      }
    }
    
    return '';
  }, []);

  const deletePhoto = useCallback(async (filename: string, dateKey: string) => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return;

      const parsed = JSON.parse(data);
      const dayData = parsed[dateKey];
      
      if (!dayData) return;

      // Remove photo from photos array
      if (Array.isArray(dayData.photos)) {
        dayData.photos = dayData.photos.filter((p: PhotoData) => p.filename !== filename);
      }

      // Remove photo marker from content (support both old and new formats)
      if (dayData.content) {
        dayData.content = dayData.content
          .replace(new RegExp(`\\$\\[photo:${filename}\\]\\$`, 'g'), '')
          .replace(new RegExp(`\\[photo:${filename}\\]`, 'g'), '');
      }

      // Save back to localStorage
      parsed[dateKey] = dayData;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));

      // Delete from IndexedDB (web only)
      if (!Capacitor.isNativePlatform()) {
        await deletePhotoFromIDB(filename);
      }

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('diary-data-changed'));
      
      // Trigger re-render
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }, []);

  return { allPhotos, getPhotoUrl, loadPhotoUrl, deletePhoto };
};