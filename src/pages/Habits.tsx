import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Check, Flame, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHabits } from '@/hooks/useHabits';
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
    defaultIcons 
  } = useHabits();

  const [newHabitName, setNewHabitName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎯');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [, forceUpdate] = useState(0);

  const today = new Date().toISOString().split('T')[0];

  const handleAddHabit = () => {
    if (newHabitName.trim()) {
      addHabit(newHabitName.trim(), selectedIcon);
      setNewHabitName('');
      setSelectedIcon('🎯');
      setDialogOpen(false);
    }
  };

  const handleToggle = (habitId: string) => {
    toggleHabitForDate(habitId, today);
    forceUpdate(n => n + 1);
  };

  // Get last 7 days for the week view
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return {
      date,
      dateKey: date.toISOString().split('T')[0],
      dayName: format(date, 'EEE'),
      dayNum: format(date, 'd')
    };
  });

  return (
    <main className="min-h-screen bg-background max-w-md mx-auto">
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
                <div className="flex flex-wrap gap-2">
                  {defaultIcons.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setSelectedIcon(icon)}
                      className={`
                        w-10 h-10 rounded-lg text-xl flex items-center justify-center
                        transition-smooth border
                        ${selectedIcon === icon 
                          ? 'bg-primary/20 border-primary' 
                          : 'bg-secondary border-transparent hover:bg-secondary/80'}
                      `}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              
              <Button onClick={handleAddHabit} className="w-full" disabled={!newHabitName.trim()}>
                Add Habit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="p-4 space-y-6">
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
            {habits.map(habit => {
              const stats = getHabitStats(habit.id);
              const isCompletedToday = getHabitCompletions(habit.id, today);
              
              return (
                <div key={habit.id} className="bg-card rounded-xl p-4 border border-border">
                  {/* Habit Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
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
                  <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                    <span>This week: {stats.last7Days}/7</span>
                    <span>This month: {stats.last30Days}</span>
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
    </main>
  );
};

export default Habits;
