import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Image, Clock, Mic, Square, X } from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { format } from 'date-fns';
import { useFileStorage } from '@/hooks/useFileStorage';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import MediaMenu from '@/components/MediaMenu';
import RichTextEditor from '@/components/RichTextEditor';

const Editor = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  
  const parseDateParam = (value: string | null): Date => {
    if (!value) return new Date();
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]) - 1;
      const d = Number(m[3]);
      const local = new Date(y, mo, d);
      if (!isNaN(local.getTime())) return local;
    }
    const parsed = new Date(value);
    return !isNaN(parsed.getTime()) ? parsed : new Date();
  };
  
  const selectedDate = parseDateParam(dateParam);
  const { content, saveContent, savePhoto, saveVoiceNote } = useFileStorage(selectedDate);
  
  const [localContent, setLocalContent] = useState(content);
  const [taskText, setTaskText] = useState('');
  const [mediaMenuOpen, setMediaMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const { isRecording, duration, startRecording, stopRecording, cancelRecording, formatDuration } = useVoiceRecorder();

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleSave = () => {
    saveContent(localContent);
    navigate(-1);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleAddTask = () => {
    if (!taskText.trim()) return;
    const taskLine = `<div>□ ${taskText.trim()}</div>`;
    const newContent = localContent ? `${localContent}${taskLine}` : taskLine;
    setLocalContent(newContent);
    setTaskText('');
  };

  const handleInsertTime = () => {
    const currentTime = format(new Date(), 'hh:mm a').toLowerCase();
    const timeText = `<div>${currentTime}: </div>`;
    const newContent = localContent ? `${localContent}${timeText}` : timeText;
    setLocalContent(newContent);
  };

  const handleSelectGallery = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const image = await CapacitorCamera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Photos
        });
        
        if (image.base64String) {
          await savePhoto(image.base64String);
        }
      } catch (e) {
        console.error('Gallery error:', e);
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleSelectCamera = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const image = await CapacitorCamera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera
        });
        
        if (image.base64String) {
          await savePhoto(image.base64String);
        }
      } catch (e) {
        console.error('Camera error:', e);
      }
    } else {
      cameraInputRef.current?.click();
    }
  };

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      await savePhoto(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      const result = await stopRecording();
      if (result) {
        await saveVoiceNote(result.base64, result.duration);
      }
    } else {
      await startRecording();
    }
  };

  const handleContentChange = (newContent: string) => {
    setLocalContent(newContent);
  };

  return (
    <main className="h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInput}
        className="hidden"
      />
      
      {/* Media Menu */}
      <MediaMenu
        isOpen={mediaMenuOpen}
        onClose={() => setMediaMenuOpen(false)}
        onSelectGallery={handleSelectGallery}
        onSelectCamera={handleSelectCamera}
      />
      
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border shrink-0">
        <button
          onClick={handleCancel}
          className="p-2 text-muted-foreground hover:text-foreground transition-smooth tap-highlight-none"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="text-sm text-muted-foreground">
          {format(selectedDate, 'MMM d, yyyy')}
        </span>
        <button
          onClick={handleSave}
          className="p-2 text-primary hover:bg-primary/10 rounded-full transition-smooth"
        >
          <Check className="w-5 h-5" />
        </button>
      </header>
      
      {/* Recording Indicator */}
      {isRecording && (
        <div className="flex items-center gap-3 mx-4 mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20 shrink-0">
          <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
          <span className="text-sm text-destructive font-medium">Recording... {formatDuration(duration)}</span>
          <div className="flex-1" />
          <button onClick={cancelRecording} className="text-xs text-muted-foreground hover:text-foreground">
            Cancel
          </button>
          <button onClick={handleVoiceRecord} className="px-3 py-1 bg-destructive text-destructive-foreground text-xs rounded-full">
            Stop
          </button>
        </div>
      )}
      
      {/* Rich Text Editor */}
      <RichTextEditor
        content={localContent}
        onChange={handleContentChange}
        placeholder="Start writing..."
        autoFocus
        className="flex-1 overflow-hidden"
      />
      
      {/* Bottom Toolbar */}
      <div className="flex items-center gap-1 p-4 border-t border-border shrink-0">
        <button
          onClick={() => setMediaMenuOpen(true)}
          title="Add media"
          className="p-1.5 text-muted-foreground hover:text-primary transition-smooth tap-highlight-none"
        >
          <Image className="w-5 h-5" />
        </button>
        
        <button
          onClick={handleInsertTime}
          title="Insert current time"
          className="p-1.5 text-muted-foreground hover:text-primary transition-smooth tap-highlight-none"
        >
          <Clock className="w-5 h-5" />
        </button>

        <button
          onClick={handleVoiceRecord}
          title="Record voice note"
          className={`p-1.5 transition-smooth tap-highlight-none ${isRecording ? 'text-destructive' : 'text-muted-foreground hover:text-primary'}`}
        >
          {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        
        <input
          type="text"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && taskText.trim()) {
              handleAddTask();
            }
          }}
          placeholder="Add a task..."
          className="flex-1 py-1 px-2 bg-transparent text-foreground text-xs placeholder:text-muted-foreground/60 border-b border-border focus:outline-none focus:border-primary transition-smooth"
        />
        <button
          onClick={handleAddTask}
          disabled={!taskText.trim()}
          className="p-1.5 text-primary disabled:text-muted-foreground/30 transition-smooth tap-highlight-none"
        >
          <Check className="w-4 h-4" />
        </button>
      </div>
    </main>
  );
};

export default Editor;