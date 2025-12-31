import { useState, useRef } from 'react';
import { ArrowLeft, Play, Pause, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const STORAGE_KEY = 'diary-app-data';

interface VoiceNoteWithDate {
  filename: string;
  duration: number;
  timestamp: number;
  base64?: string;
  dateKey: string;
}

const VoiceNotes = () => {
  const navigate = useNavigate();
  const [playingNote, setPlayingNote] = useState<string | null>(null);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getAllVoiceNotes = (): VoiceNoteWithDate[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      const voiceNotes: VoiceNoteWithDate[] = [];
      
      for (const [dateKey, dayData] of Object.entries(parsed)) {
        const notes = (dayData as any)?.voiceNotes || [];
        notes.forEach((note: any) => {
          voiceNotes.push({ ...note, dateKey });
        });
      }
      
      // Sort by timestamp (newest first)
      voiceNotes.sort((a, b) => b.timestamp - a.timestamp);
      
      return voiceNotes;
    } catch {
      return [];
    }
  };

  const allVoiceNotes = getAllVoiceNotes();

  const formatDate = (dateKey: string) => {
    try {
      return format(new Date(dateKey), 'MMM d, yyyy');
    } catch {
      return dateKey;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = (note: VoiceNoteWithDate) => {
    if (playingNote === note.filename) {
      audioRef.current?.pause();
      setPlayingNote(null);
      setPlaybackTime(0);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      if (note.base64) {
        const audio = new Audio(`data:audio/webm;base64,${note.base64}`);
        audio.onended = () => {
          setPlayingNote(null);
          setPlaybackTime(0);
        };
        audio.ontimeupdate = () => {
          setPlaybackTime(audio.currentTime);
        };
        audio.play();
        audioRef.current = audio;
        setPlayingNote(note.filename);
        setPlaybackTime(0);
      }
    }
  };

  const handleNoteClick = (dateKey: string) => {
    navigate(`/?date=${dateKey}`);
  };

  return (
    <main className="h-screen bg-background flex flex-col max-w-md mx-auto overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 p-4 border-b border-border shrink-0">
        <button
          onClick={() => navigate('/')}
          className="p-2 text-muted-foreground hover:text-foreground transition-smooth tap-highlight-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-medium text-foreground">Voice Notes</h1>
      </header>

      {/* Voice notes list */}
      <div className="flex-1 overflow-y-auto p-4">
        {allVoiceNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Mic className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No voice notes yet</p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Voice notes you record will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {allVoiceNotes.map((note, index) => (
              <div
                key={`${note.filename}-${index}`}
                className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border"
              >
                <button
                  onClick={() => handlePlay(note)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0
                    ${playingNote === note.filename 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-primary/10 text-primary'
                    }`}
                >
                  {playingNote === note.filename ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground font-mono">
                    {playingNote === note.filename 
                      ? `${formatDuration(playbackTime)} / ${formatDuration(note.duration)}`
                      : formatDuration(note.duration)
                    }
                  </p>
                  <button
                    onClick={() => handleNoteClick(note.dateKey)}
                    className="text-xs text-primary hover:underline"
                  >
                    {formatDate(note.dateKey)}
                  </button>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {format(new Date(note.timestamp), 'h:mm a')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default VoiceNotes;
