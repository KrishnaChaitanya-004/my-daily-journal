import { useState, useCallback, useEffect } from 'react';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';

export interface LockSettings {
  isEnabled: boolean;
  password: string;
  useBiometric: boolean;
}

const LOCK_SETTINGS_KEY = 'diary-lock-settings';
const LOCK_STATE_KEY = 'diary-lock-state';

const defaultLockSettings: LockSettings = {
  isEnabled: false,
  password: '',
  useBiometric: false,
};

export const useAppLock = () => {
  const [lockSettings, setLockSettings] = useState<LockSettings>(() => {
    try {
      const stored = localStorage.getItem(LOCK_SETTINGS_KEY);
      return stored
        ? { ...defaultLockSettings, ...JSON.parse(stored) }
        : defaultLockSettings;
    } catch {
      return defaultLockSettings;
    }
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      const settings = localStorage.getItem(LOCK_SETTINGS_KEY);
      if (!settings) return false;

      const parsed = JSON.parse(settings);
      if (!parsed.isEnabled) return false;

      const lockState = sessionStorage.getItem(LOCK_STATE_KEY);
      return lockState !== 'unlocked';
    } catch {
      return false;
    }
  });

  // Persist settings
  useEffect(() => {
    localStorage.setItem(LOCK_SETTINGS_KEY, JSON.stringify(lockSettings));
  }, [lockSettings]);

  const updateLockSettings = useCallback((updates: Partial<LockSettings>) => {
    setLockSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const setPassword = useCallback(
    (password: string) => {
      if (password.length >= 4 && password.length <= 6 && /^\d+$/.test(password)) {
        updateLockSettings({ password, isEnabled: true });
        return true;
      }
      return false;
    },
    [updateLockSettings]
  );

  const removePassword = useCallback(() => {
    updateLockSettings({ password: '', isEnabled: false, useBiometric: false });
    sessionStorage.setItem(LOCK_STATE_KEY, 'unlocked');
    setIsLocked(false);
  }, [updateLockSettings]);

  const toggleBiometric = useCallback(
    (enabled: boolean) => {
      updateLockSettings({ useBiometric: enabled });
    },
    [updateLockSettings]
  );

  // 🔓 PIN unlock
  const unlock = useCallback(
    (enteredPassword: string): boolean => {
      if (enteredPassword === lockSettings.password) {
        sessionStorage.setItem(LOCK_STATE_KEY, 'unlocked');
        setIsLocked(false);
        return true;
      }
      return false;
    },
    [lockSettings.password]
  );

  // 🔐 BIOMETRIC UNLOCK (CORRECT API)
  const unlockWithBiometric = useCallback(async (): Promise<boolean> => {
    if (!lockSettings.useBiometric) return false;

    try {
      await BiometricAuth.authenticate({
        reason: 'Unlock KC’s Diary',
        cancelTitle: 'Cancel',
        allowDeviceCredential: true, // PIN / Pattern fallback
      });

      // ✅ If no error → authenticated
      sessionStorage.setItem(LOCK_STATE_KEY, 'unlocked');
      setIsLocked(false);
      return true;
    } catch {
      console.log('Biometric authentication cancelled or failed');
      return false;
    }
  }, [lockSettings.useBiometric]);

  const lockApp = useCallback(() => {
    if (lockSettings.isEnabled) {
      sessionStorage.removeItem(LOCK_STATE_KEY);
      setIsLocked(true);
    }
  }, [lockSettings.isEnabled]);

const enableBiometricWithVerification = useCallback(async () => {
  try {
    await BiometricAuth.authenticate({
      reason: 'Enable fingerprint unlock',
      cancelTitle: 'Cancel',
      allowDeviceCredential: true,
    });

    // ✅ Only enable if verification succeeds
    updateLockSettings({ useBiometric: true });
    return true;
  } catch {
    return false;
  }
}, [updateLockSettings]);

  return {
    lockSettings,
    isLocked,
    biometricAvailable: lockSettings.useBiometric,
    setPassword,
    removePassword,
    toggleBiometric,
    enableBiometricWithVerification, 
    unlock,
    unlockWithBiometric,
    lockApp,
  };
};
