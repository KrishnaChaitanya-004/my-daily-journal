import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { CheckSquare, Camera, Clock, Check, MapPin, Cloud, Hash, X, Mic, Square, Play, Pause, Trash2 } from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import PhotoThumbnail from './PhotoThumbnail';
import PhotoViewer from './PhotoViewer';
import { format } from 'date-fns';
import { LocationData, WeatherData, VoiceNoteData } from '@/hooks/useFileStorage';
import { useLocation } from '@/hooks/useLocation';
import { useWeather } from '@/hooks/useWeather';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

interface PhotoData {
  filename: string;
  path: string;
  timestamp: number;
  base64?: string;
}

interface DailyContentProps {
  content: string;
  photos: PhotoData[];
  tags: string[];
  location?: LocationData;
  weather?: WeatherData;
  voiceNotes: VoiceNoteData[];
  isEditing: boolean;
  onEditingChange: (editing: boolean) => void;
  onUpdateContent: (content: string) => void;
  onAddTask: (taskText: string) => void;
  onToggleTask: (lineIndex: number) => void;
  onAddPhoto: (base64: string) => Promise<void>;
  onDeletePhoto: (filename: string) => void;
  onSaveMeta: (meta: { tags?: string[]; location?: LocationData; weather?: WeatherData }) => void;
  onSaveVoiceNote: (base64: string, duration: number) => Promise<void>;
  onDeleteVoiceNote: (filename: string) => void;
  getPhotoUrl: (photo: PhotoData) => string;
}

const DailyContent = ({ 
  content, 
  photos,
  tags,
  location,
  weather,
  voiceNotes,
  isEditing,
  onEditingChange,
  onUpdateContent, 
  onAddTask,
  onToggleTask,
  onAddPhoto,
  onDeletePhoto,
  onSaveMeta,
  onSaveVoiceNote,
  onDeleteVoiceNote,
  getPhotoUrl
}: DailyContentProps) => {
  const [taskText, setTaskText] = useState('');
  const [localContent, setLocalContent] = useState(content);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { getCurrentLocation, isLoading: locationLoading } = useLocation();
  const { fetchWeather, isLoading: weatherLoading } = useWeather();
  const { isRecording, duration, startRecording, stopRecording, cancelRecording, formatDuration } = useVoiceRecorder();
  
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
    onEditingChange(false);
  };

  // Handle Android back button when editing
  useEffect(() => {
    if (!isEditing || !Capacitor.isNativePlatform()) return;

    const backHandler = CapacitorApp.addListener('backButton', () => {
      // Save and close editor
      onUpdateContent(localContent);
      onEditingChange(false);
    });

    return () => {
      backHandler.then(h => h.remove());
    };
  }, [isEditing, localContent, onUpdateContent, onEditingChange]);

