import { useState, useCallback, useEffect } from 'react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { savePhotoToIDB, getPhotoFromIDB, deletePhotoFromIDB, migratePhotosToIDB } from '@/lib/photoStorage';

export interface PhotoData {
  filename: string;
  path: string;
  timestamp: number;
  base64?: string;
}

export interface VoiceNoteData {
  filename: string;
  duration: number;
  timestamp: number;
  base64?: string;
}

export interface LocationData {
  name: string;
  lat?: number;
  lng?: number;
  createdAt: number;
}

export interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
}

export interface DayFileData {
  content: string;
  photos: PhotoData[];
  tags?: string[];
  mood?: 'great' | 'good' | 'okay' | 'bad' | 'awful';
  location?: LocationData;
  weather?: WeatherData;
  habits?: Record<string, boolean>;
  voiceNotes?: VoiceNoteData[];
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

// Fallback to localStorage for web (metadata only, photos in IndexedDB)
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
  // Remove base64 from photos before saving to localStorage to save space
  const dataWithoutBase64: Record<string, DayFileData> = {};
  
  for (const [key, value] of Object.entries(data)) {
    dataWithoutBase64[key] = {
      ...value,
      photos: value.photos.map(p => ({
        filename: p.filename,
        path: p.path,
        timestamp: p.timestamp,
        // Don't save base64 to localStorage - it's in IndexedDB
      })),
    };
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataWithoutBase64));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
    // If still failing, the data might be too large even without base64
  }
};

// Export for use in other hooks
export const getAllDiaryData = (): Record<string, DayFileData> => {
  return loadFromLocalStorage();
};


