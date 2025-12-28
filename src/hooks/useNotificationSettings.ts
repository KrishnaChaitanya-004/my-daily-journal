import { useState, useEffect, useCallback } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface NotificationSettings {
  enabled: boolean;
  time: string; // HH:mm
  message: string;
}

const KEY = 'diary-notification-settings';

const defaultSettings: NotificationSettings = {
  enabled: false,
  time: '20:00',
  message: "Boss! It's diary time.",
};

const isNative = Capacitor.isNativePlatform();

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const stored = localStorage.getItem(KEY);
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  });
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(settings));
  }, [settings]);

  // Ensure Android notification channel exists (required on many devices)
  useEffect(() => {
    const setup = async () => {
      if (!isNative) return;
      try {
        await (LocalNotifications as any).createChannel?.({
          id: 'daily-reminder',
          name: 'Daily reminders',
          description: 'Daily diary reminder notifications',
          importance: 5,
          visibility: 1,
          sound: 'default',
        });
      } catch {
        // ignore
      }

      const perm = await LocalNotifications.checkPermissions();
      setPermissionGranted(perm.display === 'granted');
    };

    setup();
  }, []);

  // 🔐 Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isNative) {
      const res = await Notification.requestPermission();
      const granted = res === 'granted';
      setPermissionGranted(granted);
      return granted;
    }

    const perm = await LocalNotifications.requestPermissions();
    const granted = perm.display === 'granted';
    setPermissionGranted(granted);
    return granted;
  }, []);

  // ⏰ Schedule notification
  const scheduleNotification = useCallback(async () => {
    const [hour, minute] = settings.time.split(':').map(Number);
    const now = new Date();

    const scheduleAt = new Date();
    scheduleAt.setHours(hour, minute, 0, 0);

    if (scheduleAt <= now) {
      scheduleAt.setDate(scheduleAt.getDate() + 1);
    }

    if (isNative) {
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

      // Use a repeating daily schedule so it can fire even when the app is closed
      const nativeSchedule: any = {
        on: { hour, minute },
        repeats: true,
        every: 'day',
      };

      await LocalNotifications.schedule({
        notifications: [
          {
            id: 1,
            title: "KC's Diary",
            body: settings.message,
            schedule: nativeSchedule,
            sound: 'default',
            channelId: 'daily-reminder',
          },
        ],
      });
    } else {
      setTimeout(() => {
        new Notification("KC's Diary", { body: settings.message });
      }, scheduleAt.getTime() - now.getTime());
    }
  }, [settings]);

  const enableNotifications = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) return false;

    setSettings(prev => ({ ...prev, enabled: true }));
    await scheduleNotification();
    return true;
  }, [requestPermission, scheduleNotification]);

  const disableNotifications = useCallback(async () => {
    setSettings(prev => ({ ...prev, enabled: false }));

    if (isNative) {
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    }
  }, []);

  const updateSettings = useCallback((updates: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // 🔁 Reschedule when time/message changes
  useEffect(() => {
    if (settings.enabled) {
      scheduleNotification();
    }
  }, [settings.time, settings.message]);

  return {
    settings,
    permissionGranted,
    enableNotifications,
    disableNotifications,
    updateSettings,
  };
};
