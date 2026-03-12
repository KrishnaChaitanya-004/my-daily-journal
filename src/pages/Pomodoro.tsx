import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DEFAULT_FOCUS_MINUTES = 25;
const FOCUS_TIME = DEFAULT_FOCUS_MINUTES * 60; // 25 minutes
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;

type SessionType = 'focus' | 'shortBreak' | 'longBreak';
type PlantType = 'bloomingPlant' | 'tabebuiaRosea';

const sessionConfig: Record<SessionType, { label: string; duration: number; icon: typeof Brain }> = {
  focus: { label: 'Focus', duration: FOCUS_TIME, icon: Brain },
  shortBreak: { label: 'Short Break', duration: SHORT_BREAK, icon: Coffee },
  longBreak: { label: 'Long Break', duration: LONG_BREAK, icon: Coffee },
};

const plantConfig: Record<PlantType, { label: string; subtitle: string }> = {
  bloomingPlant: { label: 'Blooming Plant', subtitle: 'Lush flowering stem' },
  tabebuiaRosea: { label: 'Tabebuia rosea', subtitle: 'Pink trumpet tree' },
};

const getStageFromProgress = (progress: number) => {
  const safeProgress = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  return Math.min(5, Math.floor(safeProgress * 6));
};

const BloomingPlant = ({ progress, isRunning }: { progress: number; isRunning: boolean }) => {
  const stage = getStageFromProgress(progress);
  const swayStyle =
    isRunning && stage >= 1 && stage < 5
      ? { transformOrigin: '100px 232px', animation: 'gentle-plant-sway 3.2s ease-in-out infinite' as const }
      : { transformOrigin: '100px 232px' as const };

  return (
    <svg viewBox="0 0 200 300" className="w-52 h-72 mx-auto" style={{ filter: 'drop-shadow(0 6px 14px hsl(var(--primary) / 0.15))' }}>
      <path d="M65 232 L75 276 L125 276 L135 232 Z" fill="hsl(26 44% 38%)" stroke="hsl(24 42% 26%)" strokeWidth="2.2" />
      <ellipse cx="100" cy="232" rx="35" ry="7" fill="hsl(28 46% 44%)" stroke="hsl(24 42% 26%)" strokeWidth="2.2" />
      <ellipse cx="100" cy="234" rx="30" ry="5" fill="hsl(28 18% 23%)" />

      {stage >= 0 && (
        <g className="animate-fade-in">
          <ellipse cx="100" cy="230" rx="5" ry="3.2" fill="hsl(26 32% 18%)" />
        </g>
      )}

      <g style={swayStyle}>
        {stage >= 1 && (
          <g className="animate-fade-in">
            <path d="M100 230 C100 224 100 221 100 214" stroke="hsl(142 56% 38%)" strokeWidth="3.2" strokeLinecap="round" />
            <ellipse cx="96" cy="212" rx="5" ry="3" fill="hsl(142 60% 45%)" transform="rotate(-30 96 212)" />
            <ellipse cx="104" cy="212" rx="5" ry="3" fill="hsl(142 60% 45%)" transform="rotate(30 104 212)" />
          </g>
        )}

        {stage >= 2 && (
          <g className="animate-fade-in">
            <path d="M100 230 C100 218 99 205 100 188" stroke="hsl(142 52% 34%)" strokeWidth="4" strokeLinecap="round" />
            <path d="M100 206 C83 196 76 205 79 216 C91 216 97 213 100 206Z" fill="hsl(140 63% 44%)" stroke="hsl(140 55% 34%)" strokeWidth="1.5" />
            <path d="M100 197 C118 188 126 197 124 208 C111 208 104 205 100 197Z" fill="hsl(143 61% 43%)" stroke="hsl(140 55% 34%)" strokeWidth="1.5" />
          </g>
        )}

        {stage >= 3 && (
          <g className="animate-fade-in">
            <path d="M100 230 C99 213 100 189 101 166" stroke="hsl(142 50% 30%)" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M100 186 C80 178 74 189 78 199 C92 200 98 195 100 186Z" fill="hsl(139 60% 44%)" stroke="hsl(139 54% 34%)" strokeWidth="1.5" />
            <path d="M101 176 C120 166 129 176 126 186 C114 187 106 184 101 176Z" fill="hsl(141 58% 43%)" stroke="hsl(139 54% 34%)" strokeWidth="1.5" />
            <path d="M100 170 C84 161 79 170 82 179 C92 180 98 176 100 170Z" fill="hsl(137 58% 42%)" stroke="hsl(139 54% 34%)" strokeWidth="1.5" />
          </g>
        )}

        {stage >= 4 && (
          <g className="animate-fade-in">
            <path d="M101 166 C102 156 102 150 101 146" stroke="hsl(142 50% 30%)" strokeWidth="3.8" strokeLinecap="round" />
            <ellipse cx="101" cy="140" rx="10" ry="13" fill="hsl(332 55% 71%)" stroke="hsl(332 45% 57%)" strokeWidth="1.8" />
            <path d="M101 150 L94 144 L101 138 L108 144 Z" fill="hsl(337 42% 58%)" />
          </g>
        )}

        {stage >= 5 && (
          <g className="animate-scale-in">
            <path d="M101 165 C102 154 102 146 101 136" stroke="hsl(142 50% 30%)" strokeWidth="3.8" strokeLinecap="round" />

            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <ellipse
                key={`outer-${angle}`}
                cx="101"
                cy="132"
                rx="7"
                ry="18"
                fill="hsl(332 70% 74%)"
                stroke="hsl(332 55% 62%)"
                strokeWidth="1.2"
                transform={`rotate(${angle} 101 143)`}
              />
            ))}
            {[22, 67, 112, 157, 202, 247, 292, 337].map((angle) => (
              <ellipse
                key={`inner-${angle}`}
                cx="101"
                cy="134"
                rx="5.2"
                ry="13"
                fill="hsl(336 74% 82%)"
                stroke="hsl(336 56% 68%)"
                strokeWidth="1"
                transform={`rotate(${angle} 101 143)`}
              />
            ))}
            <circle cx="101" cy="143" r="7.5" fill="hsl(44 98% 60%)" stroke="hsl(38 88% 47%)" strokeWidth="1.5" />
            <circle cx="84" cy="126" r="2.1" fill="hsl(44 98% 60%)" className="animate-pulse" />
            <circle cx="122" cy="126" r="1.7" fill="hsl(44 98% 60%)" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
            <circle cx="90" cy="154" r="1.6" fill="hsl(44 98% 60%)" className="animate-pulse" style={{ animationDelay: '0.95s' }} />
          </g>
        )}
      </g>
    </svg>
  );
};

