import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Capacitor } from '@capacitor/core';

const FOCUS_TIME = 25 * 60; // 25 minutes
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;

type SessionType = 'focus' | 'shortBreak' | 'longBreak';

const sessionConfig: Record<SessionType, { label: string; duration: number; icon: typeof Brain }> = {
  focus: { label: 'Focus', duration: FOCUS_TIME, icon: Brain },
  shortBreak: { label: 'Short Break', duration: SHORT_BREAK, icon: Coffee },
  longBreak: { label: 'Long Break', duration: LONG_BREAK, icon: Coffee },
};

// SVG Plant that grows through 6 stages based on progress (0-1)
const GrowingPlant = ({ progress, isRunning }: { progress: number; isRunning: boolean }) => {
  // 6 stages: seed, sprout, small stem, leaves, bud, flower
  const stage = Math.min(5, Math.floor(progress * 6));

  return (
    <svg viewBox="0 0 200 300" className="w-48 h-64 mx-auto" style={{ filter: 'drop-shadow(0 4px 12px hsl(var(--primary) / 0.15))' }}>
      {/* Pot */}
      <path d="M70 230 L80 270 L120 270 L130 230 Z" fill="hsl(var(--primary) / 0.7)" stroke="hsl(var(--primary))" strokeWidth="2" />
      <ellipse cx="100" cy="230" rx="32" ry="6" fill="hsl(var(--primary) / 0.85)" stroke="hsl(var(--primary))" strokeWidth="2" />
      {/* Soil */}
      <ellipse cx="100" cy="232" rx="28" ry="4" fill="hsl(var(--foreground) / 0.3)" />

      {/* Stage 0: Seed bump */}
      {stage >= 0 && (
        <g className="animate-fade-in">
          <ellipse cx="100" cy="228" rx="5" ry="3" fill="hsl(var(--foreground) / 0.4)" />
        </g>
      )}

      {/* Stage 1: Tiny sprout */}
      {stage >= 1 && (
        <g className="animate-fade-in">
          <line x1="100" y1="228" x2="100" y2="215" stroke="hsl(142 71% 45%)" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="96" cy="213" rx="5" ry="3" fill="hsl(142 71% 45%)" transform="rotate(-30 96 213)" />
          <ellipse cx="104" cy="213" rx="5" ry="3" fill="hsl(142 71% 45%)" transform="rotate(30 104 213)" />
        </g>
      )}

      {/* Stage 2: Taller stem */}
      {stage >= 2 && (
        <g className="animate-fade-in">
          <line x1="100" y1="228" x2="100" y2="190" stroke="hsl(142 71% 40%)" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M100 205 Q85 200 82 210" stroke="hsl(142 71% 45%)" strokeWidth="2" fill="hsl(142 71% 45% / 0.6)" />
        </g>
      )}

      {/* Stage 3: Leaves */}
      {stage >= 3 && (
        <g className="animate-fade-in">
          <line x1="100" y1="228" x2="100" y2="170" stroke="hsl(142 71% 38%)" strokeWidth="4" strokeLinecap="round" />
          <path d="M100 195 Q80 185 78 200" stroke="hsl(142 71% 45%)" strokeWidth="2" fill="hsl(142 71% 50% / 0.7)" />
          <path d="M100 185 Q120 175 122 190" stroke="hsl(142 71% 45%)" strokeWidth="2" fill="hsl(142 71% 50% / 0.7)" />
          <path d="M100 175 Q82 168 80 180" stroke="hsl(142 71% 45%)" strokeWidth="2" fill="hsl(142 71% 48% / 0.7)" />
        </g>
      )}

      {/* Stage 4: Bud */}
      {stage >= 4 && (
        <g className="animate-fade-in">
          <line x1="100" y1="228" x2="100" y2="155" stroke="hsl(142 71% 35%)" strokeWidth="4" strokeLinecap="round" />
          <path d="M100 195 Q78 185 76 200" stroke="hsl(142 71% 42%)" strokeWidth="2" fill="hsl(142 71% 50% / 0.7)" />
          <path d="M100 183 Q122 173 124 188" stroke="hsl(142 71% 42%)" strokeWidth="2" fill="hsl(142 71% 50% / 0.7)" />
          <path d="M100 172 Q80 165 78 177" stroke="hsl(142 71% 42%)" strokeWidth="2" fill="hsl(142 71% 48% / 0.7)" />
          <path d="M100 163 Q118 156 120 168" stroke="hsl(142 71% 42%)" strokeWidth="2" fill="hsl(142 71% 48% / 0.7)" />
          {/* Bud */}
          <ellipse cx="100" cy="150" rx="8" ry="10" fill="hsl(var(--primary) / 0.5)" stroke="hsl(var(--primary) / 0.7)" strokeWidth="1.5" />
        </g>
      )}

      {/* Stage 5: Full flower */}
      {stage >= 5 && (
        <g className="animate-scale-in">
          <line x1="100" y1="228" x2="100" y2="145" stroke="hsl(142 71% 33%)" strokeWidth="4.5" strokeLinecap="round" />
          {/* Flower petals */}
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <ellipse
              key={angle}
              cx="100"
              cy="130"
              rx="6"
              ry="14"
              fill="hsl(var(--primary) / 0.7)"
              stroke="hsl(var(--primary))"
              strokeWidth="1"
              transform={`rotate(${angle} 100 140)`}
            />
          ))}
          {/* Center */}
          <circle cx="100" cy="140" r="7" fill="hsl(45 93% 58%)" stroke="hsl(45 93% 48%)" strokeWidth="1.5" />

          {/* Sparkles when complete */}
          <circle cx="75" cy="125" r="2" fill="hsl(45 93% 58%)" className="animate-pulse" />
          <circle cx="128" cy="132" r="1.5" fill="hsl(45 93% 58%)" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
          <circle cx="85" cy="148" r="1.5" fill="hsl(45 93% 58%)" className="animate-pulse" style={{ animationDelay: '1s' }} />
        </g>
      )}

      {/* Gentle sway animation when running */}
      {isRunning && stage >= 1 && stage < 5 && (
        <style>{`
          @keyframes gentle-sway {
            0%, 100% { transform: rotate(0deg); transform-origin: 100px 228px; }
            50% { transform: rotate(1.5deg); transform-origin: 100px 228px; }
          }
          svg g { animation: gentle-sway 3s ease-in-out infinite; }
        `}</style>
      )}
    </svg>
  );
};

