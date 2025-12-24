import { useState, useCallback } from 'react';
import { Plus, Pencil, Camera, Mic, CheckSquare, X } from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

interface QuickAddFABProps {
  onAddNote: () => void;
  onAddPhoto: (base64: string) => Promise<void>;
  onAddVoice: (base64: string, duration: number) => Promise<void>;
  onAddTask: () => void;
}

const QuickAddFAB = ({ onAddNote, onAddPhoto, onAddVoice, onAddTask }: QuickAddFABProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isRecording, duration, startRecording, stopRecording, formatDuration } = useVoiceRecorder();

  const handlePhotoCapture = async () => {
    setIsOpen(false);
    if (Capacitor.isNativePlatform()) {
      try {
        const image = await CapacitorCamera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Prompt
        });
        
        if (image.base64String) {
          await onAddPhoto(image.base64String);
        }
      } catch (e) {
        console.error('Camera error:', e);
      }
    }
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      const result = await stopRecording();
      if (result) {
        await onAddVoice(result.base64, result.duration);
      }
      setIsOpen(false);
    } else {
      await startRecording();
    }
  };

  const actions = [
    { icon: Pencil, label: 'Note', action: () => { onAddNote(); setIsOpen(false); }, color: 'bg-blue-500' },
    { icon: Camera, label: 'Photo', action: handlePhotoCapture, color: 'bg-green-500' },
    { icon: Mic, label: isRecording ? formatDuration(duration) : 'Voice', action: handleVoiceRecord, color: isRecording ? 'bg-red-500' : 'bg-purple-500' },
    { icon: CheckSquare, label: 'Task', action: () => { onAddTask(); setIsOpen(false); }, color: 'bg-orange-500' }
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

      {/* FAB Container */}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col-reverse items-center gap-3">
        {/* Action buttons */}
        {isOpen && actions.map((action, index) => (
          <button
            key={action.label}
            onClick={action.action}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg
              ${action.color} text-white
              transform transition-all duration-200 ease-out
              hover:scale-105 active:scale-95
            `}
            style={{
              animation: `slideUp 0.2s ease-out ${index * 0.05}s both`
            }}
          >
            <action.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        ))}

        {/* Main FAB button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-14 h-14 rounded-full shadow-lg
            flex items-center justify-center
            transition-all duration-300 ease-out
            ${isOpen 
              ? 'bg-muted-foreground rotate-45' 
              : 'bg-primary hover:bg-primary/90'}
          `}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Plus className="w-6 h-6 text-primary-foreground" />
          )}
        </button>
      </div>

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
