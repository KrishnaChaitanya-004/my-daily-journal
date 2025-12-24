import { useState, useCallback } from 'react';
import Calendar from '@/components/Calendar';
import DailyContent from '@/components/DailyContent';
import { useFileStorage } from '@/hooks/useFileStorage';

const Index = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const {
    content,
    photos,
    saveContent,
    savePhoto,
    deletePhoto,
    getPhotoUrl,
    hasContent
  } = useFileStorage(selectedDate);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    if (date.getMonth() !== currentMonth.getMonth() || 
        date.getFullYear() !== currentMonth.getFullYear()) {
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, [currentMonth]);

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

  return (
    <main className="h-screen bg-background flex flex-col max-w-md mx-auto overflow-hidden">
      {/* Calendar Section - compact */}
      <section className="pt-4 pb-1 shrink-0">
        <Calendar
          selectedDate={selectedDate}
          currentMonth={currentMonth}
          onDateSelect={handleDateSelect}
          onMonthChange={setCurrentMonth}
          hasContent={hasContent}
        />
      </section>

      {/* Divider */}
      <div className="h-px bg-border mx-4 shrink-0" />

      {/* Content Section - takes remaining space ~65% */}
      <section key={selectedDate.toISOString()} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <DailyContent
          content={content}
          photos={photos}
          onUpdateContent={saveContent}
          onAddTask={addTask}
          onToggleTask={toggleTask}
          onAddPhoto={handleAddPhoto}
          onDeletePhoto={deletePhoto}
          getPhotoUrl={getPhotoUrl}
        />
      </section>

      {/* Safe area spacer for mobile */}
      <div className="h-4 shrink-0" />
    </main>
  );
};

export default Index;