const Pomodoro = () => {
  const navigate = useNavigate();
  const [sessionType, setSessionType] = useState<SessionType>('focus');
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessions] = useState(0);
  const [isVibrating, setIsVibrating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const duration = sessionConfig[sessionType].duration;
  const progress = 1 - timeLeft / duration;

  // Timer tick
  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsRunning(false);
          setIsVibrating(true);
          // Vibrate
          if (Capacitor.isNativePlatform() && navigator.vibrate) {
            navigator.vibrate([500, 200, 500, 200, 500]);
          } else if (navigator.vibrate) {
            navigator.vibrate([500, 200, 500, 200, 500]);
          }
          if (sessionType === 'focus') setSessions((s) => s + 1);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, sessionType]);

  const stopVibration = useCallback(() => {
    setIsVibrating(false);
    if (navigator.vibrate) navigator.vibrate(0);
  }, []);

  const switchSession = useCallback((type: SessionType) => {
    setSessionType(type);
    setTimeLeft(sessionConfig[type].duration);
    setIsRunning(false);
    setIsVibrating(false);
    if (navigator.vibrate) navigator.vibrate(0);
  }, []);

  const reset = useCallback(() => {
    setTimeLeft(duration);
    setIsRunning(false);
    setIsVibrating(false);
    if (navigator.vibrate) navigator.vibrate(0);
  }, [duration]);

  const toggleTimer = useCallback(() => {
    if (isVibrating) { stopVibration(); return; }
    setIsRunning((r) => !r);
  }, [isVibrating, stopVibration]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 p-4 border-b border-border">
        <button onClick={() => navigate('/')} className="p-2 rounded-xl hover:bg-secondary/70 transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Pomodoro Timer</h1>
        <div className="ml-auto text-xs text-muted-foreground">
          🍅 {sessionsCompleted} session{sessionsCompleted !== 1 ? 's' : ''}
        </div>
      </header>

      {/* Session type tabs */}
      <div className="flex gap-2 p-4 justify-center">
        {(Object.keys(sessionConfig) as SessionType[]).map((type) => {
          const cfg = sessionConfig[type];
          const Icon = cfg.icon;
          return (
            <button
              key={type}
              onClick={() => switchSession(type)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                sessionType === type
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              <Icon className="w-4 h-4" />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Plant + Timer area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        {/* Growing plant */}
        <div className={`transition-transform duration-500 ${isVibrating ? 'animate-[shake_0.3s_ease-in-out_infinite]' : ''}`}>
          <GrowingPlant progress={progress} isRunning={isRunning} />
        </div>

        {/* Timer display */}
        <div className="text-center">
          <div className="text-7xl font-mono font-bold text-foreground tracking-tight tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {isVibrating
              ? '🎉 Time\'s up! Tap to dismiss'
              : isRunning
              ? sessionType === 'focus' ? 'Stay focused, your plant is growing…' : 'Take a breather 🌿'
              : 'Press play to start'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={reset} className="rounded-full w-12 h-12">
            <RotateCcw className="w-5 h-5" />
          </Button>
          <button
            onClick={toggleTimer}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
              isVibrating
                ? 'bg-destructive text-destructive-foreground animate-pulse'
                : isRunning
                ? 'bg-primary/80 text-primary-foreground hover:bg-primary/70'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {isVibrating ? (
              <span className="text-2xl">🔔</span>
            ) : isRunning ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </button>
          <div className="w-12 h-12" /> {/* Spacer for balance */}
        </div>

        {/* Session dots */}
        <div className="flex gap-2 mt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i < sessionsCompleted % 4
                  ? 'bg-primary'
                  : 'bg-muted-foreground/20'
              }`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-2">until long break</span>
        </div>
      </div>

      {/* Shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
};

export default Pomodoro;
