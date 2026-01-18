import { useState, useRef, useEffect, ChangeEvent, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Image, Clock, Mic, Square, X } from "lucide-react";
import {
  Camera as CapacitorCamera,
  CameraResultType,
  CameraSource,
} from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { format } from "date-fns";
import { useFileStorage } from "@/hooks/useFileStorage";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import MediaMenu from "@/components/MediaMenu";
import { toast } from "sonner";

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
  // Keep date in the URL when returning to Index so it shows the same day you edited
  const dateKey = new Intl.DateTimeFormat("en-CA").format(selectedDate); // yyyy-MM-dd
  const indexPath = `/?date=${dateKey}`;

  const { content, saveContent, savePhoto, saveVoiceNote } =
    useFileStorage(selectedDate);

  const [localContent, setLocalContent] = useState(content);
  const [taskText, setTaskText] = useState("");
  const [mediaMenuOpen, setMediaMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const localContentRef = useRef(localContent);
  const hasUnsavedChanges = useRef(false);

  const {
    isRecording,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
    formatDuration,
  } = useVoiceRecorder();

  // Keep ref in sync with state
  useEffect(() => {
    localContentRef.current = localContent;
  }, [localContent]);

  // Track unsaved changes
  useEffect(() => {
    hasUnsavedChanges.current = localContent !== content;
  }, [localContent, content]);

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  // Save function that returns a promise
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
  }, [saveContent, isSaving]);

  // Android back button handler - SAVES before navigating
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backHandler = CapacitorApp.addListener("backButton", async () => {
      if (hasUnsavedChanges.current) {
        await performSave();
        toast.success("Saved");
      }
      // Navigate back to the same date so Index reflects the updated text immediately
      navigate(indexPath, { replace: true });
    });

    return () => {
      backHandler.then((h) => h.remove());
    };
  }, [performSave, navigate, indexPath]);

  // Auto-save when app goes to background
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
        // Sync save for beforeunload
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

  // Periodic auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (hasUnsavedChanges.current) {
        await performSave();
        // Silent save - no toast for periodic saves
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
    // Save before leaving if there are changes
    if (hasUnsavedChanges.current) {
      await performSave();
      toast.success("Saved");
    }
    navigate(indexPath, { replace: true });
  };

  const handleAddTask = () => {
    if (!taskText.trim()) return;
    const taskLine = `□ ${taskText.trim()}`;
    const newContent = localContent ? `${localContent}\n${taskLine}` : taskLine;
    setLocalContent(newContent);
    setTaskText("");
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

  const handleSelectGallery = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const image = await CapacitorCamera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Photos,
        });

        if (image.base64String) {
          await savePhoto(image.base64String);
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
          await savePhoto(image.base64String);
        }
      } catch (e) {
        console.error("Camera error:", e);
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
      const base64 = (reader.result as string).split(",")[1];
      await savePhoto(base64);
    };
    reader.readAsDataURL(file);
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

      {/* Recording Indicator */}
      {isRecording && (
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
