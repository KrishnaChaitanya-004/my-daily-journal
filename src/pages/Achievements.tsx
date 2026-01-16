import { ArrowLeft, Trophy, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAchievements, Achievement } from '@/hooks/useAchievements';
import { Progress } from '@/components/ui/progress';

const categoryLabels: Record<string, { label: string; icon: string }> = {
  starter: { label: 'Getting Started', icon: '🌱' },
  streak: { label: 'Writing Streaks', icon: '🔥' },
  entries: { label: 'Entry Milestones', icon: '📝' },
  photos: { label: 'Photo Collection', icon: '📸' },
  habits: { label: 'Habit Tracking', icon: '✅' },
};

const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
  const progressPercent = (achievement.progress / achievement.maxProgress) * 100;
  
  return (
    <div
      className={`
        relative p-4 rounded-xl border transition-all duration-300
        ${achievement.unlocked
          ? 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30 shadow-lg'
          : 'bg-card/50 border-border/50 opacity-75'
        }
      `}
    >
      {/* Badge icon */}
      <div className="flex items-start gap-3">
        <div
          className={`
            w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0
            ${achievement.unlocked
              ? 'bg-primary/20'
              : 'bg-muted/50'
            }
          `}
        >
          {achievement.unlocked ? achievement.icon : <Lock className="w-5 h-5 text-muted-foreground" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-sm ${achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
            {achievement.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {achievement.description}
          </p>
          
          {/* Progress bar for locked achievements */}
          {!achievement.unlocked && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{achievement.progress} / {achievement.maxProgress}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </div>
          )}
        </div>

        {/* Unlocked indicator */}
        {achievement.unlocked && (
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Trophy className="w-3 h-3 text-primary-foreground" />
          </div>
        )}
      </div>
    </div>
  );
};

const Achievements = () => {
  const navigate = useNavigate();
  const { categorizedAchievements, unlockedCount, totalCount, nextAchievement } = useAchievements();

  return (
    <main className="h-screen bg-background flex flex-col max-w-md mx-auto overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 p-4 border-b border-border shrink-0">
        <button
          onClick={() => navigate('/')}
          className="p-2 text-muted-foreground hover:text-foreground transition-smooth tap-highlight-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-medium text-foreground">Achievements</h1>
          <p className="text-xs text-muted-foreground">{unlockedCount} of {totalCount} unlocked</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-primary" />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Progress summary */}
        <section className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-primary/20 p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-3xl">
              🏆
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-foreground">Your Progress</h2>
              <p className="text-sm text-muted-foreground">
                {unlockedCount === 0
                  ? "Start writing to unlock achievements!"
                  : `Great job! Keep going!`
                }
              </p>
              <div className="mt-2">
                <Progress value={(unlockedCount / totalCount) * 100} className="h-2" />
              </div>
            </div>
          </div>
          
          {nextAchievement && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Next achievement:</p>
              <div className="flex items-center gap-2">
                <span className="text-lg">{nextAchievement.icon}</span>
                <span className="text-sm font-medium text-foreground">{nextAchievement.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {nextAchievement.progress}/{nextAchievement.maxProgress}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Achievement categories */}
        {Object.entries(categorizedAchievements).map(([category, achievements]) => (
          <section key={category}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{categoryLabels[category]?.icon}</span>
              <h2 className="text-sm font-semibold text-foreground">
                {categoryLabels[category]?.label}
              </h2>
              <span className="text-xs text-muted-foreground ml-auto">
                {achievements.filter(a => a.unlocked).length}/{achievements.length}
              </span>
            </div>
            <div className="space-y-3">
              {achievements.map(achievement => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
};

export default Achievements;
