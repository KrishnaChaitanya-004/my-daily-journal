import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Camera, Clock, Check, MapPin, Cloud, Hash, Mic, Square, Play, Pause } from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import PhotoThumbnail from './PhotoThumbnail';
import PhotoViewer from './PhotoViewer';
import TaskPillSection from './TaskPillSection';
import { format } from 'date-fns';
import { LocationData, WeatherData, VoiceNoteData } from '@/hooks/useFileStorage';
import { useLocation } from '@/hooks/useLocation';
import { useWeather } from '@/hooks/useWeather';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { DiaryTask } from '@/lib/tasks';

interface PhotoData {
  filename: string;
  path: string;
  timestamp: number;
  base64?: string;
}

interface DailyContentProps {
  content: string;
  tasks: DiaryTask[];
  photos: PhotoData[];
  tags: string[];
  location?: LocationData;
  weather?: WeatherData;
  voiceNotes: VoiceNoteData[];
  isEditing: boolean;
  selectedDate: Date;
  onEditingChange: (editing: boolean) => void;
  onUpdateContent: (content: string) => void;
  onAddTask: (taskText: string) => void;
  onToggleTask: (taskId: string) => void;
  onToggleLegacyTask: (lineIndex: number) => void;
  onAddPhoto: (base64: string) => Promise<void>;
  onDeletePhoto: (filename: string) => void;
  onSaveMeta: (meta: { tags?: string[]; location?: LocationData; weather?: WeatherData }) => void;
  onSaveVoiceNote: (base64: string, duration: number) => Promise<void>;
  onDeleteVoiceNote: (filename: string) => void;
  getPhotoUrl: (photo: PhotoData) => string;
  onPhotoViewerOpenChange?: (open: boolean) => void;
}

