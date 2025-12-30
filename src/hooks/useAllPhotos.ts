import { useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { getPhotoFromIDB, deletePhotoFromIDB, getAllPhotosFromIDB } from '@/lib/photoStorage';

interface PhotoData {
  filename: string;
  path: string;
  timestamp: number;
  base64?: string;
  dateKey?: string;
}

interface DayFileData {
  content: string;
  photos: PhotoData[];
  tags?: string[];
  mood?: string;
  location?: any;
  weather?: any;
  habits?: Record<string, boolean>;
  voiceNotes?: any[];
}

const STORAGE_KEY = 'diary-app-data';

export const useAllPhotos = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [photoCache, setPhotoCache] = useState<Record<string, string>>({});

  // Load all photos from IndexedDB on mount
  useEffect(() => {
    const loadPhotosFromIDB = async () => {
      try {
        const idbPhotos = await getAllPhotosFromIDB();
        const cache: Record<string, string> = {};
        for (const photo of idbPhotos) {
          cache[photo.id] = photo.base64;
        }
        setPhotoCache(cache);
      } catch (e) {
        console.error('Failed to load photos from IndexedDB:', e);
      }
    };

    loadPhotosFromIDB();
  }, [refreshKey]);

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
    // Check cache from IndexedDB
    if (photoCache[photo.filename]) {
      return `data:image/jpeg;base64,${photoCache[photo.filename]}`;
    }
    
    // Fallback to inline base64 if available
    if (photo.base64) {
      return `data:image/jpeg;base64,${photo.base64}`;
    }

    return '';
  }, [photoCache]);

  const loadPhotoUrl = useCallback(async (filename: string): Promise<string> => {
    // Check cache first
    if (photoCache[filename]) {
      return `data:image/jpeg;base64,${photoCache[filename]}`;
    }

    // Load from IndexedDB
    const base64 = await getPhotoFromIDB(filename);
    if (base64) {
      setPhotoCache(prev => ({ ...prev, [filename]: base64 }));
      return `data:image/jpeg;base64,${base64}`;
    }

    return '';
  }, [photoCache]);

  const deletePhoto = useCallback(async (filename: string, dateKey: string) => {
    try {
      // Delete from IndexedDB
      await deletePhotoFromIDB(filename);

      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return;

      const parsed: Record<string, DayFileData> = JSON.parse(data);
      const dayData = parsed[dateKey];
      
      if (!dayData) return;

      // Remove photo from photos array
      const updatedPhotos = dayData.photos.filter(p => p.filename !== filename);

      // Remove photo marker from content (both old and new formats)
      const oldMarker = `[photo:${filename}]`;
      const newMarker = `$[photo:${filename}]$`;
      const updatedContent = dayData.content
        .split('\n')
        .filter(line => line.trim() !== oldMarker && line.trim() !== newMarker)
        .join('\n');

      // Update the day data
      parsed[dateKey] = {
        ...dayData,
        content: updatedContent,
        photos: updatedPhotos,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      
      // Remove from cache
      setPhotoCache(prev => {
        const newCache = { ...prev };
        delete newCache[filename];
        return newCache;
      });
      
      // Dispatch event for other components to refresh
      window.dispatchEvent(new Event('diary-data-changed'));
      
      // Trigger re-render
      setRefreshKey(prev => prev + 1);
      
      toast.success('Photo deleted');
    } catch (e) {
      console.error('Failed to delete photo:', e);
      toast.error('Failed to delete photo');
    }
  }, []);

  return { allPhotos, getPhotoUrl, loadPhotoUrl, deletePhoto };
};