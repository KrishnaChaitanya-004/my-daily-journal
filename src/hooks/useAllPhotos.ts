import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';

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

  const getPhotoUrl = (photo: PhotoData): string => {
    // Always prefer base64 - works on both web and native
    if (photo.base64) {
      return `data:image/jpeg;base64,${photo.base64}`;
    }

    return '';
  };

  const deletePhoto = useCallback((filename: string, dateKey: string) => {
    try {
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

  return { allPhotos, getPhotoUrl, deletePhoto };
};