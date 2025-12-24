import { ArrowLeft, Type, Palette, TextCursor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings, AppSettings } from '@/hooks/useSettings';

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

const colorOptions: { value: AppSettings['themeColor']; color: string }[] = [
  { value: 'red', color: 'bg-red-500' },
  { value: 'blue', color: 'bg-blue-500' },
  { value: 'green', color: 'bg-green-500' },
  { value: 'purple', color: 'bg-purple-500' },
  { value: 'orange', color: 'bg-orange-500' },
  { value: 'pink', color: 'bg-pink-500' }
];

const Settings = () => {
  const navigate = useNavigate();
  const { settings, updateSetting } = useSettings();

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
          <div className="flex gap-3">
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

        {/* About */}
        <section className="bg-card rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-foreground mb-2">About</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            My Diary App helps you capture your daily thoughts, tasks, and moments. 
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
