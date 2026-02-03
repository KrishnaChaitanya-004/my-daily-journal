import { useState, useRef } from 'react';
import { ArrowLeft, Type, Palette, TextCursor, Pipette, Download, Upload, Lock, Fingerprint, Trash2, Bell, Clock, Link2, Lightbulb, Smartphone, RefreshCw, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings, AppSettings } from '@/hooks/useSettings';
import { useDiaryExportImport } from '@/hooks/useDiaryExportImport';
import { useAppLock } from '@/hooks/useAppLock';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { toast } from '@/hooks/use-toast';
import { widgetsBridge } from '@/lib/widgetsBridge';
import { PdfExportDialog } from '@/components/PdfExportDialog';
import { Slider } from '@/components/ui/slider';

const fontOptions: { value: AppSettings['fontFamily']; label: string }[] = [
  { value: 'inter', label: 'Inter' },
  { value: 'delius', label: 'Delius' },
  { value: 'georgia', label: 'Georgia' },
  { value: 'courier', label: 'Courier' },
  { value: 'custom', label: 'Custom' }
];

const colorOptions: { value: AppSettings['themeColor']; color: string; hex: string }[] = [
  { value: 'red', color: 'bg-red-500', hex: '#ef4444' },
  { value: 'blue', color: 'bg-blue-500', hex: '#3b82f6' },
  { value: 'green', color: 'bg-green-500', hex: '#22c55e' },
  { value: 'purple', color: 'bg-purple-500', hex: '#a855f7' },
  { value: 'orange', color: 'bg-orange-500', hex: '#f97316' },
  { value: 'pink', color: 'bg-pink-500', hex: '#ec4899' }
];

const backgroundColorOptions = [
  { value: '#0a0a0a', label: 'Black' },
  { value: '#1a1a2e', label: 'Navy' },
  { value: '#16213e', label: 'Dark Blue' },
  { value: '#1a1a1a', label: 'Charcoal' },
  { value: '#2d2d2d', label: 'Gray' },
  { value: '#f5f5f5', label: 'Light Gray' },
  { value: '#ffffff', label: 'White' },
  { value: '#fef3e2', label: 'Cream' }
];

const fontColorOptions = [
  { value: '#ededed', label: 'White' },
  { value: '#a0a0a0', label: 'Gray' },
  { value: '#e0e0e0', label: 'Light Gray' },
  { value: '#1a1a1a', label: 'Black' },
  { value: '#333333', label: 'Dark Gray' },
  { value: '#5c4033', label: 'Brown' },
  { value: '#2c5530', label: 'Forest' },
  { value: '#1e3a5f', label: 'Navy' }
];

// Custom color picker component (circle style for inline use)
const CustomColorPicker = ({ value, onChange }: { value: string; onChange: (color: string) => void }) => (
  <label
    className="w-10 h-10 rounded-full transition-smooth tap-highlight-none border-2 border-dashed border-muted-foreground 
      flex items-center justify-center cursor-pointer hover:border-primary relative"
    title="Custom color"
  >
    <Pipette className="w-4 h-4 text-muted-foreground pointer-events-none z-10" />
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
    />
  </label>
);

// Modern color picker component with gradient preview (for modern Android-style)
const ModernColorPicker = ({ 
  value, 
  onChange, 
  label 
}: { 
  value: string; 
  onChange: (color: string) => void;
  label: string;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border cursor-pointer hover:border-primary/30 transition-smooth w-full text-left"
      >
        <div 
          className="w-10 h-10 rounded-xl border-2 border-white/20 shadow-inner shrink-0"
          style={{ 
            backgroundColor: value,
            boxShadow: `0 0 20px ${value}40`
          }}
        />
        <div className="flex-1 min-w-0">
          <span className="text-sm text-foreground block">{label}</span>
          <span className="text-xs text-muted-foreground block">{value.toUpperCase()}</span>
        </div>
        <Pipette className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        aria-hidden="true"
      />
    </div>
  );
};

