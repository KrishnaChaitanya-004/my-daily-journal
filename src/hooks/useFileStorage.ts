import { useState, useCallback, useEffect } from 'react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export interface PhotoData {
  filename: string;
  path: string;
  timestamp: number;
}

export interface DayFileData {
  content: string;
  photos: PhotoData[];
}

const APP_FOLDER = 'mydiaryapp';

const formatDateFolder = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

// Fallback to localStorage for web
const STORAGE_KEY = 'diary-app-data';

const loadFromLocalStorage = (): Record<string, DayFileData> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return {};
    
    const parsed = JSON.parse(data);
    const migrated: Record<string, DayFileData> = {};
    
    for (const [key, value] of Object.entries(parsed)) {
      const oldData = value as any;
      
      if (typeof oldData.content === 'string' && Array.isArray(oldData.photos)) {
        migrated[key] = oldData as DayFileData;
      } else if (typeof oldData.content === 'string') {
        migrated[key] = { content: oldData.content, photos: [] };
      } else if (oldData.items) {
        const lines: string[] = [];
        oldData.items.forEach((item: any) => {
          if (item.type === 'task') {
            const checkbox = item.completed ? '✓' : '□';
            lines.push(`${checkbox} ${item.text}`);
          } else {
            lines.push(item.text);
          }
        });
        migrated[key] = { content: lines.join('\n'), photos: [] };
      } else {
        const lines: string[] = [];
        if (oldData.diary) lines.push(oldData.diary);
        if (oldData.todos && Array.isArray(oldData.todos)) {
          oldData.todos.forEach((todo: any) => {
            const checkbox = todo.completed ? '✓' : '□';
            lines.push(`${checkbox} ${todo.text}`);
          });
        }
        migrated[key] = { content: lines.join('\n'), photos: [] };
      }
    }
    
    return migrated;
  } catch {
    return {};
  }
};