const TabebuiaRoseaTree = ({ progress, isRunning }: { progress: number; isRunning: boolean }) => {
  const stage = getStageFromProgress(progress);
  const swayStyle =
    isRunning && stage >= 1 && stage < 5
      ? { transformOrigin: '120px 238px', animation: 'gentle-tree-sway 3.8s ease-in-out infinite' as const }
      : { transformOrigin: '120px 238px' as const };
  const earlyBlossoms = [
    { x:102, y:167, r:4.6 },
    { x:119, y:156, r:5.2 },
    { x:136, y:168, r:4.8 },
    { x:95, y:178, r:4.2 },
    { x:145, y:179, r:4.2 },
    { x:120, y:176, r:4.9 },
  ];
  const fullBlossoms = [
    { x:87, y:161, r:5.8 },
    { x:96, y:151, r:6.1 },
    { x:106, y:145, r:5.7 },
    { x:117, y:142, r:6.3 },
    { x:129, y:145, r:5.9 },
    { x:141, y:151, r:6.2 },
    { x:151, y:161, r:5.8 },
    { x:92, y:173, r:5.4 },
    { x:104, y:180, r:5.6 },
    { x:118, y:183, r:5.9 },
    { x:132, y:180, r:5.6 },
    { x:144, y:173, r:5.4 },
    { x:120, y:167, r:6.6 },
  ];
  const fallingPetals = [
    { d: 'M103 198 C100 202 101 206 104 208 C107 205 107 201 103 198Z', delay: '0s' },
    { d: 'M138 201 C135 205 136 209 139 211 C142 208 142 204 138 201Z', delay: '0.65s' },
    { d: 'M120 209 C117 213 118 216 121 218 C124 215 124 212 120 209Z', delay: '1s' },
  ];

  return (
    <svg
      viewBox="0 0 240 320"
      className="w-56 h-72 mx-auto"
      style={{ filter: 'drop-shadow(0 8px 18px hsl(var(--primary) / 0.16))' }}
    >
      <defs>
        <linearGradient id="tabPotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(30 42% 44%)" />
          <stop offset="55%" stopColor="hsl(28 36% 35%)" />
          <stop offset="100%" stopColor="hsl(26 33% 27%)" />
        </linearGradient>
        <linearGradient id="tabTrunkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(24 30% 40%)" />
          <stop offset="50%" stopColor="hsl(24 30% 31%)" />
          <stop offset="100%" stopColor="hsl(23 30% 23%)" />
        </linearGradient>
        <radialGradient id="tabCanopyGradient" cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor="hsl(143 40% 56%)" />
          <stop offset="60%" stopColor="hsl(139 37% 46%)" />
          <stop offset="100%" stopColor="hsl(136 35% 34%)" />
        </radialGradient>
        <radialGradient id="tabBlossomGradient" cx="42%" cy="36%" r="66%">
          <stop offset="0%" stopColor="hsl(340 84% 88%)" />
          <stop offset="68%" stopColor="hsl(334 72% 76%)" />
          <stop offset="100%" stopColor="hsl(330 60% 66%)" />
        </radialGradient>
      </defs>

      <path d="M72 238 L84 288 L156 288 L168 238 Z" fill="url(#tabPotGradient)" stroke="hsl(28 40% 24%)" strokeWidth="2.4" />
      <ellipse cx="120" cy="238" rx="49" ry="8" fill="hsl(31 43% 46%)" stroke="hsl(28 40% 24%)" strokeWidth="2.4" />
      <ellipse cx="120" cy="240" rx="43" ry="6" fill="hsl(28 21% 19%)" />
      <ellipse cx="120" cy="236.8" rx="27" ry="3.5" fill="hsl(30 20% 28% / 0.45)" />

      {stage >= 0 && (
        <g className="animate-fade-in">
          <ellipse cx="120" cy="235.7" rx="5.7" ry="3.3" fill="hsl(28 30% 17%)" />
          <ellipse cx="120" cy="234.5" rx="2.2" ry="1.1" fill="hsl(30 42% 33%)" />
        </g>
      )}

      <g style={swayStyle}>
        {stage >= 1 && (
          <g className="animate-fade-in">
            <path d="M120 235 C120 230 120 224 120 215" stroke="url(#tabTrunkGradient)" strokeWidth="4.7" strokeLinecap="round" />
            <path d="M120 220 C112 216 108 211 106 205 C113 205 118 208 120 213Z" fill="hsl(138 56% 45%)" />
            <path d="M120 220 C128 216 132 211 134 205 C127 205 122 208 120 213Z" fill="hsl(138 56% 45%)" />
            <path d="M120 219 C111 217 108 213 107 209" stroke="hsl(136 45% 34% / 0.6)" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M120 219 C129 217 132 213 133 209" stroke="hsl(136 45% 34% / 0.6)" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        )}

        {stage >= 2 && (
          <g className="animate-fade-in">
            <path d="M120 236 C120 222 120 207 120 189" stroke="url(#tabTrunkGradient)" strokeWidth="6.8" strokeLinecap="round" />
            <path d="M120 206 C111 201 104 194 99 186" stroke="hsl(24 32% 30%)" strokeWidth="3.6" strokeLinecap="round" />
            <path d="M120 199 C130 194 137 186 142 177" stroke="hsl(24 32% 30%)" strokeWidth="3.6" strokeLinecap="round" />
            <ellipse cx="97" cy="184" rx="6.4" ry="4.2" fill="hsl(136 49% 42%)" transform="rotate(-24 97 184)" />
            <ellipse cx="144" cy="176" rx="6.2" ry="4.1" fill="hsl(136 49% 42%)" transform="rotate(29 144 176)" />
            <ellipse cx="120" cy="188" rx="7.3" ry="5.1" fill="hsl(136 42% 45% / 0.9)" />
          </g>
        )}

        {stage >= 3 && (
          <g className="animate-fade-in">
            <path d="M120 188 C118 175 119 164 121 149" stroke="url(#tabTrunkGradient)" strokeWidth="7" strokeLinecap="round" />
            <path d="M120 183 C111 171 103 164 94 154" stroke="hsl(23 31% 29%)" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M121 180 C131 169 140 162 151 151" stroke="hsl(23 31% 29%)" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M121 171 C119 161 119 153 121 145" stroke="hsl(23 31% 29%)" strokeWidth="2.9" strokeLinecap="round" />

            <circle cx="104" cy="163" r="16" fill="url(#tabCanopyGradient)" />
            <circle cx="121" cy="154" r="17" fill="url(#tabCanopyGradient)" />
            <circle cx="138" cy="164" r="15.2" fill="url(#tabCanopyGradient)" />
            <circle cx="94" cy="176" r="11.8" fill="hsl(136 34% 40% / 0.94)" />
            <circle cx="149" cy="176" r="12.6" fill="hsl(136 34% 40% / 0.94)" />
            <circle cx="121" cy="174" r="15.8" fill="hsl(136 35% 41% / 0.95)" />
            <ellipse cx="121" cy="181" rx="26" ry="8" fill="hsl(136 31% 31% / 0.22)" />
          </g>
        )}

        {stage >= 4 && (
          <g className="animate-fade-in">
            {earlyBlossoms.map((b) => (
              <circle key={`early-${b.x}-${b.y}`} cx={b.x} cy={b.y} r={b.r} fill="url(#tabBlossomGradient)" />
            ))}
            {earlyBlossoms.map((b) => (
              <circle
                key={`early-core-${b.x}-${b.y}`}
                cx={b.x + 0.4}
                cy={b.y - 0.3}
                r={Math.max(1.2, b.r * 0.25)}
                fill="hsl(40 86% 67%)"
                opacity="0.8"
              />
            ))}
          </g>
        )}

        {stage >= 5 && (
          <g className="animate-scale-in">
            {fullBlossoms.map((b) => (
              <circle key={`full-${b.x}-${b.y}`} cx={b.x} cy={b.y} r={b.r} fill="url(#tabBlossomGradient)" />
            ))}
            {fullBlossoms.map((b, i) => (
              <circle
                key={`full-core-${b.x}-${b.y}`}
                cx={b.x + (i % 2 === 0 ? 0.3 : -0.3)}
                cy={b.y - 0.4}
                r={Math.max(1.25, b.r * 0.24)}
                fill="hsl(43 90% 69%)"
                opacity="0.85"
              />
            ))}

            {fallingPetals.map((petal, index) => (
              <path
                key={`falling-${index}`}
                d={petal.d}
                fill="hsl(334 71% 74%)"
                className="animate-pulse"
                style={{ animationDelay: petal.delay }}
              />
            ))}

            <circle cx="84" cy="169" r="1.7" fill="hsl(42 96% 70%)" className="animate-pulse" />
            <circle cx="155" cy="166" r="1.6" fill="hsl(42 96% 70%)" className="animate-pulse" style={{ animationDelay: '0.45s' }} />
            <circle cx="121" cy="137" r="1.6" fill="hsl(42 96% 70%)" className="animate-pulse" style={{ animationDelay: '0.85s' }} />
          </g>
        )}
      </g>
    </svg>
  );
};

const GrowingPlant = ({
  progress,
  isRunning,
  plantType,
}: {
  progress: number;
  isRunning: boolean;
  plantType: PlantType;
}) => {
  if (plantType === 'tabebuiaRosea') {
    return <TabebuiaRoseaTree progress={progress} isRunning={isRunning} />;
  }

  return (
    <BloomingPlant progress={progress} isRunning={isRunning} />
  );
};

const Pomodoro = () => {
  const navigate = useNavigate();
  const [sessionType, setSessionType] = useState<SessionType>('focus');
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessions] = useState(0);
  const [isVibrating, setIsVibrating] = useState(false);
  const [focusMinutesInput, setFocusMinutesInput] = useState(String(DEFAULT_FOCUS_MINUTES));
  const [focusDurationSeconds, setFocusDurationSeconds] = useState(FOCUS_TIME);
  const [plantType, setPlantType] = useState<PlantType>('bloomingPlant');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const vibrationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const duration = useMemo(() => {
    if (sessionType === 'focus') return focusDurationSeconds;
    return sessionConfig[sessionType].duration;
  }, [sessionType, focusDurationSeconds]);
  const progress = 1 - timeLeft / Math.max(duration, 1);

  const triggerVibrationPattern = useCallback(() => {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
      return false;
    }

    const pattern: VibratePattern = [400, 140, 400, 140, 700];
    const didVibrate = navigator.vibrate(pattern);

    if (!didVibrate) {
      navigator.vibrate(700);
    }

    return true;
  }, []);

  const startCompletionVibration = useCallback(() => {
    setIsVibrating(true);

    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }

    const started = triggerVibrationPattern();
    if (!started) return;

    const repeatDurationMs = 1900;
    vibrationIntervalRef.current = setInterval(() => {
      triggerVibrationPattern();
    }, repeatDurationMs);
  }, [triggerVibrationPattern]);

  // Timer tick
  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsRunning(false);
          startCompletionVibration();
          if (sessionType === 'focus') setSessions((s) => s + 1);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, sessionType, startCompletionVibration]);

  const stopVibration = useCallback(() => {
    setIsVibrating(false);
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(0);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (vibrationIntervalRef.current) clearInterval(vibrationIntervalRef.current);
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(0);
      }
    };
  }, []);

  const switchSession = useCallback((type: SessionType) => {
    setSessionType(type);
    setTimeLeft(type === 'focus' ? focusDurationSeconds : sessionConfig[type].duration);
    setIsRunning(false);
    stopVibration();
  }, [focusDurationSeconds, stopVibration]);

  const reset = useCallback(() => {
    setTimeLeft(duration);
    setIsRunning(false);
    stopVibration();
  }, [duration, stopVibration]);

  const toggleTimer = useCallback(() => {
    if (isVibrating) return;
    setIsRunning((r) => !r);
  }, [isVibrating]);

  const applyFocusMinutes = useCallback((rawValue: string) => {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) {
      setFocusMinutesInput(String(Math.floor(focusDurationSeconds / 60)));
      return;
    }
    const clampedMinutes = Math.min(180, Math.max(1, Math.floor(parsed)));
    const nextDuration = clampedMinutes * 60;
    setFocusMinutesInput(String(clampedMinutes));
    setFocusDurationSeconds(nextDuration);

    if (sessionType === 'focus') {
      setTimeLeft(nextDuration);
      setIsRunning(false);
      stopVibration();
    }
  }, [sessionType, stopVibration, focusDurationSeconds]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const sessionsInCurrentCycle =
    sessionsCompleted > 0 && sessionsCompleted % 4 === 0
      ? 4
      : sessionsCompleted % 4;

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

      {sessionType === 'focus' && (
        <div className="px-6">
          <div className="max-w-sm mx-auto p-3 rounded-xl bg-secondary/40 border border-border flex items-center gap-3">
            <label htmlFor="focus-minutes" className="text-sm text-muted-foreground whitespace-nowrap">
              Focus minutes
            </label>
            <input
              id="focus-minutes"
              type="number"
              min={1}
              max={180}
              step={1}
              value={focusMinutesInput}
              onChange={(e) => setFocusMinutesInput(e.target.value)}
              onBlur={(e) => applyFocusMinutes(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  (e.currentTarget as HTMLInputElement).blur();
                }
              }}
              className="w-24 rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <span className="text-xs text-muted-foreground">1-180</span>
          </div>
        </div>
      )}

      <div className="px-6 pt-3">
        <div className="max-w-sm mx-auto p-2 rounded-xl bg-secondary/40 border border-border">
          <p className="px-1 text-xs font-medium text-muted-foreground mb-2">Plant style</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(plantConfig) as PlantType[]).map((type) => {
              const plant = plantConfig[type];
              const active = plantType === type;

              return (
                <button
                  key={type}
                  onClick={() => setPlantType(type)}
                  className={`rounded-lg px-3 py-2 text-left transition-colors border ${
                    active
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background/60 text-foreground border-border hover:bg-background'
                  }`}
                >
                  <p className="text-sm font-medium">{plant.label}</p>
                  <p className={`text-[11px] ${active ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {plant.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Plant + Timer area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        {/* Growing plant */}
        <div className={`transition-transform duration-500 ${isVibrating ? 'animate-[shake_0.3s_ease-in-out_infinite]' : ''}`}>
          <GrowingPlant progress={progress} isRunning={isRunning} plantType={plantType} />
        </div>

        {/* Timer display */}
        <div className="text-center">
          <div className="text-7xl font-mono font-bold text-foreground tracking-tight tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {isVibrating
              ? '🎉 Time\'s up! Tap reset'
              : isRunning
              ? sessionType === 'focus' ? 'Stay focused, your plant is growing…' : 'Take a breather 🌿'
              : 'Press play to start'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {isVibrating ? (
            <Button
              variant="outline"
              onClick={reset}
              className="rounded-full w-20 h-20 text-base animate-pulse border-destructive text-destructive hover:bg-destructive/10"
            >
              <RotateCcw className="w-7 h-7 mr-1" />
              Reset
            </Button>
          ) : (
            <>
              <Button variant="outline" size="icon" onClick={reset} className="rounded-full w-12 h-12">
                <RotateCcw className="w-5 h-5" />
              </Button>
              <button
                onClick={toggleTimer}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                  isRunning
                    ? 'bg-primary/80 text-primary-foreground hover:bg-primary/70'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {isRunning ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8 ml-1" />
                )}
              </button>
              <div className="w-12 h-12" /> {/* Spacer for balance */}
            </>
          )}
        </div>

        {/* Session dots */}
        <div className="flex gap-2 mt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i < sessionsInCurrentCycle
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
        @keyframes gentle-plant-sway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(1.7deg); }
        }

        @keyframes gentle-tree-sway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(1.4deg); }
        }

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
