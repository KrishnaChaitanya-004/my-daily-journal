import { useState, useCallback, useEffect } from 'react';

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
  useBiometric: false
};

export const useAppLock = () => {
  const [lockSettings, setLockSettings] = useState<LockSettings>(() => {
    try {
      const stored = localStorage.getItem(LOCK_SETTINGS_KEY);
      return stored ? { ...defaultLockSettings, ...JSON.parse(stored) } : defaultLockSettings;
    } catch {
      return defaultLockSettings;
    }
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      // Check if lock is enabled and if app was locked
      const settings = localStorage.getItem(LOCK_SETTINGS_KEY);
      if (!settings) return false;
      const parsed = JSON.parse(settings);
      if (!parsed.isEnabled) return false;
      
      // Check session state
      const lockState = sessionStorage.getItem(LOCK_STATE_KEY);
      return lockState !== 'unlocked';
    } catch {
      return false;
    }
  });

  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Check if biometric is available
  useEffect(() => {
    const checkBiometric = async () => {
      try {
        if (window.PublicKeyCredential) {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setBiometricAvailable(available);
        }
      } catch {
        setBiometricAvailable(false);
      }
    };
    checkBiometric();
  }, []);

  // Save settings when changed
  useEffect(() => {
    localStorage.setItem(LOCK_SETTINGS_KEY, JSON.stringify(lockSettings));
  }, [lockSettings]);

  const updateLockSettings = useCallback((updates: Partial<LockSettings>) => {
    setLockSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const setPassword = useCallback((password: string) => {
    if (password.length >= 4 && password.length <= 6 && /^\d+$/.test(password)) {
      updateLockSettings({ password, isEnabled: true });
      return true;
    }
    return false;
  }, [updateLockSettings]);

  const removePassword = useCallback(() => {
    updateLockSettings({ password: '', isEnabled: false, useBiometric: false });
    sessionStorage.setItem(LOCK_STATE_KEY, 'unlocked');
    setIsLocked(false);
  }, [updateLockSettings]);

  const toggleBiometric = useCallback((enabled: boolean) => {
    updateLockSettings({ useBiometric: enabled });
  }, [updateLockSettings]);

  const unlock = useCallback((enteredPassword: string): boolean => {
    if (enteredPassword === lockSettings.password) {
      sessionStorage.setItem(LOCK_STATE_KEY, 'unlocked');
      setIsLocked(false);
      return true;
    }
    return false;
  }, [lockSettings.password]);

  const unlockWithBiometric = useCallback(async (): Promise<boolean> => {
    if (!lockSettings.useBiometric || !biometricAvailable) return false;

    try {
      // Use WebAuthn for biometric authentication
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'required',
          rpId: window.location.hostname,
          allowCredentials: []
        }
      });

      if (credential) {
        sessionStorage.setItem(LOCK_STATE_KEY, 'unlocked');
        setIsLocked(false);
        return true;
      }
    } catch (error) {
      console.log('Biometric auth failed or cancelled');
    }
    return false;
  }, [lockSettings.useBiometric, biometricAvailable]);

  const lockApp = useCallback(() => {
    if (lockSettings.isEnabled) {
      sessionStorage.removeItem(LOCK_STATE_KEY);
      setIsLocked(true);
    }
  }, [lockSettings.isEnabled]);

  return {
    lockSettings,
    isLocked,
    biometricAvailable,
    setPassword,
    removePassword,
    toggleBiometric,
    unlock,
    unlockWithBiometric,
    lockApp
  };
};
