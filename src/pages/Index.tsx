import { useState, useCallback } from 'react';
import Calendar from '@/components/Calendar';
import DailyContent from '@/components/DailyContent';
import { useDiaryStorage } from '@/hooks/useDiaryStorage';

const Index = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const {
    items,
    addItem,
    updateItem,
    toggleItem,
    deleteItem,
    hasContent
  } = useDiaryStorage(selectedDate);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    if (date.getMonth() !== currentMonth.getMonth() || 
        date.getFullYear() !== currentMonth.getFullYear()) {
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, [currentMonth]);

  return (
    <main className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Calendar Section */}
      <section className="pt-8 pb-4">
        <Calendar
          selectedDate={selectedDate}
          currentMonth={currentMonth}
          onDateSelect={handleDateSelect}
          onMonthChange={setCurrentMonth}
          hasContent={hasContent}
        />
      </section>

      {/* Divider */}
      <div className="h-px bg-border mx-4" />

      {/* Content Section */}
      <section key={selectedDate.toISOString()} className="flex-1 flex flex-col">
        <DailyContent
          items={items}
          onAddItem={addItem}
          onUpdateItem={updateItem}
          onToggleItem={toggleItem}
          onDeleteItem={deleteItem}
        />
      </section>

      {/* Safe area spacer for mobile */}
      <div className="h-8" />
    </main>
  );
};

export default Index;
