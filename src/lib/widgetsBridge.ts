import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

/**
 * Widget data bridge using file-based approach.
 * 
 * Instead of using a custom Capacitor plugin (which was unreliable),
 * we write widget data to a JSON file that native Android code reads.
 * 
 * Flow:
 * 1. JS writes to /files/widget-data.json via @capacitor/filesystem
 * 2. Native WidgetDataReader.java reads this file
 * 3. MainActivity.onResume() triggers widget refresh
 * 4. Widgets display correct data
 */

const WIDGET_DATA_FILE = 'widget-data.json';

interface WidgetData {
  habitsCompleted: number;
  habitsTotal: number;
  habitsDate: string;
  todaySnippet: string;
  todayDate: string;
  statsEntries: number;
  statsStreak: number;
  statsWords: number;
  themeColor: string;
  lastUpdated: string;
}

// In-memory cache to reduce file reads
let cachedData: WidgetData | null = null;

/**
 * Read current widget data from file
 */
async function readWidgetData(): Promise<WidgetData> {
  if (cachedData) return cachedData;

  const defaultData: WidgetData = {
    habitsCompleted: 0,
    habitsTotal: 0,
    habitsDate: '',
    todaySnippet: '',
    todayDate: '',
    statsEntries: 0,
    statsStreak: 0,
    statsWords: 0,
    themeColor: '#7C3AED',
    lastUpdated: new Date().toISOString(),
  };

  try {
    const result = await Filesystem.readFile({
      path: WIDGET_DATA_FILE,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });

    const parsed = JSON.parse(result.data as string) as WidgetData;
    cachedData = { ...defaultData, ...parsed };
    return cachedData;
  } catch {
    // File doesn't exist yet, use defaults
    cachedData = defaultData;
    return defaultData;
  }
}

/**
 * Write widget data to file
 */
async function writeWidgetData(data: Partial<WidgetData>): Promise<void> {
  try {
    const current = await readWidgetData();
    const updated: WidgetData = {
      ...current,
      ...data,
      lastUpdated: new Date().toISOString(),
    };

    await Filesystem.writeFile({
      path: WIDGET_DATA_FILE,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
      data: JSON.stringify(updated),
    });

    // Update cache
    cachedData = updated;
  } catch (e) {
    console.warn('[widgetsBridge] Failed to write widget data:', e);
  }
}

export const widgetsBridge = {
  isAvailable: () => Capacitor.isNativePlatform(),

  async setWidgetThemeColor(hex: string) {
    if (!Capacitor.isNativePlatform()) return;
    await writeWidgetData({ themeColor: hex });
  },

  async setHabitsProgress(completed: number, total: number) {
    if (!Capacitor.isNativePlatform()) return;

    const now = new Date();
    const habitsDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    await writeWidgetData({ habitsCompleted: completed, habitsTotal: total, habitsDate });
  },

  async setTodaySnippet(dateKey: string, snippet: string) {
    if (!Capacitor.isNativePlatform()) return;
    await writeWidgetData({ todayDate: dateKey, todaySnippet: snippet });
  },

  async setStats(entries: number, streak: number, words: number) {
    if (!Capacitor.isNativePlatform()) return;
    await writeWidgetData({
      statsEntries: entries,
      statsStreak: streak,
      statsWords: words,
    });
  },

  async refresh() {
    // No-op: widgets refresh when MainActivity.onResume() is called
    // This method exists for API compatibility
  },

  /**
   * Force a full sync of all widget data.
   * Useful when the app starts or comes to foreground.
   */
  async syncAll(data: {
    habitsCompleted?: number;
    habitsTotal?: number;
    todaySnippet?: string;
    todayDate?: string;
    statsEntries?: number;
    statsStreak?: number;
    statsWords?: number;
    themeColor?: string;
  }) {
    if (!Capacitor.isNativePlatform()) return;
    await writeWidgetData(data);
  },
};