const DailyContent = ({ 
  content, 
  tasks,
  photos,
  tags,
  location,
  weather,
  voiceNotes,
  isEditing,
  selectedDate,
  onEditingChange,
  onUpdateContent, 
  onAddTask,
  onToggleTask,
  onToggleLegacyTask,
  onAddPhoto,
  onDeletePhoto,
  onSaveMeta,
  onSaveVoiceNote,
  onDeleteVoiceNote,
  getPhotoUrl,
  onPhotoViewerOpenChange,
}: DailyContentProps) => {
  const photoMarkerRegex = /^\[photo:(.+?)\]$/;
  const navigate = useNavigate();
  const [taskText, setTaskText] = useState('');
  const [localContent, setLocalContent] = useState(content);
  const [viewingPhotoIndex, setViewingPhotoIndex] = useState<number | null>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { getCurrentLocation, isLoading: locationLoading } = useLocation();
  const { fetchWeather, isLoading: weatherLoading } = useWeather();
  const { isRecording, duration, startRecording, stopRecording, cancelRecording, formatDuration } = useVoiceRecorder();
  
  // Track if we're in the middle of saving to prevent race conditions
  const isSavingRef = useRef(false);
  const pendingContentRef = useRef<string | null>(null);

  // Sync localContent when content changes (e.g., date change or task toggle)
  // BUT skip if we just saved (to avoid overwriting with stale prop)
  useEffect(() => {
    if (isSavingRef.current) {
      // If we're saving, check if this is our saved content coming back
      if (content === pendingContentRef.current) {
        // Our save came through, reset flags
        isSavingRef.current = false;
        pendingContentRef.current = null;
      }
      // Don't overwrite localContent while saving
      return;
    }
    setLocalContent(content);
  }, [content]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
  };

  const handleSave = () => {
    // Mark that we're saving to prevent race condition
    isSavingRef.current = true;
    pendingContentRef.current = localContent;
    
    // Save the content
    onUpdateContent(localContent);
    
    // Close editor after a small delay to ensure state propagates
    setTimeout(() => {
      onEditingChange(false);
      // Reset saving flag after a brief moment
      setTimeout(() => {
        isSavingRef.current = false;
        pendingContentRef.current = null;
      }, 100);
    }, 50);
  };

  // Handle Android back button when editing
  useEffect(() => {
    if (!isEditing || !Capacitor.isNativePlatform()) return;

    const backHandler = CapacitorApp.addListener('backButton', () => {
      // Save and close editor using the same safe save logic
      isSavingRef.current = true;
      pendingContentRef.current = localContent;
      onUpdateContent(localContent);
      setTimeout(() => {
        onEditingChange(false);
        setTimeout(() => {
          isSavingRef.current = false;
          pendingContentRef.current = null;
        }, 100);
      }, 50);
    });

    return () => {
      backHandler.then(h => h.remove());
    };
  }, [isEditing, localContent, onUpdateContent, onEditingChange]);

  // Auto-save when app goes to background while editing
  useEffect(() => {
    if (!isEditing) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // App is going to background, save current content immediately
        onUpdateContent(localContent);
      }
    };

    const handlePageHide = () => {
      // Page is being hidden (mobile), save content
      onUpdateContent(localContent);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [isEditing, localContent, onUpdateContent]);

  const handleAddTask = () => {
    if (!taskText.trim()) return;
    onAddTask(taskText.trim());
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

  const fileToBase64 = (file: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    for (const file of files) {
      const base64 = await fileToBase64(file);
      await onAddPhoto(base64);
    }
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
      setPlaybackTime(0);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(`data:audio/webm;base64,${note.base64}`);
      audio.onended = () => {
        setPlayingVoice(null);
        setPlaybackTime(0);
      };
      audio.ontimeupdate = () => {
        setPlaybackTime(audio.currentTime);
      };
      audio.play();
      audioRef.current = audio;
      setPlayingVoice(note.filename);
      setPlaybackTime(0);
    }
  };

  const getPhotoByFilename = (filename: string): PhotoData | undefined => {
    return photos.find((photo) => photo.filename === filename);
  };

  const viewerPhotos = photos
    .map((photo) => ({
      filename: photo.filename,
      src: getPhotoUrl(photo),
      timestamp: photo.timestamp,
    }))
    .filter((photo) => !!photo.src);

  useEffect(() => {
    if (viewingPhotoIndex === null) return;

    if (viewerPhotos.length === 0) {
      setViewingPhotoIndex(null);
      return;
    }

    if (viewingPhotoIndex > viewerPhotos.length - 1) {
      setViewingPhotoIndex(viewerPhotos.length - 1);
    }
  }, [viewerPhotos.length, viewingPhotoIndex]);

  useEffect(() => {
    onPhotoViewerOpenChange?.(viewingPhotoIndex !== null);
    return () => {
      onPhotoViewerOpenChange?.(false);
    };
  }, [onPhotoViewerOpenChange, viewingPhotoIndex]);

  const openPhotoViewer = (filename: string) => {
    const index = viewerPhotos.findIndex((photo) => photo.filename === filename);
    if (index !== -1) {
      setViewingPhotoIndex(index);
    }
  };

  const handleViewerDelete = (filename: string) => {
    const currentLength = viewerPhotos.length;
    onDeletePhoto(filename);
    setViewingPhotoIndex((prev) => {
      if (prev === null) return null;
      if (currentLength <= 1) return null;
      return Math.min(prev, currentLength - 2);
    });
  };

  const renderContent = () => {
    if (!content && photos.length === 0) return null;
    
    const lines = content ? content.split('\n') : [];
    const blocks: React.ReactNode[] = [];

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      const photoMatch = line.trim().match(photoMarkerRegex);

      if (photoMatch) {
        const groupedPhotos: PhotoData[] = [];
        let groupIndex = index;

        while (groupIndex < lines.length) {
          const groupedMatch = lines[groupIndex].trim().match(photoMarkerRegex);
          if (!groupedMatch) break;

          const groupedFilename = groupedMatch[1].trim();
          const groupedPhoto = getPhotoByFilename(groupedFilename);
          if (!groupedPhoto) break;

          groupedPhotos.push(groupedPhoto);
          groupIndex++;
        }

        if (groupedPhotos.length > 0) {
          blocks.push(
            <div key={`photo-group-${index}`} className="py-1" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-wrap gap-3">
                {groupedPhotos.map((photo) => (
                  <PhotoThumbnail
                    key={photo.filename}
                    src={getPhotoUrl(photo)}
                    timestamp={photo.timestamp}
                    onView={() => openPhotoViewer(photo.filename)}
                    onDelete={() => onDeletePhoto(photo.filename)}
                    sizeClassName="w-[72px]"
                  />
                ))}
              </div>
            </div>
          );
          index = groupIndex - 1;
          continue;
        }

        const filename = photoMatch[1].trim();
        blocks.push(
          <div key={`photo-missing-${index}`} className="py-0.5 text-sm italic text-muted-foreground">
            [Photo not found: {filename}]
          </div>
        );
        continue;
      }

      const isUncheckedTask = line.startsWith('□ ');
      const isCheckedTask = line.startsWith('✓ ');
      
      if (isUncheckedTask || isCheckedTask) {
        const taskContent = line.slice(2);
        blocks.push(
          <div key={`task-${index}`} className="flex items-baseline gap-2 py-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLegacyTask(index);
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
        continue;
      }

      blocks.push(
        <div key={`text-${index}`} className="py-0.5 text-sm font-light leading-relaxed text-foreground">
          {line || <br />}
        </div>
      );
    }

    return <>{blocks}</>;
  };

  return (
    <div className="w-full p-4 animate-fade-in flex flex-col h-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileInput}
        className="hidden"
      />
      
      {viewingPhotoIndex !== null && viewerPhotos[viewingPhotoIndex] && (
        <PhotoViewer 
          photos={viewerPhotos}
          currentIndex={viewingPhotoIndex}
          onChangeIndex={setViewingPhotoIndex}
          onClose={() => setViewingPhotoIndex(null)}
          onDelete={handleViewerDelete}
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
          </div>
        ))}
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
              <span className="text-xs text-muted-foreground font-mono">
                {playingVoice === note.filename 
                  ? `${formatDuration(playbackTime)} / ${formatDuration(note.duration)}`
                  : formatDuration(note.duration)
                }
              </span>
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
          
          <div className="flex flex-1 flex-col overflow-hidden p-4">
            <TaskPillSection
              tasks={tasks}
              onToggleTask={onToggleTask}
              className="mb-4"
            />
            <textarea
              ref={textareaRef}
              data-content-editor
              value={localContent}
              onChange={handleContentChange}
              placeholder="Start writing..."
              className="
                h-full w-full flex-1
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
          const dateKey = new Intl.DateTimeFormat('en-CA').format(selectedDate);
          navigate(`/editor?date=${dateKey}`);
        }}
      >
        <div className="min-h-[200px]">
          <div onClick={(e) => e.stopPropagation()}>
            <TaskPillSection
              tasks={tasks}
              onToggleTask={onToggleTask}
              className="mb-4"
            />
          </div>
          {content || photos.length > 0 ? (
            renderContent()
          ) : tasks.length > 0 ? null : (
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
