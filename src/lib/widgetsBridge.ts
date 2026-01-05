import { Capacitor } from '@capacitor/core';
import { registerPlugin } from '@capacitor/core';

type WidgetsBridgePlugin = {
  setWidgetThemeColor(options: { hex: string }): Promise<void>;
  setHabitsProgress(options: { completed: number; total: number }): Promise<void>;
  setTodaySnippet(options: { dateKey: string; snippet: string }): Promise<void>;
  refreshWidgets(): Promise<void>;
};

const WidgetsBridge = registerPlugin<WidgetsBridgePlugin>('WidgetsBridge');

export const widgetsBridge = {
  isAvailable: () => Capacitor.isNativePlatform(),

  async setWidgetThemeColor(hex: string) {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await WidgetsBridge.setWidgetThemeColor({ hex });
    } catch {
      // no-op
    }
  },

  async setHabitsProgress(completed: number, total: number) {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await WidgetsBridge.setHabitsProgress({ completed, total });
    } catch {
      // no-op
    }
  },

  async setTodaySnippet(dateKey: string, snippet: string) {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await WidgetsBridge.setTodaySnippet({ dateKey, snippet });
    } catch {
      // no-op
    }
  },

  async refresh() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await WidgetsBridge.refreshWidgets();
    } catch {
      // no-op
    }
  },
};
