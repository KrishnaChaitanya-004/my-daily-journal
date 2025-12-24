import { ArrowLeft, TrendingUp, Calendar, Image, CheckSquare, Flame, BarChart3, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStatistics } from '@/hooks/useStatistics';
import { useHabits } from '@/hooks/useHabits';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  AreaChart,
  Area
} from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import { getAllDiaryData, DayFileData } from '@/hooks/useFileStorage';

const Statistics = () => {
  const navigate = useNavigate();
  const { dailyStats, weekdayStats, monthlyStats, summary } = useStatistics();
  const { habits, getHabitStats } = useHabits();
  const allData = getAllDiaryData();

  // Format daily stats for chart
  const chartData = dailyStats.map(stat => ({
    date: format(parseISO(stat.date), 'MMM d'),
    words: stat.wordCount,
    photos: stat.photoCount,
    hasEntry: stat.hasEntry ? 1 : 0
  }));

  // Habits consistency data (last 30 days)
  const habitsConsistencyData = (() => {
    const data: { date: string; completed: number; total: number; percentage: number }[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = subDays(today, i);
      const dateKey = date.toISOString().split('T')[0];
      const dayData = allData[dateKey] as DayFileData | undefined;
      
      const completedHabits = habits.filter(h => dayData?.habits?.[h.id]).length;
      const percentage = habits.length > 0 ? Math.round((completedHabits / habits.length) * 100) : 0;
      
      data.push({
        date: format(date, 'MMM d'),
        completed: completedHabits,
        total: habits.length,
        percentage
      });
    }
    
    return data;
  })();

  const chartConfig = {
    words: { label: 'Words', color: 'hsl(var(--primary))' },
    photos: { label: 'Photos', color: 'hsl(var(--accent))' },
    entries: { label: 'Entries', color: 'hsl(var(--primary))' },
    percentage: { label: 'Completion %', color: 'hsl(142, 76%, 36%)' }
  };

  return (
    <main className="min-h-screen bg-background max-w-md mx-auto">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border">
        <button
          onClick={() => navigate('/')}
          className="p-2 text-muted-foreground hover:text-foreground transition-smooth"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-medium text-foreground">Statistics</h1>
      </header>

      <div className="p-4 space-y-4 pb-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-medium">Current Streak</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{summary.currentStreak}</p>
            <p className="text-xs text-muted-foreground">days</p>
          </div>
          
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 text-primary mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Longest Streak</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{summary.longestStreak}</p>
            <p className="text-xs text-muted-foreground">days</p>
          </div>
          
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-medium">Total Entries</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{summary.totalEntries}</p>
            <p className="text-xs text-muted-foreground">diary entries</p>
          </div>
          
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 text-primary mb-2">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs font-medium">Total Words</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{summary.totalWords.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">~{summary.averageWordsPerEntry} avg/entry</p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <div className="flex justify-center text-primary mb-1">
              <Image className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-foreground">{summary.totalPhotos}</p>
            <p className="text-xs text-muted-foreground">Photos</p>
          </div>
          
          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <div className="flex justify-center text-primary mb-1">
              <CheckSquare className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-foreground">{summary.completedTasks}/{summary.totalTasks}</p>
            <p className="text-xs text-muted-foreground">Tasks Done</p>
          </div>
        </div>

        {/* Word Count Chart */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="text-sm font-medium text-foreground mb-4">Words Written (Last 30 Days)</h3>
          <div className="h-48">
            <ChartContainer config={chartConfig}>
              <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="wordGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="words" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1}
                  fill="url(#wordGradient)"
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>

        {/* Habits Consistency Chart */}
        {habits.length > 0 && (
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-medium text-foreground">Habits Consistency (Last 30 Days)</h3>
            </div>
            <div className="h-44">
              <ChartContainer config={chartConfig}>
                <AreaChart data={habitsConsistencyData} margin={{ left: 0, right: 0, top: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="habitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    fontSize={10} 
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="hsl(142, 76%, 36%)" 
                    fillOpacity={1}
                    fill="url(#habitGradient)"
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </div>
        )}

        {/* Most Active Months */}
        {monthlyStats.length > 0 && (
          <div className="bg-card rounded-xl p-4 border border-border overflow-hidden">
            <h3 className="text-sm font-medium text-foreground mb-4">Most Active Months</h3>
            <div className="h-40">
              <ChartContainer config={chartConfig}>
                <BarChart 
                  data={monthlyStats.slice(-6).map(m => ({
                    month: format(parseISO(m.month + '-01'), 'MMM'),
                    entries: m.entries
                  }))} 
                  margin={{ left: 0, right: 0, top: 0, bottom: 20 }}
                >
                  <XAxis 
                    dataKey="month" 
                    fontSize={10} 
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="entries" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        )}

        {/* Monthly Overview */}
        {monthlyStats.length > 0 && (
          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="text-sm font-medium text-foreground mb-4">Monthly Overview</h3>
            <div className="space-y-3">
              {monthlyStats.slice(-4).reverse().map(month => (
                <div key={month.month} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {format(parseISO(month.month + '-01'), 'MMMM yyyy')}
                  </span>
                  <div className="flex gap-4 text-foreground">
                    <span>{month.entries} entries</span>
                    <span>{month.words.toLocaleString()} words</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Statistics;
