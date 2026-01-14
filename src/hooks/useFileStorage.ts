import { useState, useCallback, useEffect } from 'react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { syncWidgetStats } from '@/lib/syncWidgetStats';

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

const APP_FOLDER = 'kcsdiary';

// Use app-private storage (Data directory) instead of public Documents
// This ensures diary data is NOT accessible via file managers
const STORAGE_DIRECTORY = Directory.Data;

const formatDateFolder = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

// Migration function to move data from Documents to Data (private)
const migrateToPrivateStorage = async () => {
  if (!isNativePlatform()) return;

  try {
    // Check if old data exists in Documents
    const oldDir = await Filesystem.readdir({
      path: 'mydiaryapp',
      directory: Directory.Documents
    });

    if (oldDir.files.length > 0) {
      console.log('Migrating data from public to private storage...');

      // Create new directory in private storage
      try {
        await Filesystem.mkdir({
          path: APP_FOLDER,
          directory: STORAGE_DIRECTORY,
          recursive: true
        });
      } catch {} // May already exist

      // Copy each date folder
      for (const file of oldDir.files) {
        if (file.type === 'directory') {
          try {
            // Read all files in the date folder
            const dateFiles = await Filesystem.readdir({
              path: `mydiaryapp/${file.name}`,
              directory: Directory.Documents
            });

            // Create date folder in private storage
            await Filesystem.mkdir({
              path: `${APP_FOLDER}/${file.name}`,
              directory: STORAGE_DIRECTORY,
              recursive: true
            });

            // Copy each file
            for (const dateFile of dateFiles.files) {
              try {
                const fileContent = await Filesystem.readFile({
                  path: `mydiaryapp/${file.name}/${dateFile.name}`,
                  directory: Directory.Documents
                });

                await Filesystem.writeFile({
                  path: `${APP_FOLDER}/${file.name}/${dateFile.name}`,
                  data: fileContent.data as string,
                  directory: STORAGE_DIRECTORY
                });
              } catch (e) {
                console.error(`Failed to copy file ${dateFile.name}:`, e);
              }
            }
          } catch (e) {
            console.error(`Failed to migrate folder ${file.name}:`, e);
          }
        }
      }

      // Delete old public folder after successful migration
      try {
        await Filesystem.rmdir({
          path: 'mydiaryapp',
          directory: Directory.Documents,
          recursive: true
        });
        console.log('Migration complete, old data removed');
      } catch (e) {
        console.error('Failed to remove old data folder:', e);
      }
    }
  } catch {
    // No old data to migrate
  }
};

// Run migration on load
migrateToPrivateStorage();

// Fallback to localStorage for web
const STORAGE_KEY = 'diary-app-data';

// Custom event for cross-component state sync
const STORAGE_UPDATE_EVENT = 'diary-storage-update';

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
  // Dispatch event to notify other hook instances
  window.dispatchEvent(new CustomEvent(STORAGE_UPDATE_EVENT));
};

// Export for use in other hooks
export const getAllDiaryData = (): Record<string, DayFileData> => {
  return loadFromLocalStorage();
};

