import { ChevronLeft, ChevronRight, Bookmark, ChevronDown, ChevronUp } from 'lucide-react';
import { useMemo } from 'react';

interface CalendarProps {
  selectedDate: Date;
  currentMonth: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  hasContent: (date: Date) => boolean;
  isBookmarked?: (date: Date) => boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

const DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const Calendar = ({
  selectedDate,
  currentMonth,
  onDateSelect,
  onMonthChange,
  hasContent,
  isBookmarked,
  collapsed = false,
  onToggleCollapsed,
}: CalendarProps) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get day of week (0 = Sunday, 6 = Saturday)
    // We want Saturday first, so adjust
    const startDayOfWeek = firstDay.getDay();
    // Convert to Saturday-first (Sat=0, Sun=1, Mon=2, etc.)
    const adjustedStartDay = (startDayOfWeek + 1) % 7;
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before the first of the month
    for (let i = 0; i < adjustedStartDay; i++) {
      const prevDate = new Date(year, month, -adjustedStartDay + i + 1);
      days.push(prevDate);
    }
    
    // Add days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    // Fill remaining slots with next month's days
    const remainingSlots = 42 - days.length; // 6 rows × 7 days
    for (let i = 1; i <= remainingSlots; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  }, [currentMonth]);

  const formatDateHeader = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    return `${day}.${month}.${year} ${weekday}`;
  };

  const goToPrevMonth = () => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  return (
    <div className="w-full px-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          onClick={goToPrevMonth}
          className="p-2 text-muted-foreground hover:text-foreground transition-smooth tap-highlight-none rounded-lg hover:bg-secondary"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-xs text-muted-foreground font-normal tracking-wide">
          {formatDateHeader(selectedDate)}
        </span>

        <div className="flex items-center gap-1">
          {onToggleCollapsed && (
            <button
              onClick={onToggleCollapsed}
              className="p-2 text-muted-foreground hover:text-foreground transition-smooth tap-highlight-none rounded-lg hover:bg-secondary"
              title={collapsed ? 'Show calendar' : 'Hide calendar'}
            >
              {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={goToNextMonth}
            className="p-2 text-muted-foreground hover:text-foreground transition-smooth tap-highlight-none rounded-lg hover:bg-secondary"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Days of week */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((day) => (
              <div
                key={day}
                className="text-center text-[10px] text-muted-foreground font-medium uppercase tracking-wider py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid - with more spacing */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {calendarDays.map((date, index) => {
              if (!date) return <div key={index} />;

              const dateIsToday = isToday(date);
              const dateIsSelected = isSelected(date);
              const dateInCurrentMonth = isCurrentMonth(date);
              const dateHasContent = hasContent(date);
              const dateIsBookmarked = isBookmarked?.(date);

              return (
                <button
                  key={index}
                  onClick={() => onDateSelect(date)}
                  className={`
                    relative flex items-center justify-center py-1.5 text-xs font-normal
                    transition-smooth tap-highlight-none
                    ${!dateInCurrentMonth ? 'text-muted-foreground/40' : 'text-foreground'}
                    ${dateIsSelected && !dateIsToday ? 'text-foreground' : ''}
                  `}
                >
                  <span
                    className={`
                      relative z-10 w-7 h-7 flex items-center justify-center rounded-full
                      transition-smooth
                      ${dateIsToday ? 'ring-2 ring-primary text-primary font-medium' : ''}
                      ${dateIsSelected && !dateIsToday ? 'bg-[hsl(var(--calendar-selection))]' : ''}
                      ${dateInCurrentMonth ? 'hover:bg-secondary/50' : ''}
                    `}
                  >
                    {date.getDate()}
                  </span>

                  {/* Bookmark indicator */}
                  {dateIsBookmarked && (
                    <Bookmark className="absolute top-0 right-0.5 w-2.5 h-2.5 text-primary fill-primary" />
                  )}

                  {/* Content indicator dot */}
                  {dateHasContent && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Calendar;
