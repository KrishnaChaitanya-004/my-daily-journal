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
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  
  const [selectedDate, setSelectedDate] = useState(() => {
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!isNaN(parsed.getTime())) return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
    }
    return new Date();
  });

  // Initialize settings on mount
  useSettings();

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
  const contentRef = useRef(content);
  
  // Keep content ref updated
  useEffect(() => {
    contentRef.current = content;
  }, [content]);
  
  // Register auto-save callback
  useEffect(() => {
    registerSaveCallback(() => {
      if (contentRef.current) {
        saveContent(contentRef.current);
      }
    });
  }, [registerSaveCallback, saveContent]);

  // Update date from URL param
  useEffect(() => {
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!isNaN(parsed.getTime())) {
        setSelectedDate(parsed);
        setCurrentMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
      }
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
      <header className="flex items-center justify-between px-2 pt-3 pb-1 shrink-0">
        <AppMenu />
        <h1 className="text-lg text-foreground">KC's Dairy</h1>
        <button
          onClick={() => toggleBookmark(selectedDate)}
          className={`
            p-2 transition-smooth tap-highlight-none
            ${currentDateBookmarked 
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-foreground'
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
        />
      </section>

      {/* Divider */}
      <div className="h-px bg-border mx-4 shrink-0" />

      {/* Writing Prompt Card */}
      <WritingPromptCard onInsertPrompt={handleInsertPrompt} />

      {/* Content Section - takes remaining space */}
      <section key={selectedDate.toISOString()} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <DailyContent
          content={content}
          photos={photos}
          tags={tags}
          location={location}
          weather={weather}
          voiceNotes={voiceNotes}
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

      {/* Quick Add FAB */}
      <QuickAddFAB
        onAddNote={() => {
          // Trigger edit mode - content area handles this
        }}
        onAddPhoto={handleAddPhoto}
        onAddVoice={handleSaveVoiceNote}
        onAddTask={() => {
          // Could open a quick task dialog
          const task = prompt('Add a task:');
          if (task) addTask(task);
        }}
      />
    </main>
  );
};

export default Index;