// Selection color options for calendar
// 'auto' follows the current Theme Color
const selectionColorOptions: { value: string; label: string; color: string; isAuto?: boolean }[] = [
  { value: 'auto', label: 'Auto', color: '', isAuto: true },
  { value: '#3b82f6', label: 'Blue', color: 'bg-blue-500' },
  { value: '#22c55e', label: 'Green', color: 'bg-green-500' },
  { value: '#a855f7', label: 'Purple', color: 'bg-purple-500' },
  { value: '#f97316', label: 'Orange', color: 'bg-orange-500' },
  { value: '#ec4899', label: 'Pink', color: 'bg-pink-500' },
  { value: '#14b8a6', label: 'Teal', color: 'bg-teal-500' },
  { value: '#eab308', label: 'Yellow', color: 'bg-yellow-500' },
  { value: '#ef4444', label: 'Red', color: 'bg-red-500' },
];

// Font size mapping for slider
const fontSizeMap: { value: number; size: AppSettings['fontSize']; label: string; px: string }[] = [
  { value: 12, size: 'small', label: '12', px: '12px' },
  { value: 14, size: 'small', label: '14', px: '14px' },
  { value: 16, size: 'medium', label: '16', px: '16px' },
  { value: 18, size: 'large', label: '18', px: '18px' },
  { value: 20, size: 'large', label: '20', px: '20px' },
  { value: 22, size: 'large', label: '22', px: '22px' },
];