const saveToLocalStorage = (data: Record<string, DayFileData>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const useFileStorage = (selectedDate: Date) => {
  const [allData, setAllData] = useState<Record<string, DayFileData>>(loadFromLocalStorage);
  const [isLoading, setIsLoading] = useState(false);
  
  const dateFolder = formatDateFolder(selectedDate);
  const dateKey = selectedDate.toISOString().split('T')[0];
  const dayData = allData[dateKey] || { content: '', photos: [] };

  // Create folder structure on native
  const ensureFolder = useCallback(async () => {
    if (!isNativePlatform()) return;
    
    try {
      await Filesystem.mkdir({
        path: `${APP_FOLDER}/${dateFolder}`,
        directory: Directory.Documents,
        recursive: true
      });
    } catch (e) {
      // Folder might already exist
    }
  }, [dateFolder]);

  // Save content to file (native) or localStorage (web)
  const saveContent = useCallback(async (content: string) => {
    const newData = { 
      ...allData, 
      [dateKey]: { ...dayData, content } 
    };
    setAllData(newData);
    
    if (isNativePlatform()) {
      await ensureFolder();
      try {
        await Filesystem.writeFile({
          path: `${APP_FOLDER}/${dateFolder}/content.txt`,
          data: content,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
      } catch (e) {
        console.error('Failed to save content:', e);
      }
    } else {
      saveToLocalStorage(newData);
    }
  }, [allData, dateKey, dayData, dateFolder, ensureFolder]);

  // Save photo and insert marker into content
  const savePhoto = useCallback(async (base64Data: string): Promise<PhotoData | null> => {
    const timestamp = Date.now();
    const filename = `photo_${timestamp}.jpg`;
    
    const photoData: PhotoData = {
      filename,
      path: `${APP_FOLDER}/${dateFolder}/${filename}`,
      timestamp
    };
    
    const newPhotos = [...dayData.photos, photoData];
    // Insert photo marker at end of content
    const photoMarker = `[photo:${filename}]`;
    const newContent = dayData.content 
      ? `${dayData.content}\n${photoMarker}` 
      : photoMarker;
    
    const newData = { 
      ...allData, 
      [dateKey]: { content: newContent, photos: newPhotos } 
    };
    setAllData(newData);
    
    if (isNativePlatform()) {
      await ensureFolder();
      try {
        await Filesystem.writeFile({
          path: `${APP_FOLDER}/${dateFolder}/${filename}`,
          data: base64Data,
          directory: Directory.Documents
        });
        
        // Save content with photo marker
        await Filesystem.writeFile({
          path: `${APP_FOLDER}/${dateFolder}/content.txt`,
          data: newContent,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
        
        // Also save metadata
        await Filesystem.writeFile({
          path: `${APP_FOLDER}/${dateFolder}/photos.json`,
          data: JSON.stringify(newPhotos),
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
      } catch (e) {
        console.error('Failed to save photo:', e);
        return null;
      }
    } else {
      // For web, store base64 in localStorage
      const webPhotoData = { ...photoData, base64: base64Data };
      const webData = { 
        ...allData, 
        [dateKey]: { 
          content: newContent,
          photos: [...dayData.photos, webPhotoData] 
        } 
      };
      saveToLocalStorage(webData);
      setAllData(webData);
    }
    
    return photoData;
  }, [allData, dateKey, dayData, dateFolder, ensureFolder]);

  // Delete photo and remove marker from content
  const deletePhoto = useCallback(async (filename: string) => {
    const newPhotos = dayData.photos.filter(p => p.filename !== filename);
    // Remove photo marker from content
    const photoMarker = `[photo:${filename}]`;
    const newContent = dayData.content
      .split('\n')
      .filter(line => line !== photoMarker)
      .join('\n');
    
    const newData = { 
      ...allData, 
      [dateKey]: { content: newContent, photos: newPhotos } 
    };
    setAllData(newData);
    
    if (isNativePlatform()) {
      try {
        await Filesystem.deleteFile({
          path: `${APP_FOLDER}/${dateFolder}/${filename}`,
          directory: Directory.Documents
        });
        
        // Update content file
        await Filesystem.writeFile({
          path: `${APP_FOLDER}/${dateFolder}/content.txt`,
          data: newContent,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
        
        await Filesystem.writeFile({
          path: `${APP_FOLDER}/${dateFolder}/photos.json`,
          data: JSON.stringify(newPhotos),
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
      } catch (e) {
        console.error('Failed to delete photo:', e);
      }
    } else {
      saveToLocalStorage(newData);
    }
  }, [allData, dateKey, dayData, dateFolder]);

  // Load data from file system on native
  useEffect(() => {
    const loadNativeData = async () => {
      if (!isNativePlatform()) return;
      
      setIsLoading(true);
      try {
        // Load content
        const contentResult = await Filesystem.readFile({
          path: `${APP_FOLDER}/${dateFolder}/content.txt`,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
        
        // Load photos metadata
        let photos: PhotoData[] = [];
        try {
          const photosResult = await Filesystem.readFile({
            path: `${APP_FOLDER}/${dateFolder}/photos.json`,
            directory: Directory.Documents,
            encoding: Encoding.UTF8
          });
          photos = JSON.parse(photosResult.data as string);
        } catch {
          // No photos file yet
        }
        
        setAllData(prev => ({
          ...prev,
          [dateKey]: { 
            content: contentResult.data as string, 
            photos 
          }
        }));
      } catch {
        // No data for this date yet
      }
      setIsLoading(false);
    };
    
    loadNativeData();
  }, [dateFolder, dateKey]);

  // Get photo URL (for display)
  const getPhotoUrl = useCallback((photo: PhotoData & { base64?: string }): string => {
    if (photo.base64) {
      return `data:image/jpeg;base64,${photo.base64}`;
    }
    // For native, we'll need to read the file
    return '';
  }, []);

  // Check if date has content
  const hasContent = useCallback((date: Date): boolean => {
    const key = date.toISOString().split('T')[0];
    const data = allData[key];
    return (data?.content?.trim().length > 0) || (data?.photos?.length > 0);
  }, [allData]);

  return {
    content: dayData.content,
    photos: dayData.photos,
    isLoading,
    saveContent,
    savePhoto,
    deletePhoto,
    getPhotoUrl,
    hasContent
  };
};