export const useFileStorage = (selectedDate: Date) => {
  const [allData, setAllData] = useState<Record<string, DayFileData>>(loadFromLocalStorage);
  const [isLoading, setIsLoading] = useState(false);
  const [photoCache, setPhotoCache] = useState<Record<string, string>>({});
  
  const dateFolder = formatDateFolder(selectedDate);
  const dateKey = new Intl.DateTimeFormat('en-CA').format(selectedDate);
  // yyyy-MM-dd
  const dayData = allData[dateKey] || { content: '', photos: [] };

  // Migrate photos from localStorage to IndexedDB on first load
  useEffect(() => {
    if (!isNativePlatform()) {
      migratePhotosToIDB();
    }
  }, []);

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
const writeMetaFile = async (data: Partial<DayFileData>) => {
  if (!isNativePlatform()) return;

  await ensureFolder();

  const meta = {
    tags: data.tags,
    mood: data.mood,
    location: data.location,
    weather: data.weather,
    habits: data.habits,
  };

  await Filesystem.writeFile({
    path: `${APP_FOLDER}/${dateFolder}/meta.json`,
    data: JSON.stringify(meta),
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
  });
};

  // Save content to file (native) or localStorage (web)
 const saveContent = useCallback(async (content: string) => {
  setAllData(prev => {
    const merged = {
      ...prev,
      [dateKey]: {
        ...(prev[dateKey] || { content: '', photos: [] }),
        content,
      },
    };

    saveToLocalStorage(merged);
    return merged;
  });

  if (isNativePlatform()) {
    await ensureFolder();
    try {
      await Filesystem.writeFile({
        path: `${APP_FOLDER}/${dateFolder}/content.txt`,
        data: content,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
    } catch (e) {
      console.error('Failed to save content:', e);
    }
  }
}, [dateKey, dateFolder, ensureFolder]);


  // Save day metadata (tags, location, weather, habits, mood)
const saveDayMeta = useCallback(
  async (meta: Partial<DayFileData>) => {
    setAllData(prev => {
      const current = prev[dateKey] || { content: '', photos: [] };

      const mergedDay: DayFileData = {
        ...current,
        ...meta, // only updates location / weather / tags / habits / mood
      };

      const mergedAll = {
        ...prev,
        [dateKey]: mergedDay,
      };

      saveToLocalStorage(mergedAll);
      return mergedAll;
    });

    // Native: persist meta.json
    if (isNativePlatform()) {
      await ensureFolder();

      const metaOnly = {
        tags: meta.tags,
        mood: meta.mood,
        location: meta.location,
        weather: meta.weather,
        habits: meta.habits,
      };

      try {
        await Filesystem.writeFile({
          path: `${APP_FOLDER}/${dateFolder}/meta.json`,
          data: JSON.stringify(metaOnly),
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
      } catch (e) {
        console.error('Failed to save meta:', e);
      }
    }
  },
  [dateKey, dateFolder, ensureFolder]
);




  // Save photo and insert marker into content
const savePhoto = useCallback(
  async (base64Data: string): Promise<PhotoData | null> => {
    const timestamp = Date.now();
    const filename = `photo_${timestamp}.jpg`;

    // Clean base64 (remove data URL prefix if present)
    const pureBase64 = base64Data.includes(',')
      ? base64Data.split(',')[1]
      : base64Data;

    const photo: PhotoData = {
      filename,
      path: `${APP_FOLDER}/${dateFolder}/${filename}`,
      timestamp,
      base64: pureBase64, // Keep in memory for immediate display
    };

    let updatedContent = '';
    let updatedPhotos: PhotoData[] = [];

    // Save to IndexedDB for web (not localStorage)
    if (!isNativePlatform()) {
      await savePhotoToIDB(filename, pureBase64, dateKey);
    }

    // Update photo cache for immediate display
    setPhotoCache(prev => ({ ...prev, [filename]: pureBase64 }));

    // ✅ SINGLE state update - using new $[photo:...]$ format
    setAllData(prev => {
      const current = prev[dateKey] || { content: '', photos: [] };

      updatedContent = current.content
        ? `${current.content}\n$[photo:${filename}]$`
        : `$[photo:${filename}]$`;

      // Don't store base64 in state - it will be loaded from IndexedDB
      updatedPhotos = [...current.photos, { ...photo, base64: undefined }];

      const merged: Record<string, DayFileData> = {
        ...prev,
        [dateKey]: {
          ...current,
          content: updatedContent,
          photos: updatedPhotos,
        },
      };

      saveToLocalStorage(merged);
      return merged;
    });

    // Native persistence (save to filesystem)
    if (isNativePlatform()) {
      try {
        await ensureFolder();

        await Filesystem.writeFile({
          path: `${APP_FOLDER}/${dateFolder}/${filename}`,
          data: pureBase64,
          directory: Directory.Documents,
        });

        await Filesystem.writeFile({
          path: `${APP_FOLDER}/${dateFolder}/content.txt`,
          data: updatedContent,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });

        // Save photos metadata (without base64)
        const photosForFile = updatedPhotos.map(p => ({
          filename: p.filename,
          path: p.path,
          timestamp: p.timestamp,
        }));

        await Filesystem.writeFile({
          path: `${APP_FOLDER}/${dateFolder}/photos.json`,
          data: JSON.stringify(photosForFile),
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
      } catch (e) {
        console.error('Failed to save photo to filesystem:', e);
      }
    }

    return photo;
  },
  [dateKey, dateFolder, ensureFolder, setPhotoCache]
);


  // Save voice note
const saveVoiceNote = useCallback(
  async (base64Data: string, duration: number): Promise<VoiceNoteData | null> => {
    const timestamp = Date.now();
    const filename = `voice_${timestamp}.webm`;

    const voice: VoiceNoteData = {
      filename,
      duration,
      timestamp,
      base64: base64Data,
    };

    let updatedVoiceNotes: VoiceNoteData[] = [];

    setAllData(prev => {
      const current = prev[dateKey] || { content: '', photos: [] };

      updatedVoiceNotes = [...(current.voiceNotes || []), voice];

      const merged: Record<string, DayFileData> = {
        ...prev,
        [dateKey]: {
          ...current,
          voiceNotes: updatedVoiceNotes,
        },
      };

      saveToLocalStorage(merged);
      return merged;
    });

    return voice;
  },
  [dateKey]
);


  // Delete voice note
const deleteVoiceNote = useCallback(
  async (filename: string) => {
    setAllData(prev => {
      const current = prev[dateKey];
      if (!current) return prev;

      const updatedVoiceNotes = (current.voiceNotes || []).filter(
        v => v.filename !== filename
      );

      const merged: Record<string, DayFileData> = {
        ...prev,
        [dateKey]: {
          ...current,
          voiceNotes: updatedVoiceNotes,
        },
      };

      saveToLocalStorage(merged);
      return merged;
    });
  },
  [dateKey]
);


  // Delete photo and remove marker from content (supports both old and new formats)
  const deletePhoto = useCallback(
  async (filename: string) => {
    // Delete from IndexedDB on web
    if (!isNativePlatform()) {
      await deletePhotoFromIDB(filename);
    }

    // Remove from cache
    setPhotoCache(prev => {
      const newCache = { ...prev };
      delete newCache[filename];
      return newCache;
    });

    setAllData(prev => {
      const current = prev[dateKey];
      if (!current) return prev;

      const updatedPhotos = current.photos.filter(
        p => p.filename !== filename
      );

      // Remove both old [photo:...] and new $[photo:...]$ formats
      const oldMarker = `[photo:${filename}]`;
      const newMarker = `$[photo:${filename}]$`;
      const updatedContent = current.content
        .split('\n')
        .filter(line => line.trim() !== oldMarker && line.trim() !== newMarker)
        .join('\n');

      const merged: Record<string, DayFileData> = {
        ...prev,
        [dateKey]: {
          ...current,
          content: updatedContent,
          photos: updatedPhotos,
        },
      };

      saveToLocalStorage(merged);
      return merged;
    });

    if (isNativePlatform()) {
      try {
        await Filesystem.deleteFile({
          path: `${APP_FOLDER}/${dateFolder}/${filename}`,
          directory: Directory.Documents,
        });

        // Update content file - remove both old and new formats
        const oldMarker = `[photo:${filename}]`;
        const newMarker = `$[photo:${filename}]$`;
        const updatedContentForFile = dayData.content
          .split('\n')
          .filter(line => line.trim() !== oldMarker && line.trim() !== newMarker)
          .join('\n');

        await Filesystem.writeFile({
          path: `${APP_FOLDER}/${dateFolder}/content.txt`,
          data: updatedContentForFile,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });

        await Filesystem.writeFile({
          path: `${APP_FOLDER}/${dateFolder}/photos.json`,
          data: JSON.stringify(
            dayData.photos.filter(p => p.filename !== filename)
          ),
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
      } catch (e) {
        console.error('Failed to delete photo:', e);
      }
    }
  },
  [dateKey, dateFolder, dayData]
);

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
          const parsed: PhotoData[] = JSON.parse(photosResult.data as string);

photos = parsed.map(p => ({
  ...p,
  path: `${APP_FOLDER}/${dateFolder}/${p.filename}`,
}));

        } catch {
          // No photos file yet
        }
        
       let meta: Partial<DayFileData> = {};

try {
  const metaResult = await Filesystem.readFile({
    path: `${APP_FOLDER}/${dateFolder}/meta.json`,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
  });
  meta = JSON.parse(metaResult.data as string);
} catch {
  // no meta yet
}

setAllData(prev => {
  const current = prev[dateKey] || { content: '', photos: [] };

  return {
    ...prev,
    [dateKey]: {
      ...current,           // 👈 keep everything
      content: contentResult.data as string,
      photos,
      ...meta,              // 👈 overwrite only known meta
    },
  };
});


      } catch {
        // No data for this date yet
      }
      setIsLoading(false);
    };
    
    loadNativeData();
  }, [dateFolder, dateKey]);

  // Get photo URL (for display) - check cache first, then IndexedDB
  const getPhotoUrl = useCallback((photo: PhotoData): string => {
    // Check in-memory cache first
    if (photoCache[photo.filename]) {
      return `data:image/jpeg;base64,${photoCache[photo.filename]}`;
    }
    
    // Check if photo has base64 (from recent add or native load)
    if (photo.base64) {
      return `data:image/jpeg;base64,${photo.base64}`;
    }

    return '';
  }, [photoCache]);

  // Load photo from IndexedDB asynchronously
  const loadPhotoFromStorage = useCallback(async (filename: string): Promise<string | null> => {
    // Check cache first
    if (photoCache[filename]) {
      return `data:image/jpeg;base64,${photoCache[filename]}`;
    }

    // For web, load from IndexedDB
    if (!isNativePlatform()) {
      const base64 = await getPhotoFromIDB(filename);
      if (base64) {
        setPhotoCache(prev => ({ ...prev, [filename]: base64 }));
        return `data:image/jpeg;base64,${base64}`;
      }
    }

    return null;
  }, [photoCache]);


  // Check if date has content
  const hasContent = useCallback((date: Date): boolean => {
    const key = new Intl.DateTimeFormat('en-CA').format(date);
    const data = allData[key];
    return (data?.content?.trim().length > 0) || (data?.photos?.length > 0);
  }, [allData]);

  return {
    content: dayData.content,
    photos: dayData.photos,
    tags: dayData.tags || [],
    mood: dayData.mood,
    location: dayData.location,
    weather: dayData.weather,
    habits: dayData.habits || {},
    voiceNotes: dayData.voiceNotes || [],
    isLoading,
    saveContent,
    saveDayMeta,
    savePhoto,
    saveVoiceNote,
    deleteVoiceNote,
    deletePhoto,
    getPhotoUrl,
    loadPhotoFromStorage,
    hasContent,
    allData
  };
};