const Settings = () => {
  const navigate = useNavigate();
  const { settings, updateSetting } = useSettings();
  const { exportData, triggerImport, handleFileChange, fileInputRef } = useDiaryExportImport();
 const { lockSettings, setPassword, removePassword, toggleBiometric,enableBiometricWithVerification, } = useAppLock();

  const { 
    settings: notificationSettings, 
    permissionGranted, 
    exactAlarmGranted,
    updateSettings: updateNotificationSettings, 
    enableNotifications, 
    disableNotifications,
    requestExactAlarm
  } = useNotificationSettings();
  
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [customFontUrlInput, setCustomFontUrlInput] = useState(settings.customFontUrl || '');
  const [customFontNameInput, setCustomFontNameInput] = useState(settings.customFontName || '');
  const [colorsExpanded, setColorsExpanded] = useState(true);
  
  // Get current font size value for slider
  const currentFontSizeValue = settings.fontSize === 'small' ? 14 : settings.fontSize === 'medium' ? 16 : 18;

  const handleSetPin = () => {
    if (newPin.length < 4 || newPin.length > 6) {
      setPinError('PIN must be 4-6 digits');
      return;
    }
    if (!/^\d+$/.test(newPin)) {
      setPinError('PIN must contain only numbers');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }
    
    const success = setPassword(newPin);
    if (success) {
      setShowPinSetup(false);
      setNewPin('');
      setConfirmPin('');
      setPinError('');
      toast({
        title: 'App Lock Enabled',
        description: 'Your diary is now protected with a PIN.',
      });
    }
  };

  const handleRemoveLock = () => {
    removePassword();
    toast({
      title: 'App Lock Disabled',
      description: 'Your diary is no longer protected.',
    });
  };

  const handleToggleNotifications = async () => {
    if (notificationSettings.enabled) {
      disableNotifications();
      toast({
        title: 'Notifications Disabled',
        description: 'Daily reminders turned off.',
      });
    } else {
      const granted = await enableNotifications();
      if (granted) {
        toast({
          title: 'Notifications Enabled',
          description: `Daily reminder set for ${notificationSettings.time}`,
        });
      } else {
        toast({
          title: 'Permission Denied',
          description: 'Please enable notifications in your browser settings.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <main className="h-screen bg-background flex flex-col max-w-md mx-auto overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 p-4 border-b border-border shrink-0">
        <button
          onClick={() => navigate('/')}
          className="p-2 text-muted-foreground hover:text-foreground transition-smooth tap-highlight-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-medium text-foreground">Settings</h1>
      </header>

      {/* Settings content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Colors Section */}
        <section className="bg-card rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setColorsExpanded(!colorsExpanded)}
            className="w-full flex items-center justify-between p-4 tap-highlight-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <h2 className="text-sm font-medium text-foreground">Colors</h2>
                <p className="text-xs text-muted-foreground">Theme, background, font & widget colors</p>
              </div>
            </div>
            {colorsExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          
          <div className={`grid transition-all duration-300 ease-in-out ${colorsExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="min-h-0 overflow-hidden">
              <div className="px-4 pb-4 space-y-6">
                {/* Theme Color */}
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-3">Theme Color</h3>
                  <div className="flex flex-wrap gap-3 mb-3">
                    {colorOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateSetting('themeColor', option.value)}
                        className={`
                          w-10 h-10 rounded-full ${option.color} transition-smooth tap-highlight-none
                          ${settings.themeColor === option.value 
                            ? 'ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110' 
                            : 'hover:scale-105'
                          }
                        `}
                      />
                    ))}
                  </div>
                  <ModernColorPicker 
                    value={settings.themeColor === 'custom' ? (settings.customThemeColor || '#ef4444') : '#888888'} 
                    onChange={(color) => {
                      updateSetting('customThemeColor', color);
                      updateSetting('themeColor', 'custom');
                    }}
                    label="Custom Theme Color"
                  />
                </div>

                {/* Background Color */}
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-3">Background Color</h3>
                  <div className="flex flex-wrap gap-3 mb-3">
                    {backgroundColorOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateSetting('backgroundColor', option.value)}
                        title={option.label}
                        className={`
                          w-10 h-10 rounded-full transition-smooth tap-highlight-none border border-border
                          ${settings.backgroundColor === option.value 
                            ? 'ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110' 
                            : 'hover:scale-105'
                          }
                        `}
                        style={{ backgroundColor: option.value }}
                      />
                    ))}
                  </div>
                  <ModernColorPicker 
                    value={settings.backgroundColor || '#0a0a0a'} 
                    onChange={(color) => updateSetting('backgroundColor', color)}
                    label="Custom Background Color"
                  />
                </div>

                {/* Font Color */}
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-3">Font Color</h3>
                  <div className="flex flex-wrap gap-3 mb-3">
                    {fontColorOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateSetting('fontColor', option.value)}
                        title={option.label}
                        className={`
                          w-10 h-10 rounded-full transition-smooth tap-highlight-none border border-border
                          ${settings.fontColor === option.value 
                            ? 'ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110' 
                            : 'hover:scale-105'
                          }
                        `}
                        style={{ backgroundColor: option.value }}
                      />
                    ))}
                  </div>
                  <ModernColorPicker 
                    value={settings.fontColor || '#ededed'} 
                    onChange={(color) => updateSetting('fontColor', color)}
                    label="Custom Font Color"
                  />
                </div>

                {/* Calendar Selection Color */}
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-3">Calendar Selection</h3>
                  <div className="flex flex-wrap gap-3 mb-3">
                    {selectionColorOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateSetting('calendarSelectionColor', option.value)}
                        title={option.label}
                        className={`
                          w-10 h-10 rounded-full transition-smooth tap-highlight-none border-2
                          ${(settings.calendarSelectionColor || 'auto') === option.value 
                            ? 'ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110' 
                            : 'hover:scale-105'
                          }
                          ${option.isAuto 
                            ? 'border-dashed border-muted-foreground bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center' 
                            : `border-transparent ${option.color}`
                          }
                        `}
                      >
                        {option.isAuto && <span className="text-[10px] font-bold text-primary-foreground">A</span>}
                      </button>
                    ))}
                  </div>
                  {settings.calendarSelectionColor !== 'auto' && (
                    <ModernColorPicker 
                      value={settings.calendarSelectionColor || '#3b82f6'} 
                      onChange={(color) => updateSetting('calendarSelectionColor', color)}
                      label="Custom Selection Color"
                    />
                  )}
                </div>

                {/* Widget Theme Color */}
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-3">Widget Theme</h3>
                  <div className="flex flex-wrap gap-3 mb-3">
                    {[
                      { value: '#7C3AED', label: 'Purple' },
                      { value: '#3b82f6', label: 'Blue' },
                      { value: '#22c55e', label: 'Green' },
                      { value: '#ef4444', label: 'Red' },
                      { value: '#f97316', label: 'Orange' },
                      { value: '#ec4899', label: 'Pink' },
                      { value: '#14b8a6', label: 'Teal' },
                      { value: '#eab308', label: 'Yellow' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateSetting('widgetThemeColor', option.value)}
                        title={option.label}
                        className={`
                          w-10 h-10 rounded-full transition-smooth tap-highlight-none border-2
                          ${settings.widgetThemeColor === option.value 
                            ? 'ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110' 
                            : 'hover:scale-105'
                          }
                          border-transparent
                        `}
                        style={{ backgroundColor: option.value }}
                      />
                    ))}
                  </div>
                  <ModernColorPicker 
                    value={settings.widgetThemeColor || '#7C3AED'} 
                    onChange={(color) => updateSetting('widgetThemeColor', color)}
                    label="Custom Widget Color"
                  />
                  <button
                    onClick={async () => {
                      await widgetsBridge.refresh();
                      toast({
                        title: 'Widgets Refreshed',
                        description: 'All Android widgets have been updated.',
                      });
                    }}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-smooth tap-highlight-none"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="text-sm font-medium">Refresh All Widgets</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Type className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-foreground">Font Style</h2>
              <p className="text-xs text-muted-foreground">Select your preferred font</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {fontOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => updateSetting('fontFamily', option.value)}
                className={`
                  px-4 py-3 rounded-lg border transition-smooth tap-highlight-none text-sm
                  ${settings.fontFamily === option.value 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border text-foreground hover:border-primary/30'
                  }
                `}
                style={{
                  fontFamily: option.value === 'inter' ? "'Inter', sans-serif" :
                    option.value === 'delius' ? "'Delius', cursive" :
                    option.value === 'georgia' ? "'Georgia', serif" :
                    option.value === 'courier' ? "'Courier New', monospace" :
                    settings.customFontName ? `'${settings.customFontName}', sans-serif` : "'Inter', sans-serif"
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          {/* Custom Font Import */}
          {settings.fontFamily === 'custom' && (
            <div className="mt-4 space-y-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Import Custom Font</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Paste a <strong>Google Fonts URL</strong>
              </p>
              <input
                type="url"
                value={customFontUrlInput}
                onChange={(e) => setCustomFontUrlInput(e.target.value)}
                placeholder="https://fonts.googleapis.com/css2?family=Roboto"
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground 
                  placeholder:text-muted-foreground text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Font Family Name <strong>(exact name from URL, replace + with space)</strong>
                </label>
                <input
                  type="text"
                  value={customFontNameInput}
                  onChange={(e) => setCustomFontNameInput(e.target.value)}
                  placeholder="Rubik Gemstones"
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground 
                    placeholder:text-muted-foreground text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="p-3 rounded-lg bg-secondary/50 text-xs text-muted-foreground space-y-1">
                <p><strong>Example:</strong></p>
                <p>URL: https://fonts.googleapis.com/css2?family=<strong>Rubik+Gemstones</strong>&display=swap</p>
                <p>Font Name: <strong>Rubik Gemstones</strong> (replace + with space)</p>
              </div>
              <button
                onClick={() => {
                  if (customFontUrlInput && customFontNameInput) {
                    updateSetting('customFontUrl', customFontUrlInput);
                    updateSetting('customFontName', customFontNameInput);
                    toast({
                      title: 'Custom Font Applied',
                      description: `Font "${customFontNameInput}" is loading...`,
                    });
                  } else {
                    toast({
                      title: 'Missing Info',
                      description: 'Please enter both URL and font name.',
                      variant: 'destructive',
                    });
                  }
                }}
                className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm
                  hover:bg-primary/90 transition-smooth"
              >
                Apply Font
              </button>
            </div>
          )}
        </section>

        {/* Font Size */}
        <section className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TextCursor className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-foreground">Font Size</h2>
              <p className="text-xs text-muted-foreground">Adjust text size</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">A</span>
              <span className="text-lg font-medium text-primary">{currentFontSizeValue}px</span>
              <span className="text-lg text-muted-foreground">A</span>
            </div>
            <Slider
              value={[currentFontSizeValue]}
              min={12}
              max={22}
              step={2}
              onValueChange={(value) => {
                const size = value[0];
                const fontSize: AppSettings['fontSize'] = size <= 14 ? 'small' : size <= 16 ? 'medium' : 'large';
                updateSetting('fontSize', fontSize);
                // Apply custom px value directly
                document.documentElement.style.fontSize = `${size}px`;
              }}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>12</span>
              <span>14</span>
              <span>16</span>
              <span>18</span>
              <span>20</span>
              <span>22</span>
            </div>
          </div>
        </section>

        {/* App Lock */}
        <section className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-foreground">App Lock</h2>
              <p className="text-xs text-muted-foreground">Protect your diary with PIN</p>
            </div>
          </div>
          
          {lockSettings.isEnabled ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">PIN Lock Enabled</span>
                </div>
                <button
                  onClick={handleRemoveLock}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-smooth"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <button
                 onClick={async () => {
                      if (lockSettings.useBiometric) {
                        // Turning OFF → no auth needed
                        toggleBiometric(false);
                      } else {
                        // Turning ON → require fingerprint
                        const ok = await enableBiometricWithVerification();
                        if (!ok) {
                          toast({
                            title: 'Fingerprint failed',
                            description: 'Biometric authentication was cancelled or failed',
                            variant: 'destructive',
                          });
                        }
                      }
                    }}

                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-smooth
                    ${lockSettings.useBiometric 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/30'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-4 h-4" />
                    <span className="text-sm text-foreground">Fingerprint Unlock</span>
                  </div>

                  <div className={`w-10 h-6 rounded-full ${
                    lockSettings.useBiometric ? 'bg-primary' : 'bg-muted'
                  }`}>
                    <div
                      className="w-5 h-5 bg-white rounded-full mt-0.5 transition-all"
                      style={{ marginLeft: lockSettings.useBiometric ? '18px' : '2px' }}
                    />
                  </div>
              </button>

            </div>
          ) : showPinSetup ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Enter PIN (4-6 digits)</label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => {
                    setNewPin(e.target.value.replace(/\D/g, ''));
                    setPinError('');
                  }}
                  placeholder="Enter PIN"
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground 
                    placeholder:text-muted-foreground text-center text-lg tracking-widest
                    focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Confirm PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => {
                    setConfirmPin(e.target.value.replace(/\D/g, ''));
                    setPinError('');
                  }}
                  placeholder="Confirm PIN"
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground 
                    placeholder:text-muted-foreground text-center text-lg tracking-widest
                    focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              {pinError && (
                <p className="text-xs text-destructive">{pinError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowPinSetup(false);
                    setNewPin('');
                    setConfirmPin('');
                    setPinError('');
                  }}
                  className="flex-1 px-4 py-3 rounded-lg border border-border text-foreground 
                    hover:bg-secondary transition-smooth"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetPin}
                  className="flex-1 px-4 py-3 rounded-lg bg-primary text-primary-foreground 
                    hover:bg-primary/90 transition-smooth"
                >
                  Set PIN
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowPinSetup(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border 
                text-foreground hover:border-primary/30 transition-smooth tap-highlight-none"
            >
              <Lock className="w-4 h-4" />
              <span className="text-sm">Set PIN Lock</span>
            </button>
          )}
        </section>

        {/* Daily Reminder */}
        <section className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-foreground">Daily Reminder</h2>
              <p className="text-xs text-muted-foreground">Get reminded to write in your diary</p>
            </div>
          </div>
          
          {/* Toggle */}
          <button
            onClick={handleToggleNotifications}
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-smooth mb-3
              ${notificationSettings.enabled 
                ? 'border-primary bg-primary/10' 
                : 'border-border hover:border-primary/30'
              }`}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="text-sm text-foreground">Enable Notifications</span>
            </div>
            <div className={`w-10 h-6 rounded-full transition-all ${
              notificationSettings.enabled ? 'bg-primary' : 'bg-muted'
            }`}>
              <div className={`w-5 h-5 rounded-full bg-white mt-0.5 transition-all`} 
                style={{ marginLeft: notificationSettings.enabled ? '18px' : '2px' }} />
            </div>
          </button>
          
          {notificationSettings.enabled && (
            <div className="space-y-3">
              {/* Exact alarm warning for Android 12+ */}
              {!exactAlarmGranted && (
                <button
                  onClick={requestExactAlarm}
                  className="w-full p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-left"
                >
                  <p className="text-xs text-orange-400 font-medium">Exact alarms not allowed</p>
                  <p className="text-[10px] text-orange-400/80 mt-1">
                    Tap to allow exact alarms for reliable notifications even in battery saver mode.
                  </p>
                </button>
              )}

              {/* Time Picker */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Reminder Time
                </label>
                <input
                  type="time"
                  value={notificationSettings.time}
                  onChange={(e) => updateNotificationSettings({ time: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground 
                    focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              
              {/* Message */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Reminder Message
                </label>
                <input
                  type="text"
                  value={notificationSettings.message}
                  onChange={(e) => updateNotificationSettings({ message: e.target.value })}
                  placeholder="Boss! It's diary time."
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground 
                    placeholder:text-muted-foreground
                    focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Battery optimization tip */}
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                If notifications don't appear, check your device's battery optimization settings and allow 
                Maggie to run in the background.
              </p>
            </div>
          )}
        </section>

        {/* Writing Prompts */}
        <section className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-foreground">Writing Prompts</h2>
              <p className="text-xs text-muted-foreground">Show daily writing inspiration</p>
            </div>
          </div>
          
          <button
            onClick={() => updateSetting('showWritingPrompts', !settings.showWritingPrompts)}
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-smooth
              ${settings.showWritingPrompts 
                ? 'border-primary bg-primary/10' 
                : 'border-border hover:border-primary/30'
              }`}
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              <span className="text-sm text-foreground">Show Writing Prompts</span>
            </div>
            <div className={`w-10 h-6 rounded-full transition-all ${
              settings.showWritingPrompts ? 'bg-primary' : 'bg-muted'
            }`}>
              <div className={`w-5 h-5 rounded-full bg-white mt-0.5 transition-all`} 
                style={{ marginLeft: settings.showWritingPrompts ? '18px' : '2px' }} />
            </div>
          </button>
        </section>

        {/* Data Management */}
        <section className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-foreground">Data Management</h2>
              <p className="text-xs text-muted-foreground">Import, export, or create PDF books</p>
            </div>
          </div>
          
          {/* PDF Export Button */}
          <PdfExportDialog
            trigger={
              <button
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary/10 border border-primary/30 
                  text-primary hover:bg-primary/20 transition-smooth tap-highlight-none mb-3"
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Export as PDF Book</span>
              </button>
            }
          />
          
          <div className="flex gap-3">
            <button
              onClick={exportData}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border 
                text-foreground hover:border-primary/30 transition-smooth tap-highlight-none"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Backup</span>
            </button>
            <button
              onClick={triggerImport}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border 
                text-foreground hover:border-primary/30 transition-smooth tap-highlight-none"
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm">Restore</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Backup creates a zip file. Restore imports from a backup. PDF creates a printable book.
          </p>
        </section>

        {/* About */}
        <section className="bg-card rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-foreground mb-2">About</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Maggie helps you capture your daily thoughts, tasks, and moments.
            Your data is stored locally on your device.
          </p>
          <div className="flex items-center gap-4 mt-3">
            <a 
              href="/privacy-policy.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              Privacy Policy
            </a>
            <span className="text-xs text-muted-foreground/60">
              Version 1.0.0
            </span>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Settings;
