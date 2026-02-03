import { useState, useEffect } from 'react';
import { Fingerprint, Lock, Delete } from 'lucide-react';
import appLogo from '@/assets/app-icon.png';

interface LockScreenProps {
  onUnlock: (password: string) => boolean;
  onBiometricUnlock: () => Promise<boolean>;
  biometricEnabled: boolean;
  biometricAvailable: boolean;
}

const LockScreen = ({ 
  onUnlock, 
  onBiometricUnlock, 
  biometricEnabled, 
  biometricAvailable 
}: LockScreenProps) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleNumberPress = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);
      
      // Auto-submit when 4-6 digits entered
      if (newPin.length >= 4) {
        setTimeout(() => {
          const success = onUnlock(newPin);
          if (!success && newPin.length === 6) {
            setError(true);
            setShake(true);
            setTimeout(() => {
              setPin('');
              setShake(false);
            }, 500);
          }
        }, 100);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleBiometric = async () => {
    const success = await onBiometricUnlock();
    if (!success) {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  // Try biometric on mount if enabled
  useEffect(() => {
    if (biometricEnabled && biometricAvailable) {
      handleBiometric();
    }
  }, []);

  const numberPad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [biometricEnabled && biometricAvailable ? 'bio' : '', '0', 'del']
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6">
      {/* Logo and Title */}
      <div className="flex flex-col items-center mb-8">
        <img 
          src={appLogo} 
          alt="KC's Diary" 
          className="w-20 h-20 rounded-full object-cover border-4 border-primary mb-4"
        />
        <h1 className="text-xl text-foreground mb-2">KC's Diary</h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Lock className="w-4 h-4" />
          <span className="text-sm">Enter your PIN</span>
        </div>
      </div>

      {/* PIN Dots */}
      <div className={`flex gap-3 mb-8 ${shake ? 'animate-shake' : ''}`}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
              i < pin.length
                ? error 
                  ? 'bg-destructive border-destructive' 
                  : 'bg-primary border-primary'
                : 'border-muted-foreground'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-destructive text-sm mb-4">Incorrect PIN</p>
      )}

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-4 max-w-xs">
        {numberPad.flat().map((item, index) => {
          if (item === '') {
            return <div key={index} className="w-16 h-16" />;
          }
          
          if (item === 'bio') {
            return (
              <button
                key={index}
                onClick={handleBiometric}
                className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center
                  text-foreground hover:bg-secondary/80 transition-smooth tap-highlight-none
                  active:scale-95"
              >
                <Fingerprint className="w-6 h-6" />
              </button>
            );
          }
          
          if (item === 'del') {
            return (
              <button
                key={index}
                onClick={handleDelete}
                className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center
                  text-foreground hover:bg-secondary/80 transition-smooth tap-highlight-none
                  active:scale-95"
              >
                <Delete className="w-6 h-6" />
              </button>
            );
          }
          
          return (
            <button
              key={index}
              onClick={() => handleNumberPress(item)}
              className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center
                text-2xl font-medium text-foreground hover:bg-secondary/80 transition-smooth 
                tap-highlight-none active:scale-95"
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LockScreen;
