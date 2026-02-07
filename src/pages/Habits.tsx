import { useState, useRef, useCallback } from 'react';
import { ArrowLeft, Plus, Trash2, Check, Flame, BarChart2, X, GripVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHabits } from '@/hooks/useHabits';
import { getAllDiaryData, DayFileData } from '@/hooks/useFileStorage';
import { format, subDays } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis } from 'recharts';

const Habits = () => {
  const navigate = useNavigate();
  const { 
    habits, 
    addHabit, 
    deleteHabit, 
    toggleHabitForDate, 
    getHabitCompletions,
    getHabitStats,
    getTodayProgress,
    reorderHabits,
    defaultIcons 
  } = useHabits();

  const [newHabitName, setNewHabitName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎯');
  const [customEmoji, setCustomEmoji] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [graphHabit, setGraphHabit] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  // Drag state for reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to format date consistently (timezone-safe)
  const formatDateKey = (date: Date): string => {
    return new Intl.DateTimeFormat('en-CA').format(date);
  };

  const allData = getAllDiaryData();
  const today = formatDateKey(new Date());

  const handleAddHabit = () => {
    const icon = customEmoji.trim() || selectedIcon;
    if (newHabitName.trim()) {
      addHabit(newHabitName.trim(), icon);
      setNewHabitName('');
      setSelectedIcon('🎯');
      setCustomEmoji('');
      setDialogOpen(false);
    }
  };

  const handleToggle = (habitId: string) => {
    toggleHabitForDate(habitId, today);
    forceUpdate(n => n + 1);
  };

  // Long press handlers for drag-to-reorder
  const handleTouchStart = useCallback((index: number, e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    longPressTimer.current = setTimeout(() => {
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(30);
      setDraggedIndex(index);
      setIsDragging(true);
      // Disable scrolling on the container
      if (containerRef.current) {
        containerRef.current.style.overflow = 'hidden';
      }
      document.body.style.overflow = 'hidden';
    }, 500);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || draggedIndex === null) {
      // Cancel long press if moved too much
      if (longPressTimer.current) {
        const moveY = Math.abs(e.touches[0].clientY - touchStartY.current);
        const moveX = Math.abs(e.touches[0].clientX - touchStartX.current);
        if (moveY > 10 || moveX > 10) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }
      return;
    }

    // Prevent scrolling during drag
    e.preventDefault();

    const touch = e.touches[0];
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    const habitCard = elements.find(el => el.getAttribute('data-habit-index'));
    
    if (habitCard) {
      const targetIndex = parseInt(habitCard.getAttribute('data-habit-index') || '-1');
      if (targetIndex !== -1 && targetIndex !== draggedIndex) {
        // Haptic feedback on swap
        if (navigator.vibrate) navigator.vibrate(10);
        reorderHabits(draggedIndex, targetIndex);
        setDraggedIndex(targetIndex);
      }
    }
  }, [isDragging, draggedIndex, reorderHabits]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (isDragging) {
      // Final haptic feedback
      if (navigator.vibrate) navigator.vibrate(15);
      // Re-enable scrolling
      if (containerRef.current) {
        containerRef.current.style.overflow = '';
      }
      document.body.style.overflow = '';
    }
    setDraggedIndex(null);
    setIsDragging(false);
  }, [isDragging]);

  // Get habit graph data for a specific habit
  const getHabitGraphData = (habitId: string) => {
    const data: { date: string; completed: number }[] = [];
    const todayDate = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = subDays(todayDate, i);
      const dateKey = formatDateKey(date);
      const dayData = allData[dateKey] as DayFileData | undefined;
      const isCompleted = dayData?.habits?.[habitId] ? 1 : 0;
      
      data.push({
        date: format(date, 'MMM d'),
        completed: isCompleted
      });
    }
    
    return data;
  };

  const chartConfig = {
    completed: { label: 'Completed', color: 'hsl(var(--primary))' }
  };

  // Get last 7 days for the week view
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return {
      date,
      dateKey: formatDateKey(date),
      dayName: format(date, 'EEE'),
      dayNum: format(date, 'd')
    };
  });

  const selectedHabit = habits.find(h => h.id === graphHabit);

  return (
    <main className="min-h-screen bg-background max-w-md mx-auto select-none" style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' } as React.CSSProperties}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-muted-foreground hover:text-foreground transition-smooth"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium text-foreground">Habits</h1>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="p-2 text-primary hover:bg-primary/10 rounded-full transition-smooth">
              <Plus className="w-5 h-5" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Add New Habit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Habit name (e.g., Exercise)"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
              />
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Choose an icon</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {defaultIcons.map(icon => (
                    <button
                      key={icon}
                      onClick={() => {
                        setSelectedIcon(icon);
                        setCustomEmoji('');
                      }}
                      className={`
                        w-10 h-10 rounded-lg text-xl flex items-center justify-center
                        transition-smooth border
                        ${selectedIcon === icon && !customEmoji
                          ? 'bg-primary/20 border-primary' 
                          : 'bg-secondary border-transparent hover:bg-secondary/80'}
                      `}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                
                {/* Custom emoji input */}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Or type your own emoji..."
                    value={customEmoji}
                    onChange={(e) => {
                      // Only keep the last emoji character if multiple are pasted
                      const value = e.target.value;
                      const emojis = [...value].filter(char => {
                        const codePoint = char.codePointAt(0) || 0;
                        return codePoint > 127;
                      });
                      setCustomEmoji(emojis.length > 0 ? emojis[emojis.length - 1] : value.slice(-2));
                    }}
                    className="flex-1 text-center text-xl"
                    maxLength={2}
                  />
                  {customEmoji && (
                    <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary flex items-center justify-center text-xl">
                      {customEmoji}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Type or paste any emoji from your keyboard
                </p>
              </div>
              
              <Button onClick={handleAddHabit} className="w-full" disabled={!newHabitName.trim()}>
                Add Habit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div ref={containerRef} className="p-4 space-y-6 overflow-y-auto" style={{ touchAction: isDragging ? 'none' : 'auto' }}>
        {/* Today's Progress */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground">Today's Progress</h3>
            <span className="text-2xl font-bold text-primary">{getTodayProgress.percentage}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${getTodayProgress.percentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {getTodayProgress.completed} of {getTodayProgress.total} habits completed
          </p>
        </div>

        {/* Habits List */}
        {habits.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Flame className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No habits yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start tracking your daily habits to build streaks!
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Habit
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {isDragging && (
              <p className="text-xs text-center text-muted-foreground animate-pulse">
                Drag to reorder habits
              </p>
            )}
            {habits.map((habit, index) => {
              const stats = getHabitStats(habit.id);
              const isCompletedToday = getHabitCompletions(habit.id, today);
              const isBeingDragged = draggedIndex === index;
              
              return (
                <div 
                  key={habit.id} 
                  data-habit-index={index}
                  onTouchStart={(e) => handleTouchStart(index, e)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  style={{ touchAction: isDragging ? 'none' : 'auto' }}
                  className={`
                    bg-card rounded-xl p-4 border border-border
                    transition-transform duration-200 ease-out
                    ${isBeingDragged ? 'scale-[1.02] shadow-lg border-primary z-10 relative' : ''}
                    ${isDragging && !isBeingDragged ? 'opacity-70' : ''}
                  `}
                >
                  {/* Habit Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {isDragging && (
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-2xl">{habit.icon}</span>
                      <div>
                        <h4 className="font-medium text-foreground">{habit.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Flame className="w-3 h-3 text-orange-500" />
                          <span>{stats.streak} day streak</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleToggle(habit.id)}
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        transition-all duration-300 border-2
                        ${isCompletedToday 
                          ? 'bg-primary border-primary text-primary-foreground scale-110' 
                          : 'border-border text-muted-foreground hover:border-primary/50'}
                      `}
                    >
                      <Check className={`w-5 h-5 ${isCompletedToday ? 'scale-100' : 'scale-75 opacity-50'}`} />
                    </button>
                  </div>
                  
                  {/* Week View */}
                  <div className="flex gap-1 mb-3">
                    {last7Days.map(day => {
                      const isCompleted = getHabitCompletions(habit.id, day.dateKey);
                      const isToday = day.dateKey === today;
                      
                      return (
                        <div 
                          key={day.dateKey} 
                          className="flex-1 text-center"
                          onClick={() => {
                            toggleHabitForDate(habit.id, day.dateKey);
                            forceUpdate(n => n + 1);
                          }}
                        >
                          <p className="text-[10px] text-muted-foreground mb-1">{day.dayName}</p>
                          <div 
                            className={`
                              aspect-square rounded-md flex items-center justify-center text-xs font-medium
                              cursor-pointer transition-all
                              ${isCompleted 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}
                              ${isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : ''}
                            `}
                          >
                            {day.dayNum}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                    <span>This week: {stats.last7Days}/7</span>
                    <span>This month: {stats.last30Days}</span>
                    <button
                      onClick={() => setGraphHabit(habit.id)}
                      className="text-primary hover:text-primary/80 p-1"
                      title="View Graph"
                    >
                      <BarChart2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Habit Graph Modal */}
      {graphHabit && selectedHabit && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-4 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedHabit.icon}</span>
                <h3 className="font-medium text-foreground">{selectedHabit.name}</h3>
              </div>
              <button 
                onClick={() => setGraphHabit(null)}
                className="p-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs text-muted-foreground mb-3">Last 30 Days</p>
            
            <div className="h-40">
              <ChartContainer config={chartConfig}>
                <AreaChart data={getHabitGraphData(graphHabit)} margin={{ left: 0, right: 0, top: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="habitGraphGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    fontSize={9} 
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="stepAfter" 
                    dataKey="completed" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1}
                    fill="url(#habitGraphGradient)"
                  />
                </AreaChart>
              </ChartContainer>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="bg-secondary rounded-lg p-2">
                <p className="text-lg font-bold text-foreground">{getHabitStats(graphHabit).streak}</p>
                <p className="text-[10px] text-muted-foreground">Current Streak</p>
              </div>
              <div className="bg-secondary rounded-lg p-2">
                <p className="text-lg font-bold text-foreground">{getHabitStats(graphHabit).last7Days}/7</p>
                <p className="text-[10px] text-muted-foreground">This Week</p>
              </div>
              <div className="bg-secondary rounded-lg p-2">
                <p className="text-lg font-bold text-foreground">{getHabitStats(graphHabit).last30Days}</p>
                <p className="text-[10px] text-muted-foreground">This Month</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Habits;