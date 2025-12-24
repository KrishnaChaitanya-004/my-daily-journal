import { useState, useCallback, useEffect } from 'react';

export interface AppSettings {
  fontFamily: 'inter' | 'delius' | 'georgia' | 'courier';
  fontSize: 'small' | 'medium' | 'large';
  themeColor: 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'pink';
}

const SETTINGS_KEY = 'diary-settings';

const defaultSettings: AppSettings = {
  fontFamily: 'inter',
  fontSize: 'medium',
  themeColor: 'red'
};

const themeColors: Record<string, { primary: string; ring: string }> = {
  red: { primary: '0 72% 51%', ring: '0 72% 51%' },
  blue: { primary: '217 91% 60%', ring: '217 91% 60%' },
  green: { primary: '142 76% 36%', ring: '142 76% 36%' },
  purple: { primary: '262 83% 58%', ring: '262 83% 58%' },
  orange: { primary: '25 95% 53%', ring: '25 95% 53%' },
  pink: { primary: '330 81% 60%', ring: '330 81% 60%' }
};

const fontFamilies: Record<string, string> = {
  inter: "'Inter', system-ui, sans-serif",
  delius: "'Delius', cursive",
  georgia: "'Georgia', serif",
  courier: "'Courier New', monospace"
};

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    
    // Apply theme color
    const root = document.documentElement;
    const colors = themeColors[settings.themeColor];
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--ring', colors.ring);
    root.style.setProperty('--today', colors.primary);
    root.style.setProperty('--has-content', colors.primary);
    
    // Apply font family
    document.body.style.fontFamily = fontFamilies[settings.fontFamily];
    
    // Apply font size
    const fontSizes = { small: '14px', medium: '16px', large: '18px' };
    document.documentElement.style.fontSize = fontSizes[settings.fontSize];
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  return {
    settings,
    updateSetting
  };
};
