import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { CheckSquare, Camera, Clock, Check } from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import PhotoThumbnail from './PhotoThumbnail';
import PhotoViewer from './PhotoViewer';
import { format } from 'date-fns';

interface PhotoData {
  filename: string;
  path: string;
  timestamp: number;
  base64?: string;
}

interface DailyContentProps {
  content: string;
  photos: PhotoData[];
  onUpdateContent: (content: string) => void;
  onAddTask: (taskText: string) => void;
  onToggleTask: (lineIndex: number) => void;
  onAddPhoto: (base64: string) => Promise<void>;
  onDeletePhoto: (filename: string) => void;
  getPhotoUrl: (photo: PhotoData) => string;
}

const DailyContent = ({ 
  content, 
  photos,
  onUpdateContent, 
  onAddTask,
  onToggleTask,
  onAddPhoto,
  onDeletePhoto,
  getPhotoUrl
}: DailyContentProps) => {
  const [taskText, setTaskText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(content);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Sync localContent when content changes (e.g., date change or task toggle)
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
  };

  const handleSave = () => {
    onUpdateContent(localContent);
    setIsEditing(false);
  };

  const handleAddTask = () => {
    if (taskText.trim()) {
      onAddTask(taskText.trim());
      setTaskText('');
    }
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
      // Set cursor position after inserted time
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + timeText.length;
        textarea.focus();
      }, 0);
    } else {
      const newContent = localContent ? `${localContent}\n${timeText}` : timeText;
      setLocalContent(newContent);
      onUpdateContent(newContent);
    }
  };

  const handlePhotoCapture = async () => {
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
    } else {
      // Web fallback - trigger file input
      fileInputRef.current?.click();
    }
  };

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      await onAddPhoto(base64);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    e.target.value = '';
  };

  // Get photo by filename from photos array
  const getPhotoByFilename = (filename: string): PhotoData | undefined => {
    return photos.find(p => p.filename === filename);
  };

  // Parse content into lines for rendering with inline photos
  const renderContent = () => {
    if (!content && photos.length === 0) return null;
    
    const lines = content ? content.split('\n') : [];
    
    return (
      <>
        {lines.map((line, index) => {
          // Check for photo marker: [photo:filename.jpg]
          const photoMatch = line.match(/^\[photo:(.+)\]$/);
          if (photoMatch) {
            const filename = photoMatch[1];
            const photo = getPhotoByFilename(filename);
            if (photo) {
              const photoUrl = getPhotoUrl(photo);
              return (
                <div key={index} className="py-1">
                  <PhotoThumbnail
                    src={photoUrl}
                    timestamp={photo.timestamp}
                    onView={() => setViewingPhoto(photoUrl)}
                    onDelete={() => onDeletePhoto(photo.filename)}
                  />
                </div>
              );
            }
            // Photo not found, show placeholder
            return (
              <div key={index} className="text-sm text-muted-foreground py-0.5 italic">
                [Photo not found: {filename}]
              </div>
            );
          }

          const isUncheckedTask = line.startsWith('□ ');
          const isCheckedTask = line.startsWith('✓ ');
          
          if (isUncheckedTask || isCheckedTask) {
            const taskContent = line.slice(2);
            return (
              <div key={index} className="flex items-center gap-2 py-0.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTask(index);
                  }}
                  className={`
                    text-[25px] leading-none transition-smooth tap-highlight-none flex-shrink-0
                    ${isCheckedTask ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
                  `}
                >
                  {isCheckedTask ? '✓' : '□'}
                </button>
                <span
                  className={`
                    text-sm font-light leading-relaxed
                    ${isCheckedTask ? 'line-through text-muted-foreground' : 'text-foreground'}
                  `}
                >
                  {taskContent}
                </span>
              </div>
            );
          }
          
          return (
            <div key={index} className="text-sm font-light leading-relaxed text-foreground py-0.5">
              {line || <br />}
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="w-full p-4 animate-fade-in flex flex-col h-full">
      {/* Hidden file input for web */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInput}
        className="hidden"
      />
      
      {/* Photo viewer modal */}
      {viewingPhoto && (
        <PhotoViewer 
          src={viewingPhoto} 
          onClose={() => setViewingPhoto(null)} 
        />
      )}

      {/* Fullscreen editor overlay */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          {/* Header with save button */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <span className="text-sm text-muted-foreground">Editing</span>
            <button
              onClick={handleSave}
              className="p-2 text-primary hover:bg-primary/10 rounded-full transition-smooth"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
          
          {/* Textarea */}
          <div className="flex-1 p-4 overflow-hidden">
            <textarea
              ref={textareaRef}
              value={localContent}
              onChange={handleContentChange}
              placeholder="Start writing..."
              className="
                w-full h-full
                bg-transparent text-foreground text-sm font-light
                placeholder:text-muted-foreground/60
                focus:outline-none resize-none
                leading-snug
              "
              autoFocus
            />
          </div>
          
          {/* Bottom toolbar */}
          <div className="flex items-center gap-1 p-4 border-t border-border">
            <button
              onClick={handlePhotoCapture}
              title="Add photo"
              className="p-1.5 text-muted-foreground hover:text-primary transition-smooth tap-highlight-none"
            >
              <Camera className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleInsertTime}
              title="Insert current time"
              className="p-1.5 text-muted-foreground hover:text-primary transition-smooth tap-highlight-none"
            >
              <Clock className="w-4 h-4" />
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
              title="Add task"
              className="p-1.5 text-muted-foreground hover:text-primary disabled:opacity-40 transition-smooth tap-highlight-none"
            >
              <CheckSquare className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Main content area - click to edit */}
      <div 
        className="flex-1 mb-4 overflow-y-auto cursor-text"
        onClick={() => {
          setIsEditing(true);
          setTimeout(() => textareaRef.current?.focus(), 0);
        }}
      >
        <div className="min-h-[200px]">
          {content || photos.length > 0 ? (
            renderContent()
          ) : (
            <span className="text-muted-foreground/60 text-sm font-light">
              Start writing...
            </span>
          )}
        </div>
      </div>

    </div>
  );
};

export default DailyContent;
