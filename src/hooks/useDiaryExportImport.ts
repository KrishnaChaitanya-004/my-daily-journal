import { useCallback, useRef } from 'react';
import JSZip from 'jszip';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { toast } from '@/hooks/use-toast';
import { DayFileData } from './useFileStorage';

const STORAGE_KEY = 'diary-app-data';
const SETTINGS_KEY = 'diary-settings';
const BOOKMARKS_KEY = 'diary-bookmarks';
const HABITS_KEY = 'diary-habits-list';

export const useDiaryExportImport = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* --------------------------------------------------
   * EXPORT
   * -------------------------------------------------- */
  const exportData = useCallback(async () => {
    try {
      const zip = new JSZip();
      const diaryFolder = zip.folder('mydairy');
      if (!diaryFolder) throw new Error('ZIP folder creation failed');

      /* ---- diary data ---- */
      const rawDiary = localStorage.getItem(STORAGE_KEY);
      const diaryData: Record<string, DayFileData> = rawDiary
        ? JSON.parse(rawDiary)
        : {};

      for (const [dateKey, day] of Object.entries(diaryData)) {
        const dateFolder = diaryFolder.folder(dateKey);
        if (!dateFolder) continue;

        if (day.content) {
          dateFolder.file('content.txt', day.content);
        }

        const metadata: any = {};
        if (day.tags?.length) metadata.tags = day.tags;
        if (day.location) metadata.location = day.location;
        if (day.weather) metadata.weather = day.weather;
        if (day.habits) metadata.habits = day.habits;

        if (Object.keys(metadata).length) {
          dateFolder.file('metadata.json', JSON.stringify(metadata, null, 2));
        }

        /* ---- photos ---- */
        if (day.photos?.length) {
          dateFolder.file(
            'photos.json',
            JSON.stringify(
              day.photos.map(p => ({
                filename: p.filename,
                timestamp: p.timestamp,
              })),
              null,
              2
            )
          );

          for (const p of day.photos) {
            if (!p.base64) continue;
            const cleanBase64 = p.base64.split(',').pop()!;
            dateFolder.file(p.filename, cleanBase64, { base64: true });
          }
        }

        /* ---- voice notes ---- */
        if (day.voiceNotes?.length) {
          dateFolder.file(
            'voicenotes.json',
            JSON.stringify(
              day.voiceNotes.map(v => ({
                filename: v.filename,
                duration: v.duration,
                timestamp: v.timestamp,
              })),
              null,
              2
            )
          );

          for (const v of day.voiceNotes) {
            if (!v.base64) continue;
            const cleanBase64 = v.base64.split(',').pop()!;
            dateFolder.file(v.filename, cleanBase64, { base64: true });
          }
        }
      }

      /* ---- app-level data ---- */
      const settings = localStorage.getItem(SETTINGS_KEY);
      if (settings) diaryFolder.file('settings.json', settings);

      const bookmarks = localStorage.getItem(BOOKMARKS_KEY);
      if (bookmarks) diaryFolder.file('bookmarks.json', bookmarks);

      const habits = localStorage.getItem(HABITS_KEY);
      if (habits) diaryFolder.file('habits.json', habits);

      /* ---- write ZIP to device ---- */
      const base64Zip = await zip.generateAsync({ type: 'base64' });
      const fileName = `kcs-diary-backup-${Date.now()}.zip`;

      await Filesystem.writeFile({
        path: fileName,
        data: base64Zip,
        directory: Directory.Documents,
       
      });

      await Share.share({
        title: "KC's Diary Backup",
        text: 'Diary backup file',
        url: `file://${Directory.Documents}/${fileName}`,
      });

      toast({
        title: 'Export successful',
        description: 'Backup file created successfully',
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Export failed',
        description: 'Could not create backup',
        variant: 'destructive',
      });
    }
  }, []);

  /* --------------------------------------------------
   * IMPORT
   * -------------------------------------------------- */
  const importData = useCallback(async (file: File) => {
    try {
      const zip = await JSZip.loadAsync(file);
      const diaryFolder = zip.folder('mydairy');
      if (!diaryFolder) throw new Error('Invalid backup file');

      const existing =
        JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

      const imported: Record<string, DayFileData> = {};

      const dates = new Set<string>();
      diaryFolder.forEach(path => {
        const d = path.split('/')[0];
        if (d) dates.add(d);
      });

      for (const dateKey of dates) {
        const dateFolder = diaryFolder.folder(dateKey);
        if (!dateFolder) continue;

        const day: DayFileData = {
          content: '',
          photos: [],
          tags: [],
          voiceNotes: [],
        };

        const content = dateFolder.file('content.txt');
        if (content) day.content = await content.async('string');

        const meta = dateFolder.file('metadata.json');
        if (meta) {
          const m = JSON.parse(await meta.async('string'));
          Object.assign(day, m);
        }

        /* ---- photos ---- */
        const photosJson = dateFolder.file('photos.json');
        if (photosJson) {
          const list = JSON.parse(await photosJson.async('string'));
          for (const p of list) {
            const f = dateFolder.file(p.filename);
            if (!f) continue;
            const base64 = await f.async('base64');
            day.photos!.push({
              ...p,
              base64: `data:image/jpeg;base64,${base64}`,
            });
          }
        }

        /* ---- voice notes ---- */
        const voiceJson = dateFolder.file('voicenotes.json');
        if (voiceJson) {
          const list = JSON.parse(await voiceJson.async('string'));
          for (const v of list) {
            const f = dateFolder.file(v.filename);
            if (!f) continue;
            const base64 = await f.async('base64');
            day.voiceNotes!.push({
              ...v,
              base64: `data:audio/mpeg;base64,${base64}`,
            });
          }
        }

        imported[dateKey] = day;
      }

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...existing, ...imported })
      );

      const settings = diaryFolder.file('settings.json');
      if (settings)
        localStorage.setItem(
          SETTINGS_KEY,
          await settings.async('string')
        );

      const bookmarks = diaryFolder.file('bookmarks.json');
      if (bookmarks)
        localStorage.setItem(
          BOOKMARKS_KEY,
          await bookmarks.async('string')
        );

      const habits = diaryFolder.file('habits.json');
      if (habits)
        localStorage.setItem(
          HABITS_KEY,
          await habits.async('string')
        );

      toast({
        title: 'Import successful',
        description: 'Restarting app…',
      });

      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Import failed',
        description: 'Invalid or corrupted backup file',
        variant: 'destructive',
      });
    }
  }, []);

  const triggerImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) importData(file);
      e.target.value = '';
    },
    [importData]
  );

  return {
    exportData,
    triggerImport,
    handleFileChange,
    fileInputRef,
  };
};
