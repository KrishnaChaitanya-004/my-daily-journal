import { useState, useCallback, useEffect } from 'react';

export interface AppSettings {
  fontFamily: 'inter' | 'delius' | 'georgia' | 'courier';
  fontSize: 'small' | 'medium' | 'large';
  themeColor: 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'custom';
  customThemeColor: string;
  backgroundColor: string;
  fontColor: string;
}

const SETTINGS_KEY = 'diary-settings';

const defaultSettings: AppSettings = {
  fontFamily: 'inter',
  fontSize: 'medium',
  themeColor: 'red',
  customThemeColor: '#ef4444',
  backgroundColor: '#0a0a0a',
  fontColor: '#ededed'
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

// Convert hex to HSL string for CSS variables
const hexToHsl = (hex: string | undefined): string => {
  // Fallback for undefined or invalid hex
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || hex.length < 7) {
    return '0 0% 50%'; // Default gray
  }
  
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
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
    let primaryHsl: string;
    
    if (settings.themeColor === 'custom' && settings.customThemeColor) {
      primaryHsl = hexToHsl(settings.customThemeColor);
    } else {
      const colors = themeColors[settings.themeColor] || themeColors.red;
      primaryHsl = colors.primary;
    }
    
    root.style.setProperty('--primary', primaryHsl);
    root.style.setProperty('--ring', primaryHsl);
    root.style.setProperty('--today', primaryHsl);
    root.style.setProperty('--has-content', primaryHsl);
    
    // Apply background color
    const bgColor = settings.backgroundColor || defaultSettings.backgroundColor;
    root.style.setProperty('--background', hexToHsl(bgColor));
    
    // Apply font color
    const fgColor = settings.fontColor || defaultSettings.fontColor;
    root.style.setProperty('--foreground', hexToHsl(fgColor));
    
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
