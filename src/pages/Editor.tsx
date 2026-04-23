import { useState, useRef, useEffect, ChangeEvent, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Image, Clock, Mic, Square, X, Pause, Play, Trash2 } from "lucide-react";
import {
  Camera as CapacitorCamera,
  CameraResultType,
  CameraSource,
} from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { format } from "date-fns";
import MediaMenu from "@/components/MediaMenu";
import TaskPillSection from "@/components/TaskPillSection";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useFileStorage, VoiceNoteData } from "@/hooks/useFileStorage";
import { useTags } from "@/hooks/useTags";
import { useTasks } from "@/hooks/useTasks";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { toast } from "sonner";

const appendPhotoMarker = (rawContent: string, filename: string) => {
  const photoLine = `[photo:${filename}]`;
  return rawContent ? `${rawContent}\n${photoLine}` : photoLine;
};

const normalizeTag = (value: string) => {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
};

const Editor = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date");

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
  const dateKey = new Intl.DateTimeFormat("en-CA").format(selectedDate);
  const indexPath = `/?date=${dateKey}`;

  const {
    content,
    tags,
    voiceNotes,
    saveContent,
    saveDayMeta,
    savePhoto,
    saveVoiceNote,
    deleteVoiceNote,
  } = useFileStorage(selectedDate);
  const { allTags } = useTags();
  const {
    tasksForSelectedDate,
    createTaskForDate,
    toggleTask,
  } = useTasks(selectedDate);

  const [localContent, setLocalContent] = useState(content);
  const [taskText, setTaskText] = useState("");
  const [mediaMenuOpen, setMediaMenuOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const localContentRef = useRef(localContent);
  const previousDateKeyRef = useRef(dateKey);
  const hasUnsavedChanges = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    isRecording,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
    formatDuration,
  } = useVoiceRecorder();

  useEffect(() => {
    localContentRef.current = localContent;
  }, [localContent]);

  useEffect(() => {
    hasUnsavedChanges.current = localContent !== content;
  }, [content, localContent]);

  useEffect(() => {
    const dateChanged = previousDateKeyRef.current !== dateKey;
    previousDateKeyRef.current = dateKey;

    if (dateChanged || !hasUnsavedChanges.current) {
      setLocalContent(content);
      hasUnsavedChanges.current = false;
    }
  }, [content, dateKey]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const performSave = useCallback(async (): Promise<boolean> => {
    if (isSaving) return false;

    try {
      setIsSaving(true);
      await saveContent(localContentRef.current);
      hasUnsavedChanges.current = false;
      return true;
    } catch (error) {
      console.error("Save failed:", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, saveContent]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backHandler = CapacitorApp.addListener("backButton", async () => {
      if (hasUnsavedChanges.current) {
        await performSave();
        toast.success("Saved");
      }
      navigate(indexPath, { replace: true });
    });

    return () => {
      backHandler.then((h) => h.remove());
    };
  }, [indexPath, navigate, performSave]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "hidden" && hasUnsavedChanges.current) {
        await performSave();
      }
    };

    const handlePageHide = async () => {
      if (hasUnsavedChanges.current) {
        await performSave();
      }
    };

    const handleBeforeUnload = () => {
      if (hasUnsavedChanges.current) {
        saveContent(localContentRef.current);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [performSave, saveContent]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (hasUnsavedChanges.current) {
        await performSave();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [performSave]);

  const handleSave = async () => {
    const success = await performSave();
    if (success) {
      toast.success("Saved successfully");
    }
    navigate(indexPath, { replace: true });
  };

  const handleCancel = async () => {
    if (hasUnsavedChanges.current) {
      await performSave();
      toast.success("Saved");
    }
    navigate(indexPath, { replace: true });
  };

  const handleAddTask = () => {
    if (!taskText.trim()) return;
    createTaskForDate(taskText.trim(), selectedDate);
    setTaskText("");
    toast.success("Task added to this day");
  };

  const handleInsertTime = () => {
    const currentTime = format(new Date(), "hh:mm a").toLowerCase();
    const timeText = `${currentTime}: `;

    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent =
        localContent.slice(0, start) + timeText + localContent.slice(end);
      setLocalContent(newContent);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd =
          start + timeText.length;
        textarea.focus();
      }, 0);
    } else {
      setLocalContent((prev) => (prev ? `${prev}\n${timeText}` : timeText));
    }
  };

  const fileToBase64 = useCallback((file: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const savePhotoBatch = useCallback(
    async (photosBase64: string[]) => {
      for (const base64 of photosBase64) {
        const createdPhoto = await savePhoto(base64);
        if (createdPhoto) {
          const nextContent = appendPhotoMarker(localContentRef.current, createdPhoto.filename);
          localContentRef.current = nextContent;
          setLocalContent(nextContent);
        }
      }

      await saveContent(localContentRef.current);
      hasUnsavedChanges.current = false;
    },
    [saveContent, savePhoto]
  );

  const handleSelectGallery = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const picked = await CapacitorCamera.pickImages({
          quality: 80,
        });

        const base64Photos: string[] = [];
        for (const photo of picked.photos || []) {
          if (!photo.webPath) continue;
          const response = await fetch(photo.webPath);
          const blob = await response.blob();
          base64Photos.push(await fileToBase64(blob));
        }

        if (base64Photos.length > 0) {
          await savePhotoBatch(base64Photos);
          toast.success(
            base64Photos.length === 1
              ? "1 photo added"
              : `${base64Photos.length} photos added`
          );
        }
      } catch (e) {
        console.error("gallery error:", e);
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
          source: CameraSource.Camera,
        });

        if (image.base64String) {
          await savePhotoBatch([image.base64String]);
          toast.success("1 photo added");
        }
      } catch (e) {
        console.error("Camera error:", e);
      }
    } else {
      cameraInputRef.current?.click();
    }
  };

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const base64Photos = await Promise.all(files.map((file) => fileToBase64(file)));
    await savePhotoBatch(base64Photos);
    toast.success(
      files.length === 1 ? "1 photo added" : `${files.length} photos added`
    );
    e.target.value = "";
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

  const handlePlayVoice = (note: VoiceNoteData) => {
    if (playingVoice === note.filename) {
      audioRef.current?.pause();
      setPlayingVoice(null);
      setPlaybackTime(0);
      return;
    }

    audioRef.current?.pause();
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
  };

  const handleDeleteVoiceNoteFromEntry = async (filename: string) => {
    if (playingVoice === filename) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingVoice(null);
      setPlaybackTime(0);
    }

    await deleteVoiceNote(filename);
    toast.success("Voice note removed");
  };

  const handleRemoveTag = async (tag: string) => {
    await saveDayMeta({ tags: tags.filter((currentTag) => currentTag !== tag) });
  };

  const handleAttachTag = async (tag: string) => {
    if (tags.includes(tag)) return;
    await saveDayMeta({ tags: [...tags, tag] });
    setTagDialogOpen(false);
  };

  const handleCreateTag = async () => {
    const normalizedTag = normalizeTag(newTagInput);

    if (!normalizedTag) {
      toast.error("Enter a valid tag name");
      return;
    }

    if (tags.includes(normalizedTag)) {
      toast.error("That tag is already on this entry");
      return;
    }

    await saveDayMeta({ tags: [...tags, normalizedTag] });
    setNewTagInput("");
    setTagDialogOpen(false);
  };

  return (
    <main className="h-screen bg-background flex flex-col max-w-md mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
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

      <MediaMenu
        isOpen={mediaMenuOpen}
        onClose={() => setMediaMenuOpen(false)}
        onSelectGallery={handleSelectGallery}
        onSelectCamera={handleSelectCamera}
      />

      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>Manage tags</DialogTitle>
            <DialogDescription>
              Add an existing tag or create a new one for this diary entry.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Existing tags</p>
              {allTags.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No saved tags yet. Create the first one below.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => {
                    const alreadySelected = tags.includes(tag);

                    return (
                      <button
                        key={tag}
                        onClick={() => void handleAttachTag(tag)}
                        disabled={alreadySelected}
                        className={`
                          rounded-full px-3 py-1.5 text-xs font-medium transition-smooth
                          ${alreadySelected
                            ? "bg-primary/10 text-primary/60"
                            : "bg-secondary text-foreground hover:bg-secondary/80"}
                        `}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Create tag</label>
              <Input
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void handleCreateTag();
                  }
                }}
                placeholder="gratitude"
              />
              <p className="text-xs text-muted-foreground">
                Tags are saved in lowercase without spaces or special symbols.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setTagDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => void handleCreateTag()} disabled={!normalizeTag(newTagInput)}>
              Add tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <header className="flex items-center justify-between p-4 border-b border-border shrink-0">
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="p-2 text-muted-foreground hover:text-foreground transition-smooth tap-highlight-none disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="text-sm text-muted-foreground">
          {format(selectedDate, "MMM d, yyyy")}
          {isSaving && " • Saving..."}
        </span>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="p-2 text-primary hover:bg-primary/10 rounded-full transition-smooth disabled:opacity-50"
        >
          <Check className="w-5 h-5" />
        </button>
      </header>

      {isRecording ? (
        <div className="flex items-center gap-3 mx-4 mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
          <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
          <span className="text-sm text-destructive font-medium">
            Recording... {formatDuration(duration)}
          </span>
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
      ) : null}

      <div className="flex flex-1 flex-col overflow-hidden p-4">
        <TaskPillSection
          tasks={tasksForSelectedDate}
          onToggleTask={toggleTask}
          className="mb-4"
        />

        {(tags.length > 0 || voiceNotes.length > 0) ? (
          <div className="mb-4 flex flex-wrap items-center gap-2 shrink-0">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => void handleRemoveTag(tag)}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-smooth hover:bg-primary/15"
              >
                <span>#{tag}</span>
                <X className="h-3 w-3" />
              </button>
            ))}

            {voiceNotes.map((note) => (
              <div
                key={note.filename}
                className="inline-flex items-center gap-2.5 rounded-full border border-foreground/15 bg-foreground/10 px-3 py-2 text-foreground"
              >
                <button
                  onClick={() => handlePlayVoice(note)}
                  className="text-foreground/80 transition-smooth hover:text-foreground"
                >
                  {playingVoice === note.filename ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </button>
                <span className="text-sm font-medium text-foreground font-mono tabular-nums">
                  {playingVoice === note.filename
                    ? `${formatDuration(playbackTime)} / ${formatDuration(note.duration)}`
                    : formatDuration(note.duration)}
                </span>
                <button
                  onClick={() => void handleDeleteVoiceNoteFromEntry(note.filename)}
                  className="text-foreground/75 transition-smooth hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          placeholder="Start writing..."
          className="h-full w-full flex-1 bg-transparent text-foreground text-sm font-light placeholder:text-muted-foreground/60 focus:outline-none resize-none leading-snug"
          autoFocus
          onFocus={(e) => {
            const len = e.target.value.length;
            e.target.setSelectionRange(len, len);
          }}
        />
      </div>

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
          className={`p-1.5 transition-smooth tap-highlight-none ${
            isRecording
              ? "text-destructive"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          {isRecording ? (
            <Square className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={() => setTagDialogOpen(true)}
          title="Manage tags"
          className="p-1.5 text-muted-foreground hover:text-primary transition-smooth tap-highlight-none"
        >
          <span className="block text-base font-semibold leading-none">#</span>
        </button>

        <input
          type="text"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && taskText.trim()) {
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
