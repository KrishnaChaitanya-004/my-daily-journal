import { useCallback, useRef } from 'react';
import JSZip from 'jszip';
import { DayFileData } from './useFileStorage';
import { toast } from '@/hooks/use-toast';

const STORAGE_KEY = 'diary-app-data';
const SETTINGS_KEY = 'diary-settings';
const BOOKMARKS_KEY = 'diary-bookmarks';
const HABITS_KEY = 'diary-habits-list';

export const useDiaryExportImport = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportData = useCallback(async () => {
    try {
      const zip = new JSZip();
      const diaryFolder = zip.folder('mydairy');
      
      if (!diaryFolder) {
        throw new Error('Failed to create folder');
      }

      // Get diary data
      const diaryData = localStorage.getItem(STORAGE_KEY);
      const parsedData: Record<string, DayFileData> = diaryData ? JSON.parse(diaryData) : {};

      // Create folder structure for each date
      for (const [dateKey, dayData] of Object.entries(parsedData)) {
        const dateFolder = diaryFolder.folder(dateKey);
        if (!dateFolder) continue;

        // Save content.txt
        if (dayData.content) {
          dateFolder.file('content.txt', dayData.content);
        }

        // Save metadata (tags, location, weather, habits)
        const metadata: Record<string, any> = {};
        if (dayData.tags && dayData.tags.length > 0) metadata.tags = dayData.tags;
        if (dayData.location) metadata.location = dayData.location;
        if (dayData.weather) metadata.weather = dayData.weather;
        if (dayData.habits) metadata.habits = dayData.habits;
        
        if (Object.keys(metadata).length > 0) {
          dateFolder.file('metadata.json', JSON.stringify(metadata, null, 2));
        }

        // Save photos
        if (dayData.photos && dayData.photos.length > 0) {
          const photosWithoutBase64 = dayData.photos.map(p => ({
            filename: p.filename,
            path: p.path,
            timestamp: p.timestamp
          }));
          dateFolder.file('photos.json', JSON.stringify(photosWithoutBase64, null, 2));

          // Save each photo
          for (const photo of dayData.photos) {
            if (photo.base64) {
              const binaryData = atob(photo.base64);
              const bytes = new Uint8Array(binaryData.length);
              for (let i = 0; i < binaryData.length; i++) {
                bytes[i] = binaryData.charCodeAt(i);
              }
              dateFolder.file(photo.filename, bytes, { binary: true });
            }
          }
        }

        // Save voice notes
        if (dayData.voiceNotes && dayData.voiceNotes.length > 0) {
          const voiceNotesWithoutBase64 = dayData.voiceNotes.map(v => ({
            filename: v.filename,
            duration: v.duration,
            timestamp: v.timestamp
          }));
          dateFolder.file('voicenotes.json', JSON.stringify(voiceNotesWithoutBase64, null, 2));

          // Save each voice note
          for (const voiceNote of dayData.voiceNotes) {
            if (voiceNote.base64) {
              const binaryData = atob(voiceNote.base64);
              const bytes = new Uint8Array(binaryData.length);
              for (let i = 0; i < binaryData.length; i++) {
                bytes[i] = binaryData.charCodeAt(i);
              }
              dateFolder.file(voiceNote.filename, bytes, { binary: true });
            }
          }
        }
      }

      // Save settings
      const settingsData = localStorage.getItem(SETTINGS_KEY);
      if (settingsData) {
        diaryFolder.file('settings.json', settingsData);
      }

      // Save bookmarks
      const bookmarksData = localStorage.getItem(BOOKMARKS_KEY);
      if (bookmarksData) {
        diaryFolder.file('bookmarks.json', bookmarksData);
      }

      // Save habits list
      const habitsData = localStorage.getItem(HABITS_KEY);
      if (habitsData) {
        diaryFolder.file('habits.json', habitsData);
      }

      // Generate zip file
      const content = await zip.generateAsync({ type: 'blob' });
      
      // Download the file
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kcs-dairy-backup-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: 'Your diary data has been exported successfully.',
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export diary data. Please try again.',
        variant: 'destructive',
      });
    }
  }, []);

  const importData = useCallback(async (file: File) => {
    try {
      const zip = await JSZip.loadAsync(file);
      
      // Find the mydairy folder
      const diaryFolder = zip.folder('mydairy');
      if (!diaryFolder) {
        throw new Error('Invalid backup file: mydairy folder not found');
      }

      const newData: Record<string, DayFileData> = {};

      // Get all folders (dates)
      const folders = new Set<string>();
      diaryFolder.forEach((relativePath) => {
        const parts = relativePath.split('/');
        if (parts.length > 1 && parts[0]) {
          folders.add(parts[0]);
        }
      });

      // Process each date folder
      for (const dateKey of folders) {
        const dateFolder = diaryFolder.folder(dateKey);
        if (!dateFolder) continue;

        const dayData: DayFileData = {
          content: '',
          photos: [],
          tags: [],
          voiceNotes: []
        };

        // Read content.txt
        const contentFile = dateFolder.file('content.txt');
        if (contentFile) {
          dayData.content = await contentFile.async('string');
        }

        // Read metadata.json (tags, location, weather, habits)
        const metadataFile = dateFolder.file('metadata.json');
        if (metadataFile) {
          const metadataJson = await metadataFile.async('string');
          const metadata = JSON.parse(metadataJson);
          if (metadata.tags) dayData.tags = metadata.tags;
          if (metadata.location) dayData.location = metadata.location;
          if (metadata.weather) dayData.weather = metadata.weather;
          if (metadata.habits) dayData.habits = metadata.habits;
        }

        // Read photos.json
        const photosJsonFile = dateFolder.file('photos.json');
        let photosMeta: Array<{ filename: string; path?: string; timestamp?: number }> = [];
        if (photosJsonFile) {
          const photosJson = await photosJsonFile.async('string');
          photosMeta = JSON.parse(photosJson);
        }

        // Read each photo file
        for (const photoMeta of photosMeta) {
          const photoFile = dateFolder.file(photoMeta.filename);
          if (photoFile) {
            const photoData = await photoFile.async('base64');
            dayData.photos.push({
              ...photoMeta,
              base64: photoData
            } as any);
          }
        }

        // Read voicenotes.json
        const voiceNotesJsonFile = dateFolder.file('voicenotes.json');
        let voiceNotesMeta: Array<{ filename: string; duration: number; timestamp: number }> = [];
        if (voiceNotesJsonFile) {
          const voiceNotesJson = await voiceNotesJsonFile.async('string');
          voiceNotesMeta = JSON.parse(voiceNotesJson);
        }

        // Read each voice note file
        for (const voiceMeta of voiceNotesMeta) {
          const voiceFile = dateFolder.file(voiceMeta.filename);
          if (voiceFile) {
            const voiceData = await voiceFile.async('base64');
            dayData.voiceNotes!.push({
              ...voiceMeta,
              base64: voiceData
            });
          }
        }

        newData[dateKey] = dayData;
      }

      // Import settings
      const settingsFile = diaryFolder.file('settings.json');
      if (settingsFile) {
        const settingsJson = await settingsFile.async('string');
        localStorage.setItem(SETTINGS_KEY, settingsJson);
      }

      // Import bookmarks
      const bookmarksFile = diaryFolder.file('bookmarks.json');
      if (bookmarksFile) {
        const bookmarksJson = await bookmarksFile.async('string');
        localStorage.setItem(BOOKMARKS_KEY, bookmarksJson);
      }

      // Import habits list
      const habitsFile = diaryFolder.file('habits.json');
      if (habitsFile) {
        const habitsJson = await habitsFile.async('string');
        localStorage.setItem(HABITS_KEY, habitsJson);
      }

      // Merge with existing data or replace
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));

      toast({
        title: 'Import Successful',
        description: 'Your diary data has been imported. Refreshing...',
      });

      // Reload the page to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import diary data. Please check the file format.',
        variant: 'destructive',
      });
    }
  }, []);

  const triggerImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importData(file);
    }
    // Reset the input so the same file can be selected again
    event.target.value = '';
  }, [importData]);

  return {
    exportData,
    triggerImport,
    handleFileChange,
    fileInputRef
  };
};
