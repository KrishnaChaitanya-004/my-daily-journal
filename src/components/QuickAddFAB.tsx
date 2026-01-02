import { useState } from 'react';
import { Plus, Pencil, Mic, CheckSquare, X } from 'lucide-react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

interface QuickAddFABProps {
  onAddNote: () => void;
  onAddVoice: (base64: string, duration: number) => Promise<void>;
  onAddTask: () => void;
}

const QuickAddFAB = ({ onAddNote, onAddVoice, onAddTask }: QuickAddFABProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const {
    isRecording,
    duration,
    startRecording,
    stopRecording,
    formatDuration,
    error,
  } = useVoiceRecorder();

  const handleVoiceRecord = async () => {
    if (isRecording) {
      const result = await stopRecording();
      if (result) {
        await onAddVoice(result.base64, result.duration);
      }
      setIsOpen(false);
    } else {
      const started = await startRecording();
      if (!started) {
        alert('Microphone could not start recording');
      }
    }
  };

  const actions = [
    {
      icon: CheckSquare,
      label: 'Task',
      action: () => {
        onAddTask();
        setIsOpen(false);
      },
      color: 'bg-orange-500',
    },
    {
      icon: Mic,
      label: isRecording ? formatDuration(duration) : 'Voice',
      action: handleVoiceRecord,
      color: isRecording ? 'bg-red-500' : 'bg-purple-500',
    },
    {
      icon: Pencil,
      label: 'Note',
      action: () => {
        onAddNote();
        setIsOpen(false);
      },
      color: 'bg-blue-500',
    },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB wrapper — position NEVER moves */}
      <div
        className="fixed z-50 flex flex-col items-center"
        style={{
          right: '20px',
          bottom: 'calc(20px + env(safe-area-inset-bottom))',
        }}
      >
        {/* Action buttons — appear ABOVE FAB */}
        <div className="flex flex-col items-center gap-3 mb-3">
          {isOpen &&
            actions.map((action, index) => (
              <button
                key={action.label}
                onClick={action.action}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg
                  ${action.color} text-white
                  transform transition-all duration-200 ease-out
                  hover:scale-105 active:scale-95`}
                style={{
                  animation: `fabUp 0.2s ease-out ${index * 0.06}s both`,
                }}
              >
                <action.icon className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {action.label}
                </span>
              </button>
            ))}
        </div>

        {/* MAIN FAB (stays fixed) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-12 h-12 rounded-full shadow-xl
            flex items-center justify-center
            transition-transform duration-300
            ${isOpen ? 'bg-muted-foreground rotate-45' : 'bg-primary'}`}
        >
          {isOpen ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <Plus className="w-5 h-5 text-primary-foreground" />
          )}
        </button>
      </div>

      {/* Error toast */}
      {error && (
        <div
          className="fixed z-50 bg-red-500 text-white px-3 py-2 rounded text-sm"
          style={{
            right: '20px',
            bottom: 'calc(90px + env(safe-area-inset-bottom))',
          }}
        >
          {error}
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes fabUp {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
};

export default QuickAddFAB;