export const useFileStorage = (selectedDate: Date) => {
  const [allData, setAllData] = useState<Record<string, DayFileData>>(loadFromLocalStorage);
  const [isLoading, setIsLoading] = useState(false);

  const dateFolder = formatDateFolder(selectedDate);
  const dateKey = new Intl.DateTimeFormat('en-CA').format(selectedDate);
  // yyyy-MM-dd
  const dayData = allData[dateKey] || { content: '', photos: [] };

  // Listen for storage updates from other hook instances
  useEffect(() => {
    const refreshData = () => {
      const freshData = loadFromLocalStorage();
      setAllData(freshData);
    };

    // Listen for custom storage update event
    window.addEventListener(STORAGE_UPDATE_EVENT, refreshData);
    
    // Refresh when page regains focus (e.g., returning from editor)
    window.addEventListener('focus', refreshData);
    
    // Refresh on pageshow (handles bfcache scenarios on mobile)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        refreshData();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    
    // Refresh when visibility changes to visible (app comes to foreground)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Also refresh on popstate (browser back/forward navigation)
    const handlePopState = () => {
      // Small delay to ensure navigation is complete
      setTimeout(refreshData, 50);
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener(STORAGE_UPDATE_EVENT, refreshData);
      window.removeEventListener('focus', refreshData);
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Create folder structure on native
  const ensureFolder = useCallback(async () => {
    if (!isNativePlatform()) return;

    try {
      await Filesystem.mkdir({
        path: `${APP_FOLDER}/${dateFolder}`,
        directory: STORAGE_DIRECTORY,
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
      directory: STORAGE_DIRECTORY,
      encoding: Encoding.UTF8,
    });
  };

  // Save content to file (native) or localStorage (web)
  // Returns a Promise that resolves when save is complete
  const saveContent = useCallback(async (newContent: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Use functional update to ensure we always have the latest state
        setAllData(prev => {
          const currentDay = prev[dateKey] || { content: '', photos: [] };

          // Create merged data preserving all existing day data
          const merged = {
            ...prev,
            [dateKey]: {
              ...currentDay,
              content: newContent,
            },
          };

          // Synchronously save to localStorage to prevent data loss
          saveToLocalStorage(merged);
          return merged;
        });

        // Sync stats to widgets after saving
        syncWidgetStats();

        if (isNativePlatform()) {
          await ensureFolder();
          try {
            await Filesystem.writeFile({
              path: `${APP_FOLDER}/${dateFolder}/content.txt`,
              data: newContent,
              directory: STORAGE_DIRECTORY,
              encoding: Encoding.UTF8,
            });
          } catch (e) {
            console.error('Failed to save content:', e);
          }
        }

        // Small delay to ensure state updates propagate
        setTimeout(resolve, 10);
      } catch (error) {
        reject(error);
      }
    });
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
            directory: STORAGE_DIRECTORY,
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
        base64: pureBase64, // Always store base64 for reliable display
      };

      let updatedContent = '';
      let updatedPhotos: PhotoData[] = [];

      // ✅ SINGLE state update
      setAllData(prev => {
        const current = prev[dateKey] || { content: '', photos: [] };

        updatedContent = current.content
          ? `${current.content}\n[photo:${filename}]`
          : `[photo:${filename}]`;

        updatedPhotos = [...current.photos, photo];

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

      // Native persistence (also save to filesystem for backup/export)
      if (isNativePlatform()) {
        try {
          await ensureFolder();

          await Filesystem.writeFile({
            path: `${APP_FOLDER}/${dateFolder}/${filename}`,
            data: pureBase64,
            directory: STORAGE_DIRECTORY,
          });

          await Filesystem.writeFile({
            path: `${APP_FOLDER}/${dateFolder}/content.txt`,
            data: updatedContent,
            directory: STORAGE_DIRECTORY,
            encoding: Encoding.UTF8,
          });

          // Save photos metadata (without base64 to save space in file)
          const photosForFile = updatedPhotos.map(p => ({
            filename: p.filename,
            path: p.path,
            timestamp: p.timestamp,
          }));

          await Filesystem.writeFile({
            path: `${APP_FOLDER}/${dateFolder}/photos.json`,
            data: JSON.stringify(photosForFile),
            directory: STORAGE_DIRECTORY,
            encoding: Encoding.UTF8,
          });
        } catch (e) {
          console.error('Failed to save photo to filesystem:', e);
        }
      }

      return photo;
    },
    [dateKey, dateFolder, ensureFolder]
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

  // Delete photo and remove marker from content
  const deletePhoto = useCallback(
    async (filename: string) => {
      setAllData(prev => {
        const current = prev[dateKey];
        if (!current) return prev;

        const updatedPhotos = current.photos.filter(
          p => p.filename !== filename
        );

        const photoMarker = `[photo:${filename}]`;
        const updatedContent = current.content
          .split('\n')
          .filter(line => line !== photoMarker)
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
            directory: STORAGE_DIRECTORY,
          });

          await Filesystem.writeFile({
            path: `${APP_FOLDER}/${dateFolder}/content.txt`,
            data: dayData.content
              .split('\n')
              .filter(line => line !== `[photo:${filename}]`)
              .join('\n'),
            directory: STORAGE_DIRECTORY,
            encoding: Encoding.UTF8,
          });

          await Filesystem.writeFile({
            path: `${APP_FOLDER}/${dateFolder}/photos.json`,
            data: JSON.stringify(
              dayData.photos.filter(p => p.filename !== filename)
            ),
            directory: STORAGE_DIRECTORY,
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
          directory: STORAGE_DIRECTORY,
          encoding: Encoding.UTF8
        });

        // Load photos metadata and their base64 data
        let photos: PhotoData[] = [];
        try {
          const photosResult = await Filesystem.readFile({
            path: `${APP_FOLDER}/${dateFolder}/photos.json`,
            directory: STORAGE_DIRECTORY,
            encoding: Encoding.UTF8
          });
          const parsed: PhotoData[] = JSON.parse(photosResult.data as string);

          // Load base64 data for each photo
          photos = await Promise.all(parsed.map(async (p) => {
            try {
              const photoFile = await Filesystem.readFile({
                path: `${APP_FOLDER}/${dateFolder}/${p.filename}`,
                directory: STORAGE_DIRECTORY
              });
              return {
                ...p,
                path: `${APP_FOLDER}/${dateFolder}/${p.filename}`,
                base64: photoFile.data as string
              };
            } catch {
              // Photo file missing, return without base64
              return {
                ...p,
                path: `${APP_FOLDER}/${dateFolder}/${p.filename}`
              };
            }
          }));

        } catch {
          // No photos file yet
        }

        let meta: Partial<DayFileData> = {};

        try {
          const metaResult = await Filesystem.readFile({
            path: `${APP_FOLDER}/${dateFolder}/meta.json`,
            directory: STORAGE_DIRECTORY,
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

  // Get photo URL (for display)
  const getPhotoUrl = useCallback((photo: PhotoData): string => {
    // Always prefer base64 - works on both web and native
    if (photo.base64) {
      return `data:image/jpeg;base64,${photo.base64}`;
    }

    return '';
  }, []);

  // Check if date has content
  const hasContent = useCallback((date: Date): boolean => {
    const key = new Intl.DateTimeFormat('en-CA').format(date);
    const data = allData[key];
    if (!data) return false;

    // Check for actual text content (not just whitespace or empty photo markers)
    const contentText = data.content || '';
    const trimmedContent = contentText.trim();

    // If content only contains photo markers with no actual photos, it's not real content
    if (trimmedContent) {
      // Remove all photo markers and check if anything remains
      const withoutPhotoMarkers = trimmedContent.replace(/\[photo:[^\]]+\]/g, '').trim();
      if (withoutPhotoMarkers.length > 0) return true;
    }

    // Check for actual photos
    if (data.photos && data.photos.length > 0) return true;

    // Check for voice notes
    if (data.voiceNotes && data.voiceNotes.length > 0) return true;

    return false;
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
    hasContent,
    allData
  };
};
