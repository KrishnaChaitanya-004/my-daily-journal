import { ArrowLeft, Type, Palette, TextCursor, PaintBucket, Pipette, Download, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings, AppSettings } from '@/hooks/useSettings';
import { useDiaryExportImport } from '@/hooks/useDiaryExportImport';

const fontOptions: { value: AppSettings['fontFamily']; label: string }[] = [
  { value: 'inter', label: 'Inter' },
  { value: 'delius', label: 'Delius' },
  { value: 'georgia', label: 'Georgia' },
  { value: 'courier', label: 'Courier' }
];

const fontSizeOptions: { value: AppSettings['fontSize']; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' }
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

// Custom color picker component
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

const Settings = () => {
  const navigate = useNavigate();
  const { settings, updateSetting } = useSettings();
  const { exportData, triggerImport, handleFileChange, fileInputRef } = useDiaryExportImport();

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
        {/* Theme Color */}
        <section className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-foreground">Theme Color</h2>
              <p className="text-xs text-muted-foreground">Choose your accent color</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
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
            <CustomColorPicker 
              value={settings.themeColor === 'custom' ? (settings.customThemeColor || '#ef4444') : '#888888'} 
              onChange={(color) => {
                updateSetting('customThemeColor', color);
                updateSetting('themeColor', 'custom');
              }} 
            />
          </div>
        </section>

        {/* Background Color */}
        <section className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <PaintBucket className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-foreground">Background Color</h2>
              <p className="text-xs text-muted-foreground">Set your background color</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
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
            <CustomColorPicker 
              value={settings.backgroundColor || '#0a0a0a'} 
              onChange={(color) => updateSetting('backgroundColor', color)} 
            />
          </div>
        </section>

        {/* Font Color */}
        <section className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Type className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-foreground">Font Color</h2>
              <p className="text-xs text-muted-foreground">Set your text color</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
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
            <CustomColorPicker 
              value={settings.fontColor || '#ededed'} 
              onChange={(color) => updateSetting('fontColor', color)} 
            />
          </div>
        </section>

        {/* Font Family */}
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
                    option.value === 'georgia' ? "'Georgia', serif" : "'Courier New', monospace"
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
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
          <div className="flex gap-2">
            {fontSizeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => updateSetting('fontSize', option.value)}
                className={`
                  flex-1 px-4 py-3 rounded-lg border transition-smooth tap-highlight-none
                  ${settings.fontSize === option.value 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border text-foreground hover:border-primary/30'
                  }
                `}
              >
                <span className={`
                  ${option.value === 'small' ? 'text-xs' : ''}
                  ${option.value === 'medium' ? 'text-sm' : ''}
                  ${option.value === 'large' ? 'text-base' : ''}
                `}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Data Management */}
        <section className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-foreground">Data Management</h2>
              <p className="text-xs text-muted-foreground">Import or export your diary data</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportData}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border 
                text-foreground hover:border-primary/30 transition-smooth tap-highlight-none"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Export</span>
            </button>
            <button
              onClick={triggerImport}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border 
                text-foreground hover:border-primary/30 transition-smooth tap-highlight-none"
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm">Import</span>
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
            Export creates a backup zip file. Import restores from a backup.
          </p>
        </section>

        {/* About */}
        <section className="bg-card rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-foreground mb-2">About</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            KC's Dairy helps you capture your daily thoughts, tasks, and moments. 
            Your data is stored locally on your device.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-3">
            Version 1.0.0
          </p>
        </section>
      </div>
    </main>
  );
};

export default Settings;