const handleAddTask = () => {
  if (!taskText.trim()) return;

  const taskLine = `□ ${taskText.trim()}`;
  const newContent = localContent
    ? `${localContent}\n${taskLine}`
    : taskLine;

  setLocalContent(newContent);
  onUpdateContent(newContent); // 🔥 important
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
    e.target.value = '';
  };

  const handleAddLocation = async () => {
    const loc = await getCurrentLocation();
    if (loc) {
      onSaveMeta({ location: loc });
    }
  };

  const handleAddWeather = async () => {
    // Fetch weather - will get location automatically if not provided
    const w = await fetchWeather();
    if (w) {
      onSaveMeta({ weather: w });
    }
  };

  const handleAddTag = () => {
    const newTag = tagInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (newTag && !tags.includes(newTag)) {
      onSaveMeta({ tags: [...tags, newTag] });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    onSaveMeta({ tags: tags.filter(t => t !== tag) });
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      const result = await stopRecording();
      if (result) {
        await onSaveVoiceNote(result.base64, result.duration);
      }
    } else {
      await startRecording();
    }
  };

  const handlePlayVoice = (note: VoiceNoteData) => {
    if (playingVoice === note.filename) {
      audioRef.current?.pause();
      setPlayingVoice(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(`data:audio/webm;base64,${note.base64}`);
      audio.onended = () => setPlayingVoice(null);
      audio.play();
      audioRef.current = audio;
      setPlayingVoice(note.filename);
    }
  };

  const getPhotoByFilename = (filename: string): PhotoData | undefined => {
    return photos.find(p => p.filename === filename);
  };

  const renderContent = () => {
    if (!content && photos.length === 0) return null;
    
    const lines = content ? content.split('\n') : [];
    
    return (
      <>
        {lines.map((line, index) => {
          // More tolerant photo matching - allow whitespace around the marker
          const photoMatch = line.trim().match(/^\[photo:(.+?)\]$/);
          if (photoMatch) {
            const filename = photoMatch[1].trim();
            const photo = getPhotoByFilename(filename);
            if (photo) {
              const photoUrl = getPhotoUrl(photo);
              return (
                <div key={index} className="py-1 w-fit" onClick={(e) => e.stopPropagation()}>
                  <PhotoThumbnail
                    src={photoUrl}
                    timestamp={photo.timestamp}
                    onView={() => setViewingPhoto(photoUrl)}
                    onDelete={() => onDeletePhoto(photo.filename)}
                  />
                </div>
              );
            }
            // Photo marker exists but photo not found in array - show placeholder
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
              <div key={index} className="flex items-baseline gap-2 py-0.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTask(index);
                  }}
                  className={`
                    text-[20px] leading-none transition-smooth tap-highlight-none flex-shrink-0
                    ${isCheckedTask ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
                  `}
                >
                  {isCheckedTask ? '✓' : '□'}
                </button>
                <span
                  className={`
                    text-sm font-light
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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInput}
        className="hidden"
      />
      
      {viewingPhoto && (
        <PhotoViewer 
          src={viewingPhoto} 
          onClose={() => setViewingPhoto(null)} 
        />
      )}

      {/* Metadata Row - Location, Weather, Tags */}
      <div className="flex flex-wrap items-center gap-2 mb-3 -mt-1" onClick={(e) => e.stopPropagation()}>
        {/* Location */}
        {location ? (
          <div className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-full text-xs text-foreground">
            <MapPin className="w-3 h-3 text-primary" />
            <span>{location.name}</span>
          </div>
        ) : (
          <button
            onClick={handleAddLocation}
            disabled={locationLoading}
            className="flex items-center gap-1 px-2 py-1 bg-secondary/50 rounded-full text-xs text-muted-foreground hover:bg-secondary transition-smooth"
          >
            <MapPin className="w-3 h-3" />
            <span>{locationLoading ? '...' : 'Add location'}</span>
          </button>
        )}

        {/* Weather */}
        {weather ? (
          <div className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-full text-xs text-foreground">
            <span>{weather.icon}</span>
            <span>{weather.temp}°C</span>
          </div>
        ) : (
          <button
            onClick={handleAddWeather}
            disabled={weatherLoading}
            className="flex items-center gap-1 px-2 py-1 bg-secondary/50 rounded-full text-xs text-muted-foreground hover:bg-secondary transition-smooth"
          >
            <Cloud className="w-3 h-3" />
            <span>{weatherLoading ? '...' : 'Add weather'}</span>
          </button>
        )}

        {/* Tags */}
        {tags.map(tag => (
          <div key={tag} className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full text-xs text-primary">
            <Hash className="w-3 h-3" />
            <span>{tag}</span>
            <button onClick={() => handleRemoveTag(tag)} className="ml-0.5 hover:text-destructive">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        
        {/* Add Tag Input */}
        <div className="flex items-center">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
            onBlur={handleAddTag}
            placeholder="#tag"
            className="w-16 px-2 py-1 bg-transparent text-xs placeholder:text-muted-foreground/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Voice Notes */}
      {voiceNotes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3" onClick={(e) => e.stopPropagation()}>
          {voiceNotes.map(note => (
            <div key={note.filename} className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
              <button
                onClick={() => handlePlayVoice(note)}
                className="text-primary hover:text-primary/80 transition-smooth"
              >
                {playingVoice === note.filename ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <span className="text-xs text-muted-foreground">{formatDuration(note.duration)}</span>
              <button
                onClick={() => onDeleteVoiceNote(note.filename)}
                className="text-muted-foreground hover:text-destructive transition-smooth"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <div className="flex items-center gap-3 mb-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
          <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
          <span className="text-sm text-destructive font-medium">Recording... {formatDuration(duration)}</span>
          <div className="flex-1" />
          <button
            onClick={cancelRecording}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleVoiceRecord}
            className="px-3 py-1 bg-destructive text-destructive-foreground text-xs rounded-full"
          >
            Stop
          </button>
        </div>
      )}

      {/* Fullscreen editor overlay */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <span className="text-sm text-muted-foreground">Editing</span>
            <button
              onClick={handleSave}
              className="p-2 text-primary hover:bg-primary/10 rounded-full transition-smooth"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 p-4 overflow-hidden">
            <textarea
              ref={textareaRef}
              data-content-editor
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
              onFocus={(e) => {
                // Move cursor to end of content
                const len = e.target.value.length;
                e.target.setSelectionRange(len, len);
              }}
            />
          </div>
          
          <div className="flex items-center gap-1 p-4 border-t border-border">
            <button
              onClick={handlePhotoCapture}
              title="Add photo"
              className="p-1.5 text-muted-foreground hover:text-primary transition-smooth tap-highlight-none"
            >
              <Camera className="w-5 h-5" />
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
              title="Add task"
              className="p-1.5 text-muted-foreground hover:text-primary disabled:opacity-40 transition-smooth tap-highlight-none"
            >
              <CheckSquare className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      
      {/* Main content area - click to edit */}
      <div 
        className="flex-1 mb-4 overflow-y-auto cursor-text"
        onClick={() => {
          onEditingChange(true);
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
