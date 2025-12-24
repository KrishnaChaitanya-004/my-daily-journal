import { useState, useCallback, useEffect } from 'react';

export interface NotificationSettings {
  enabled: boolean;
  time: string; // HH:MM format
  message: string;
}

const NOTIFICATION_SETTINGS_KEY = 'diary-notification-settings';

const defaultNotificationSettings: NotificationSettings = {
  enabled: false,
  time: '20:00',
  message: "boss! its diary time ✨"
};

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      return stored ? { ...defaultNotificationSettings, ...JSON.parse(stored) } : defaultNotificationSettings;
    } catch {
      return defaultNotificationSettings;
    }
  });

  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted');
    }
  }, []);

  // Save settings when changed
  useEffect(() => {
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Schedule notification
  useEffect(() => {
    if (!settings.enabled || !permissionGranted) return;

    const scheduleNotification = () => {
      const now = new Date();
      const [hours, minutes] = settings.time.split(':').map(Number);
      
      let scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);
      
      // If time has passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
      
      const delay = scheduledTime.getTime() - now.getTime();
      
      const timeoutId = setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification("KC's Dairy", {
            body: settings.message,
            icon: '/favicon.ico',
            tag: 'diary-reminder',
            requireInteraction: false
          });
        }
        // Reschedule for next day
        scheduleNotification();
      }, delay);
      
      return timeoutId;
    };

    const timeoutId = scheduleNotification();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [settings.enabled, settings.time, settings.message, permissionGranted]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      setPermissionGranted(true);
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    setPermissionGranted(granted);
    return granted;
  }, []);

  const updateSettings = useCallback((updates: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const enableNotifications = useCallback(async (): Promise<boolean> => {
    const granted = await requestPermission();
    if (granted) {
      updateSettings({ enabled: true });
    }
    return granted;
  }, [requestPermission, updateSettings]);

  const disableNotifications = useCallback(() => {
    updateSettings({ enabled: false });
  }, [updateSettings]);

  return {
    settings,
    permissionGranted,
    updateSettings,
    enableNotifications,
    disableNotifications,
    requestPermission
  };
};
