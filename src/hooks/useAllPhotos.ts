import { useMemo } from 'react';

interface PhotoData {
  filename: string;
  path: string;
  timestamp: number;
  base64?: string;
  dateKey?: string;
}

const STORAGE_KEY = 'diary-app-data';

export const useAllPhotos = () => {
  const allPhotos = useMemo(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      const photos: PhotoData[] = [];
      
      for (const [dateKey, value] of Object.entries(parsed)) {
        const dayData = value as { photos?: PhotoData[] };
        if (dayData.photos && Array.isArray(dayData.photos)) {
          dayData.photos.forEach(photo => {
            photos.push({ ...photo, dateKey });
          });
        }
      }
      
      // Sort by timestamp, newest first
      return photos.sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      return [];
    }
  }, []);

  const getPhotoUrl = (photo: PhotoData & { base64?: string }): string => {
    if (photo.base64) {
      return `data:image/jpeg;base64,${photo.base64}`;
    }
    return '';
  };

  return { allPhotos, getPhotoUrl };
};
