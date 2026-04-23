import { useState, useRef, useCallback, useMemo } from 'react';
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
    setHabitsOrder,
    defaultIcons 
  } = useHabits();

  const [newHabitName, setNewHabitName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎯');
  const [customEmoji, setCustomEmoji] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [graphHabit, setGraphHabit] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  // Drag state for reordering
  const [draggedHabitId, setDraggedHabitId] = useState<string | null>(null);
  const [draftOrder, setDraftOrder] = useState<string[] | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);
  const dragPointerOffsetY = useRef<number>(0);
  const activeTouchId = useRef<number | null>(null);
  const draftOrderRef = useRef<string[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const orderedHabits = useMemo(() => {
    if (!draftOrder) return habits;

    const habitsById = new Map(habits.map((habit) => [habit.id, habit]));
    return draftOrder
      .map((habitId) => habitsById.get(habitId))
      .filter((habit): habit is typeof habits[number] => Boolean(habit));
  }, [draftOrder, habits]);

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
  const setCardRef = useCallback((habitId: string, node: HTMLDivElement | null) => {
    cardRefs.current[habitId] = node;
  }, []);

  const moveHabitId = useCallback((habitIds: string[], fromIndex: number, toIndex: number) => {
    const nextHabitIds = [...habitIds];
    const [removed] = nextHabitIds.splice(fromIndex, 1);

    if (!removed) return habitIds;

    nextHabitIds.splice(toIndex, 0, removed);
    return nextHabitIds;
  }, []);

  const handleDragHandleTouchStart = useCallback((habitId: string, e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    if (!touch) return;

    const cardRect = cardRefs.current[habitId]?.getBoundingClientRect();
    touchStartY.current = touch.clientY;
    touchStartX.current = touch.clientX;
    dragPointerOffsetY.current = cardRect ? touch.clientY - cardRect.top : 0;
    activeTouchId.current = touch.identifier;

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    longPressTimer.current = setTimeout(() => {
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(30);
      const baseOrder = habits.map((habit) => habit.id);
      draftOrderRef.current = baseOrder;
      setDraftOrder(baseOrder);
      setDraggedHabitId(habitId);
      setDragOffset(0);
      setIsDragging(true);
      // Disable scrolling on the container
      if (containerRef.current) {
        containerRef.current.style.overflow = 'hidden';
      }
      document.body.style.overflow = 'hidden';
    }, 260);
  }, [habits]);

  const findTouch = useCallback((touches: React.TouchList) => {
    const activeId = activeTouchId.current;
    if (activeId === null) return touches[0];

    return Array.from(touches).find((touch) => touch.identifier === activeId) || touches[0];
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = findTouch(e.touches);
    if (!touch) return;

    if (!isDragging || !draggedHabitId) {
      // Cancel long press if moved too much
      if (longPressTimer.current) {
        const moveY = Math.abs(touch.clientY - touchStartY.current);
        const moveX = Math.abs(touch.clientX - touchStartX.current);
        if (moveY > 10 || moveX > 10) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }
      return;
    }

    // Prevent scrolling during drag
    e.preventDefault();
    e.stopPropagation();

    const draggedCard = cardRefs.current[draggedHabitId];
    const draggedRect = draggedCard?.getBoundingClientRect();
    if (draggedRect) {
      setDragOffset(touch.clientY - dragPointerOffsetY.current - draggedRect.top);
    }

    const currentOrder = draftOrderRef.current ?? orderedHabits.map((habit) => habit.id);
    const currentIndex = currentOrder.indexOf(draggedHabitId);
    if (currentIndex === -1) return;

    let targetIndex = currentOrder.length - 1;
    for (let index = 0; index < currentOrder.length; index++) {
      const habitId = currentOrder[index];
      if (habitId === draggedHabitId) continue;

      const card = cardRefs.current[habitId];
      if (!card) continue;

      const rect = card.getBoundingClientRect();
      if (touch.clientY < rect.top + rect.height / 2) {
        targetIndex = index;
        break;
      }
    }

    if (targetIndex !== currentIndex) {
      if (navigator.vibrate) navigator.vibrate(10);

      const targetRect = cardRefs.current[currentOrder[targetIndex]]?.getBoundingClientRect();
      const nextOrder = moveHabitId(currentOrder, currentIndex, targetIndex);

      draftOrderRef.current = nextOrder;
      setDraftOrder(nextOrder);

      if (draggedRect && targetRect) {
        setDragOffset((prev) => prev - (targetRect.top - draggedRect.top));
      }
    }
  }, [draggedHabitId, findTouch, isDragging, moveHabitId, orderedHabits]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (isDragging) {
      // Final haptic feedback
      if (navigator.vibrate) navigator.vibrate(15);
      if (draftOrderRef.current) {
        setHabitsOrder(draftOrderRef.current);
      }
      // Re-enable scrolling
      if (containerRef.current) {
        containerRef.current.style.overflow = '';
      }
      document.body.style.overflow = '';
    }
    draftOrderRef.current = null;
    setDraftOrder(null);
    setDraggedHabitId(null);
    setDragOffset(0);
    setIsDragging(false);
    activeTouchId.current = null;
  }, [isDragging, setHabitsOrder]);

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

      <div
        ref={containerRef}
        className="p-4 space-y-6 overflow-y-auto"
        style={{ touchAction: isDragging ? 'none' : 'pan-y' }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
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
            {habits.length > 1 && (
              <div className="rounded-2xl border border-dashed border-border bg-secondary/30 px-3 py-2.5">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <GripVertical className="w-4 h-4" />
                  Press and hold the grip to smoothly reorder your habits.
                </p>
              </div>
            )}
            {orderedHabits.map((habit) => {
              const stats = getHabitStats(habit.id);
              const isCompletedToday = getHabitCompletions(habit.id, today);
              const isBeingDragged = draggedHabitId === habit.id;
              
              return (
                <div 
                  key={habit.id} 
                  ref={(node) => setCardRef(habit.id, node)}
                  style={{
                    touchAction: isDragging ? 'none' : 'auto',
                    transform: isBeingDragged ? `translate3d(0, ${dragOffset}px, 0) scale(1.02)` : undefined,
                    willChange: isBeingDragged ? 'transform' : undefined,
                  }}
                  className={`
                    rounded-[28px] border p-4 ease-out
                    ${isBeingDragged ? 'relative z-10 border-primary/40 bg-background shadow-2xl' : 'border-border bg-card shadow-sm'}
                    ${isBeingDragged ? 'transition-none' : 'transition-[transform,box-shadow,opacity,border-color] duration-200'}
                    ${isDragging && !isBeingDragged ? 'opacity-75' : ''}
                  `}
                  aria-grabbed={isBeingDragged}
                  role="listitem"
                >
                  {/* Habit Header */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onTouchStart={(e) => handleDragHandleTouchStart(habit.id, e)}
                        className={`
                          flex h-10 w-10 items-center justify-center rounded-2xl border transition-smooth
                          ${isBeingDragged
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-border bg-secondary/50 text-muted-foreground'}
                        `}
                        title="Hold to reorder"
                      >
                        <GripVertical className="w-4 h-4" />
                      </button>
                      <span className="text-2xl">{habit.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{habit.name}</p>
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
                  <div className="mb-3 flex gap-1">
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
                          <p className="mb-1 text-xs text-muted-foreground">{day.dayName}</p>
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
                  <div className="flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
                    <span>This week: {stats.last7Days}/7</span>
                    <span>This month: {stats.last30Days}</span>
                    <button
                      onClick={() => setGraphHabit(habit.id)}
                      className="p-1 text-primary hover:text-primary/80"
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
                <h3 className="text-sm font-medium text-foreground">{selectedHabit.name}</h3>
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
                <p className="text-xs text-muted-foreground">Current Streak</p>
              </div>
              <div className="bg-secondary rounded-lg p-2">
                <p className="text-lg font-bold text-foreground">{getHabitStats(graphHabit).last7Days}/7</p>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
              <div className="bg-secondary rounded-lg p-2">
                <p className="text-lg font-bold text-foreground">{getHabitStats(graphHabit).last30Days}</p>
                <p className="text-xs text-muted-foreground">This Month</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Habits;
