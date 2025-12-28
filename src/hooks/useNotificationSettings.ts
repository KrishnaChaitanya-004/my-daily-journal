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
  const [exactAlarmGranted, setExactAlarmGranted] = useState<boolean>(true);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(settings));
  }, [settings]);

  // Ensure Android notification channel exists and check permissions
  useEffect(() => {
    const setup = async () => {
      if (!isNative) {
        if ('Notification' in window) {
          setPermissionGranted(Notification.permission === 'granted');
        }
        return;
      }

      try {
        await LocalNotifications.createChannel({
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

      // Check exact alarm permission (Android 12+)
      try {
        const exactPerm = await LocalNotifications.checkExactNotificationSetting();
        setExactAlarmGranted(exactPerm.exact_alarm === 'granted');
      } catch {
        // Older devices don't need this permission
        setExactAlarmGranted(true);
      }
    };

    setup();
  }, []);

  // Request notification permission
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

  // Request exact alarm permission (Android 12+)
  const requestExactAlarm = useCallback(async (): Promise<boolean> => {
    if (!isNative) return true;
    try {
      const result = await LocalNotifications.changeExactNotificationSetting();
      const granted = result.exact_alarm === 'granted';
      setExactAlarmGranted(granted);
      return granted;
    } catch {
      return true; // Assume allowed on older devices
    }
  }, []);

  // Schedule notification with battery-saver-friendly options
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

      // Use 'on' schedule with allowWhileIdle for reliable delivery in Doze/battery saver
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 1,
            title: "KC's Diary",
            body: settings.message,
            schedule: {
              on: { hour, minute },
              repeats: true,
              allowWhileIdle: true, // Fires even in Doze/battery saver mode
            },
            sound: 'default',
            channelId: 'daily-reminder',
            smallIcon: 'ic_stat_icon', // Uses custom notification icon if available
            autoCancel: true,
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

    // Request exact alarm permission on Android 12+ for reliable timing
    if (isNative && !exactAlarmGranted) {
      await requestExactAlarm();
    }

    setSettings(prev => ({ ...prev, enabled: true }));
    await scheduleNotification();
    return true;
  }, [requestPermission, requestExactAlarm, scheduleNotification, exactAlarmGranted]);

  const disableNotifications = useCallback(async () => {
    setSettings(prev => ({ ...prev, enabled: false }));

    if (isNative) {
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    }
  }, []);

  const updateSettings = useCallback((updates: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // Reschedule when time/message changes
  useEffect(() => {
    if (settings.enabled && isNative) {
      scheduleNotification();
    }
  }, [settings.time, settings.message, settings.enabled, scheduleNotification]);

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
