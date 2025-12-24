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
      console.log('STOP RECORD CLICKED');

      const result = await stopRecording();
      if (result) {
        console.log('RECORD RESULT', result);

        // // 🔊 TEMP TEST — proves mic is working
        // const audio = new Audio(
        //   `data:audio/aac;base64,${result.base64}`
        // );
        // audio.play();

        await onAddVoice(result.base64, result.duration);
      } else {
        console.log('NO RECORD RESULT');
      }

      setIsOpen(false);
    } else {
      console.log('START RECORD CLICKED');

      const started = await startRecording();
      console.log('RECORD STARTED?', started);

      if (!started) {
        alert('Microphone could not start recording');
      }
    }
  };

  const handleNoteClick = () => {
    setIsOpen(false);
    onAddNote();
  };

  const actions = [
    {
      icon: Pencil,
      label: 'Note',
      action: handleNoteClick,
      color: 'bg-blue-500',
    },
    {
      icon: Mic,
      label: isRecording ? formatDuration(duration) : 'Voice',
      action: handleVoiceRecord,
      color: isRecording ? 'bg-red-500' : 'bg-purple-500',
    },
    {
      icon: CheckSquare,
      label: 'Task',
      action: () => {
        onAddTask();
        setIsOpen(false);
      },
      color: 'bg-orange-500',
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

      {/* FAB */}
      <div className="fixed bottom-6 right-4 z-50 flex flex-col-reverse items-center gap-3">
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
                animation: `slideUp 0.2s ease-out ${index * 0.05}s both`,
              }}
            >
              <action.icon className="w-5 h-5" />
              <span className="text-sm font-medium">
                {action.label}
              </span>
            </button>
          ))}

        {/* Main FAB */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-9 h-9 rounded-full shadow-lg
            flex items-center justify-center
            transition-all duration-300 ease-out
            ${isOpen ? 'bg-muted-foreground rotate-45' : 'bg-primary'}`}
        >
          {isOpen ? (
            <X className="w-4 h-4 text-white" />
          ) : (
            <Plus className="w-4 h-4 text-primary-foreground" />
          )}
        </button>
      </div>

      {error && (
        <div className="fixed bottom-20 right-4 bg-red-500 text-white px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.9);
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
