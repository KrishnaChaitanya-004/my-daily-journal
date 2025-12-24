import { ArrowLeft, TrendingUp, Calendar, Image, CheckSquare, Flame, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStatistics } from '@/hooks/useStatistics';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  LineChart, 
  Line, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format, parseISO } from 'date-fns';

const Statistics = () => {
  const navigate = useNavigate();
  const { dailyStats, weekdayStats, monthlyStats, summary } = useStatistics();

  // Format daily stats for chart
  const chartData = dailyStats.map(stat => ({
    date: format(parseISO(stat.date), 'MMM d'),
    words: stat.wordCount,
    photos: stat.photoCount,
    hasEntry: stat.hasEntry ? 1 : 0
  }));

  const chartConfig = {
    words: { label: 'Words', color: 'hsl(var(--primary))' },
    photos: { label: 'Photos', color: 'hsl(var(--accent))' },
    entries: { label: 'Entries', color: 'hsl(var(--primary))' }
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

      <div className="p-4 space-y-6">
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
        <div className="flex gap-3">
          <div className="flex-1 bg-card rounded-xl p-4 border border-border text-center">
            <div className="flex justify-center text-primary mb-1">
              <Image className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-foreground">{summary.totalPhotos}</p>
            <p className="text-xs text-muted-foreground">Photos</p>
          </div>
          
          <div className="flex-1 bg-card rounded-xl p-4 border border-border text-center">
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
          <div className="h-40">
            <ChartContainer config={chartConfig}>
              <AreaChart data={chartData}>
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

        {/* Most Active Days */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="text-sm font-medium text-foreground mb-4">Most Active Days</h3>
          <div className="h-32">
            <ChartContainer config={chartConfig}>
              <BarChart data={weekdayStats}>
                <XAxis 
                  dataKey="day" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
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
