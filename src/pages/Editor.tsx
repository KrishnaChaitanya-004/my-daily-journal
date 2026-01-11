import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Image, Clock, Mic, Square, X, Camera } from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { format } from 'date-fns';
import { useFileStorage } from '@/hooks/useFileStorage';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import MediaMenu from '@/components/MediaMenu';
import RichTextToolbar from '@/components/RichTextToolbar';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
    const taskLine = `□ ${taskText.trim()}`;
    const newContent = localContent ? `${localContent}\n${taskLine}` : taskLine;
    setLocalContent(newContent);
    setTaskText('');
  };

  const handleInsertTime = () => {
    const currentTime = format(new Date(), 'hh:mm a').toLowerCase();
    const timeText = `${currentTime}: `;
    
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = localContent.slice(0, start) + timeText + localContent.slice(end);
      setLocalContent(newContent);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + timeText.length;
        textarea.focus();
      }, 0);
    } else {
      setLocalContent(prev => prev ? `${prev}\n${timeText}` : timeText);
    }
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

  // Rich text formatting
  const handleFormat = (format: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localContent.slice(start, end);
    
    let replacement = '';
    let cursorOffset = 0;
    
    switch (format) {
      case 'bold':
        replacement = `**${selectedText || 'text'}**`;
        cursorOffset = selectedText ? replacement.length : 2;
        break;
      case 'italic':
        replacement = `_${selectedText || 'text'}_`;
        cursorOffset = selectedText ? replacement.length : 1;
        break;
      case 'underline':
        replacement = `__${selectedText || 'text'}__`;
        cursorOffset = selectedText ? replacement.length : 2;
        break;
      case 'h1':
        // Find start of current line
        const lineStart1 = localContent.lastIndexOf('\n', start - 1) + 1;
        const beforeLine1 = localContent.slice(0, lineStart1);
        const currentLine1 = localContent.slice(lineStart1, end);
        const afterLine1 = localContent.slice(end);
        // Remove existing heading markers and add h1
        const cleanLine1 = currentLine1.replace(/^#{1,2}\s*/, '');
        const newContent1 = beforeLine1 + '# ' + cleanLine1 + afterLine1;
        setLocalContent(newContent1);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = lineStart1 + 2 + cleanLine1.length;
          textarea.focus();
        }, 0);
        return;
      case 'h2':
        const lineStart2 = localContent.lastIndexOf('\n', start - 1) + 1;
        const beforeLine2 = localContent.slice(0, lineStart2);
        const currentLine2 = localContent.slice(lineStart2, end);
        const afterLine2 = localContent.slice(end);
        const cleanLine2 = currentLine2.replace(/^#{1,2}\s*/, '');
        const newContent2 = beforeLine2 + '## ' + cleanLine2 + afterLine2;
        setLocalContent(newContent2);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = lineStart2 + 3 + cleanLine2.length;
          textarea.focus();
        }, 0);
        return;
      case 'bullet':
        const lineStart3 = localContent.lastIndexOf('\n', start - 1) + 1;
        const beforeLine3 = localContent.slice(0, lineStart3);
        const currentLine3 = localContent.slice(lineStart3, end);
        const afterLine3 = localContent.slice(end);
        // Toggle bullet
        if (currentLine3.startsWith('• ')) {
          const newContent3 = beforeLine3 + currentLine3.slice(2) + afterLine3;
          setLocalContent(newContent3);
        } else {
          const cleanLine3 = currentLine3.replace(/^(\d+\.\s|•\s)/, '');
          const newContent3 = beforeLine3 + '• ' + cleanLine3 + afterLine3;
          setLocalContent(newContent3);
        }
        setTimeout(() => textarea.focus(), 0);
        return;
      case 'numbered':
        const lineStart4 = localContent.lastIndexOf('\n', start - 1) + 1;
        const beforeLine4 = localContent.slice(0, lineStart4);
        const currentLine4 = localContent.slice(lineStart4, end);
        const afterLine4 = localContent.slice(end);
        // Count previous numbered items for auto-increment
        const lines = beforeLine4.split('\n');
        let lastNum = 0;
        for (let i = lines.length - 1; i >= 0; i--) {
          const match = lines[i].match(/^(\d+)\./);
          if (match) {
            lastNum = parseInt(match[1]);
            break;
          } else if (lines[i].trim() !== '') {
            break;
          }
        }
        if (currentLine4.match(/^\d+\.\s/)) {
          const newContent4 = beforeLine4 + currentLine4.replace(/^\d+\.\s/, '') + afterLine4;
          setLocalContent(newContent4);
        } else {
          const cleanLine4 = currentLine4.replace(/^(•\s)/, '');
          const newContent4 = beforeLine4 + `${lastNum + 1}. ` + cleanLine4 + afterLine4;
          setLocalContent(newContent4);
        }
        setTimeout(() => textarea.focus(), 0);
        return;
      default:
        return;
    }
    
    const newContent = localContent.slice(0, start) + replacement + localContent.slice(end);
    setLocalContent(newContent);
    
    setTimeout(() => {
      if (selectedText) {
        textarea.selectionStart = start;
        textarea.selectionEnd = start + replacement.length;
      } else {
        // Position cursor inside the markers to type
        textarea.selectionStart = textarea.selectionEnd = start + cursorOffset;
      }
      textarea.focus();
    }, 0);
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
      
      {/* Rich Text Toolbar */}
      <RichTextToolbar onFormat={handleFormat} />
      
      {/* Recording Indicator */}
      {isRecording && (
        <div className="flex items-center gap-3 mx-4 mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
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
      
      {/* Editor */}
      <div className="flex-1 p-4 overflow-hidden">
        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          placeholder="Start writing..."
          className="w-full h-full bg-transparent text-foreground text-sm font-light placeholder:text-muted-foreground/60 focus:outline-none resize-none leading-snug"
          autoFocus
          onFocus={(e) => {
            const len = e.target.value.length;
            e.target.setSelectionRange(len, len);
          }}
        />
      </div>
      
      {/* Toolbar */}
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
