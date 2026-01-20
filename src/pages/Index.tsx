import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import Calendar from '@/components/Calendar';
import DailyContent from '@/components/DailyContent';
import AppMenu from '@/components/AppMenu';
import QuickAddFAB from '@/components/QuickAddFAB';
import WritingPromptCard from '@/components/WritingPromptCard';
import { useFileStorage, LocationData, WeatherData } from '@/hooks/useFileStorage';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useSettings } from '@/hooks/useSettings';
import { useAutoSave } from '@/hooks/useAutoSave';

const Index = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');

  const parseDateParam = (value: string | null): Date | null => {
    if (!value) return null;

    // Expect yyyy-MM-dd; parse as *local* date to avoid timezone shifting on Android
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]) - 1;
      const d = Number(m[3]);
      const local = new Date(y, mo, d);
      if (!isNaN(local.getTime())) return local;
      return null;
    }

    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed;
    return null;
  };

  const initialDate = parseDateParam(dateParam) ?? new Date();

  const [selectedDate, setSelectedDate] = useState(() => initialDate);
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );

  // Initialize settings on mount
  const { settings, updateSetting } = useSettings();
  const isCalendarVisible = settings.showCalendar !== false;

  const {
    content,
    photos,
    tags,
    location,
    weather,
    voiceNotes,
    saveContent,
    saveDayMeta,
    savePhoto,
    saveVoiceNote,
    deleteVoiceNote,
    deletePhoto,
    getPhotoUrl,
    hasContent
  } = useFileStorage(selectedDate);

  const { isBookmarked, toggleBookmark } = useBookmarks();

  // Auto-save when app goes to background
  const { registerSaveCallback } = useAutoSave();

  // Swipe navigation state
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Register auto-save callback - this saves the latest content from the hook
  // The actual editor saves on close, this is a fallback for when app goes to background
  useEffect(() => {
    registerSaveCallback(() => {
      // Content from useFileStorage is already the saved state
      // This callback is now mainly for ensuring localStorage is flushed
      // The DailyContent component handles its own save on background
    });
  }, [registerSaveCallback]);

  // Update date from URL param
  useEffect(() => {
    const parsed = parseDateParam(dateParam);
    if (parsed) {
      setSelectedDate(parsed);
      setCurrentMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    }
  }, [dateParam]);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    if (date.getMonth() !== currentMonth.getMonth() ||
        date.getFullYear() !== currentMonth.getFullYear()) {
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, [currentMonth]);

  const handleMonthChange = useCallback((newMonth: Date) => {
    const currentDay = selectedDate.getDate();
    const year = newMonth.getFullYear();
    const month = newMonth.getMonth();

    const lastDayOfNewMonth = new Date(year, month + 1, 0).getDate();
    const newDay = Math.min(currentDay, lastDayOfNewMonth);

    const newSelectedDate = new Date(year, month, newDay);
    setSelectedDate(newSelectedDate);
    setCurrentMonth(newMonth);
  }, [selectedDate]);

  const shiftSelectedDate = useCallback((deltaDays: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + deltaDays);
    handleDateSelect(next);
  }, [selectedDate, handleDateSelect]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (isEditing) return;
    const t = e.touches[0];
    if (!t) return;
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }, [isEditing]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isEditing) return;
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;

    const t = e.changedTouches[0];
    if (!t) return;

    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Vertical swipe for calendar collapse/expand (must be strong vertical swipe)
    if (absDy > 800 && absDy > absDx * 2) {
      // Swipe up => collapse calendar, swipe down => expand calendar
      if (dy < 0 && isCalendarVisible) {
        updateSetting('showCalendar', false);
      } else if (dy > 0 && !isCalendarVisible) {
        updateSetting('showCalendar', true);
      }
      return;
    }

    // Horizontal swipe for day navigation
    if (absDx < 60) return;
    if (absDx < absDy * 1.3) return;

    // Swipe left => next day, swipe right => previous day
    if (dx < 0) shiftSelectedDate(1);
    else shiftSelectedDate(-1);
  }, [isEditing, shiftSelectedDate, isCalendarVisible, updateSetting]);

  const addTask = useCallback((taskText: string) => {
    const taskLine = `□ ${taskText}`;
    const newContent = content
      ? `${content}\n${taskLine}`
      : taskLine;
    saveContent(newContent);
  }, [content, saveContent]);

  const toggleTask = useCallback((lineIndex: number) => {
    const lines = content.split('\n');
    const line = lines[lineIndex];

    if (line.startsWith('□ ')) {
      lines[lineIndex] = '✓ ' + line.slice(2);
    } else if (line.startsWith('✓ ')) {
      lines[lineIndex] = '□ ' + line.slice(2);
    }

    saveContent(lines.join('\n'));
  }, [content, saveContent]);

  const handleAddPhoto = useCallback(async (base64: string) => {
    await savePhoto(base64);
  }, [savePhoto]);

  const handleSaveMeta = useCallback((meta: { tags?: string[]; location?: LocationData; weather?: WeatherData }) => {
    saveDayMeta(meta);
  }, [saveDayMeta]);

  const handleSaveVoiceNote = useCallback(async (base64: string, duration: number) => {
    await saveVoiceNote(base64, duration);
  }, [saveVoiceNote]);

  const handleInsertPrompt = useCallback((promptText: string) => {
    const newContent = content
      ? `${content}\n\n${promptText}\n`
      : `${promptText}\n`;
    saveContent(newContent);
  }, [content, saveContent]);

  const currentDateBookmarked = isBookmarked(selectedDate);

  return (
    <main className="h-screen bg-background flex flex-col max-w-md mx-auto overflow-hidden">
      {/* Top bar with hamburger, app name, and bookmark */}
      <header className="flex items-center justify-between px-3 pt-4 pb-2 shrink-0">
        <AppMenu />
        <h1
          className="text-lg font-semibold"
          style={{ color: settings.fontColor || '#ededed' }}
        >
          KC's Diary
        </h1>
        <button
          onClick={() => toggleBookmark(selectedDate)}
          className={`
            p-2.5 transition-smooth tap-highlight-none rounded-xl
            ${currentDateBookmarked
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }
          `}
          title={currentDateBookmarked ? 'Remove bookmark' : 'Bookmark this day'}
        >
          <Bookmark
            className={`w-5 h-5 ${currentDateBookmarked ? 'fill-primary' : ''}`}
          />
        </button>
      </header>

      {/* Calendar Section - compact */}
      <section className="pb-1 shrink-0">
        <Calendar
          selectedDate={selectedDate}
          currentMonth={currentMonth}
          onDateSelect={handleDateSelect}
          onMonthChange={handleMonthChange}
          hasContent={hasContent}
          isBookmarked={isBookmarked}
          collapsed={!isCalendarVisible}
          onToggleCollapsed={() =>
            updateSetting('showCalendar', !isCalendarVisible)
          }
        />

      </section>

      {/* Divider */}
      <div className="h-px bg-border mx-4 shrink-0" />

      {/* Writing Prompt Card */}
      {settings.showWritingPrompts && (
        <WritingPromptCard onInsertPrompt={handleInsertPrompt} />
      )}

      {/* Content Section - takes remaining space */}
      <section
        key={selectedDate.toISOString()}
        className="flex-1 flex flex-col min-h-0 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <DailyContent
          content={content}
          photos={photos}
          tags={tags}
          location={location}
          weather={weather}
          voiceNotes={voiceNotes}
          isEditing={isEditing}
          selectedDate={selectedDate}
          onEditingChange={setIsEditing}
          onUpdateContent={saveContent}
          onAddTask={addTask}
          onToggleTask={toggleTask}
          onAddPhoto={handleAddPhoto}
          onDeletePhoto={deletePhoto}
          onSaveMeta={handleSaveMeta}
          onSaveVoiceNote={handleSaveVoiceNote}
          onDeleteVoiceNote={deleteVoiceNote}
          getPhotoUrl={getPhotoUrl}
        />
      </section>

      {/* Bottom Divider */}
      <div className="h-px bg-border mx-4 shrink-0" />

      {/* Safe area spacer for mobile */}
      <div className="h-4 shrink-0" />

      {/* Quick Add FAB - hidden when editing */}
      {!isEditing && (
        <QuickAddFAB
          onAddNote={() => {
            setIsEditing(true);
          }}
          onAddVoice={handleSaveVoiceNote}
          onAddTask={() => {
            const task = prompt('Add a task:');
            if (task) addTask(task);
          }}
        />
      )}
    </main>
  );
};

export default Index;
