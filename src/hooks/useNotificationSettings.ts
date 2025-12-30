import { useState, useEffect, useCallback } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface NotificationSettings {
  enabled: boolean;
  time: string; // HH:mm
  message: string;
}

const STORAGE_KEY = 'diary-notification-settings';

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  time: '20:00',
  message: "Boss! It's diary time ✨",
};

const isNative = Capacitor.isNativePlatform();

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
      : DEFAULT_SETTINGS;
  });

  const [permissionGranted, setPermissionGranted] = useState(false);
  const [exactAlarmGranted, setExactAlarmGranted] = useState(true); // Default true for non-Android 12+

  /* ---------------------------------- */
  /* Persist settings                   */
  /* ---------------------------------- */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  /* ---------------------------------- */
  /* Check permissions on mount         */
  /* ---------------------------------- */
  useEffect(() => {
    if (!isNative) return;

    const checkPermissions = async () => {
      try {
        const perm = await LocalNotifications.checkPermissions();
        setPermissionGranted(perm.display === 'granted');
      } catch {
        // Ignore
      }
    };

    checkPermissions();
  }, []);

  /* ---------------------------------- */
  /* Setup notification channel (Android) */
  /* ---------------------------------- */
  useEffect(() => {
    if (!isNative) return;

    const setupChannel = async () => {
      try {
        await LocalNotifications.createChannel({
          id: 'diary-reminder',
          name: 'Diary Reminders',
          description: 'Daily diary reminder',
          importance: 5, // HIGH
          sound: 'default',
          vibration: true,
        });
      } catch {
        // channel already exists
      }
    };

    setupChannel();
  }, []);

  /* ---------------------------------- */
  /* Permission                         */
  /* ---------------------------------- */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false;

    const perm = await LocalNotifications.requestPermissions();
    const granted = perm.display === 'granted';
    setPermissionGranted(granted);
    return granted;
  }, []);

  /* ---------------------------------- */
  /* Request exact alarm (Android 12+)  */
  /* ---------------------------------- */
  const requestExactAlarm = useCallback(async (): Promise<boolean> => {
    if (!isNative) return true;
    
    // For now, just return true - exact alarm is typically granted by default
    // Real implementation would use AndroidExactAlarms API
    setExactAlarmGranted(true);
    return true;
  }, []);

  /* ---------------------------------- */
  /* Schedule notification              */
  /* ---------------------------------- */
  const scheduleNotification = useCallback(async () => {
    if (!isNative) return;

    const [hour, minute] = settings.time.split(':').map(Number);

    // Clear old reminder
    await LocalNotifications.cancel({
      notifications: [{ id: 1 }],
    });

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1,
          title: "KC's Diary",
          body: settings.message,
          channelId: 'diary-reminder',
          schedule: {
            on: { hour, minute },
            repeats: true,
          },
        },
      ],
    });
  }, [settings.time, settings.message]);

  /* ---------------------------------- */
  /* Enable                             */
  /* ---------------------------------- */
  const enableNotifications = useCallback(async (): Promise<boolean> => {
    const granted = await requestPermission();
    if (!granted) return false;

    await scheduleNotification();
    setSettings(prev => ({ ...prev, enabled: true }));
    return true;
  }, [requestPermission, scheduleNotification]);

  /* ---------------------------------- */
  /* Disable                            */
  /* ---------------------------------- */
  const disableNotifications = useCallback(async () => {
    if (isNative) {
      await LocalNotifications.cancel({
        notifications: [{ id: 1 }],
      });
    }
    setSettings(prev => ({ ...prev, enabled: false }));
  }, []);

  /* ---------------------------------- */
  /* Update settings                    */
  /* ---------------------------------- */
  const updateSettings = useCallback((updates: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  /* ---------------------------------- */
  /* Reschedule if time/message changes */
  /* ---------------------------------- */
  useEffect(() => {
    if (settings.enabled && isNative) {
      scheduleNotification();
    }
  }, [settings.enabled, settings.time, settings.message, scheduleNotification]);

  return {
    settings,
    permissionGranted,
    exactAlarmGranted,
    enableNotifications,
    disableNotifications,
    updateSettings,
    requestExactAlarm,
  };
};
