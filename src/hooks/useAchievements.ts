import { useMemo } from 'react';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'streak' | 'entries' | 'habits' | 'photos' | 'starter';
  requirement: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

const STORAGE_KEY = 'diary-app-data';
const HABITS_KEY = 'diary-habits-list';

// Helper to load diary data
const loadDiaryData = (): Record<string, any> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

// Helper to load habits
const loadHabits = (): Array<{ id: string }> => {
  try {
    const data = localStorage.getItem(HABITS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Calculate current streak
const calculateStreak = (data: Record<string, any>): number => {
  const sortedDates = Object.keys(data)
    .filter(key => /^\d{4}-\d{2}-\d{2}$/.test(key))
    .sort()
    .reverse();

  if (sortedDates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Check if streak is active (entry today or yesterday)
  const firstDate = sortedDates[0];
  if (firstDate !== todayStr && firstDate !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let checkDate = firstDate === todayStr ? today : yesterday;

  for (const dateStr of sortedDates) {
    const checkDateStr = checkDate.toISOString().split('T')[0];
    
    if (dateStr === checkDateStr) {
      const entry = data[dateStr];
      if (entry?.content?.trim() || entry?.photos?.length > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    } else if (dateStr < checkDateStr) {
      break;
    }
  }

  return streak;
};

// Calculate total entries with content
const calculateTotalEntries = (data: Record<string, any>): number => {
  return Object.keys(data)
    .filter(key => /^\d{4}-\d{2}-\d{2}$/.test(key))
    .filter(key => {
      const entry = data[key];
      return entry?.content?.trim() || entry?.photos?.length > 0;
    })
    .length;
};

// Calculate total photos
const calculateTotalPhotos = (data: Record<string, any>): number => {
  return Object.keys(data)
    .filter(key => /^\d{4}-\d{2}-\d{2}$/.test(key))
    .reduce((total, key) => {
      const entry = data[key];
      return total + (entry?.photos?.length || 0);
    }, 0);
};

// Calculate total habits completed
const calculateHabitsCompleted = (data: Record<string, any>): number => {
  let total = 0;
  Object.keys(data)
    .filter(key => /^\d{4}-\d{2}-\d{2}$/.test(key))
    .forEach(key => {
      const habits = data[key]?.habits || {};
      total += Object.values(habits).filter(Boolean).length;
    });
  return total;
};

// Check if first entry was made
const hasFirstEntry = (data: Record<string, any>): boolean => {
  return calculateTotalEntries(data) >= 1;
};

// Check if habits exist
const hasCreatedHabit = (): boolean => {
  return loadHabits().length > 0;
};

// Achievement definitions
const ACHIEVEMENTS_CONFIG: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress' | 'maxProgress'>[] = [
  // Starter badges (easy)
  { id: 'first_entry', name: 'First Steps', description: 'Write your first diary entry', icon: '✏️', category: 'starter', requirement: 1 },
  { id: 'first_photo', name: 'Snapshot', description: 'Add your first photo to an entry', icon: '📸', category: 'starter', requirement: 1 },
  { id: 'first_habit', name: 'Habit Builder', description: 'Create your first habit', icon: '🎯', category: 'starter', requirement: 1 },
  
  // Streak badges
  { id: 'streak_3', name: 'Getting Started', description: 'Write for 3 days in a row', icon: '🔥', category: 'streak', requirement: 3 },
  { id: 'streak_7', name: 'Week Warrior', description: 'Write for 7 days in a row', icon: '⚡', category: 'streak', requirement: 7 },
  { id: 'streak_14', name: 'Two Week Champion', description: 'Write for 14 days in a row', icon: '💪', category: 'streak', requirement: 14 },
  { id: 'streak_30', name: 'Monthly Master', description: 'Write for 30 days in a row', icon: '🏆', category: 'streak', requirement: 30 },
  { id: 'streak_100', name: 'Century Streak', description: 'Write for 100 days in a row', icon: '👑', category: 'streak', requirement: 100 },
  { id: 'streak_365', name: 'Year of Writing', description: 'Write for 365 days in a row', icon: '🌟', category: 'streak', requirement: 365 },

  // Entry milestones
  { id: 'entries_10', name: 'Diary Enthusiast', description: 'Write 10 diary entries', icon: '📓', category: 'entries', requirement: 10 },
  { id: 'entries_50', name: 'Dedicated Writer', description: 'Write 50 diary entries', icon: '📚', category: 'entries', requirement: 50 },
  { id: 'entries_100', name: 'Century Club', description: 'Write 100 diary entries', icon: '💯', category: 'entries', requirement: 100 },
  { id: 'entries_365', name: 'Year in Review', description: 'Write 365 diary entries', icon: '📅', category: 'entries', requirement: 365 },
  { id: 'entries_500', name: 'Prolific Journaler', description: 'Write 500 diary entries', icon: '🎖️', category: 'entries', requirement: 500 },
  { id: 'entries_1000', name: 'Legendary Writer', description: 'Write 1000 diary entries', icon: '🏅', category: 'entries', requirement: 1000 },

  // Photo milestones
  { id: 'photos_10', name: 'Memory Keeper', description: 'Add 10 photos to your diary', icon: '🖼️', category: 'photos', requirement: 10 },
  { id: 'photos_50', name: 'Photo Album', description: 'Add 50 photos to your diary', icon: '📷', category: 'photos', requirement: 50 },
  { id: 'photos_100', name: 'Visual Storyteller', description: 'Add 100 photos to your diary', icon: '🎞️', category: 'photos', requirement: 100 },
  { id: 'photos_500', name: 'Gallery Master', description: 'Add 500 photos to your diary', icon: '🎨', category: 'photos', requirement: 500 },

  // Habit milestones
  { id: 'habits_10', name: 'Habit Starter', description: 'Complete 10 habit check-ins', icon: '✅', category: 'habits', requirement: 10 },
  { id: 'habits_50', name: 'Consistency King', description: 'Complete 50 habit check-ins', icon: '🔄', category: 'habits', requirement: 50 },
  { id: 'habits_100', name: 'Habit Hero', description: 'Complete 100 habit check-ins', icon: '⭐', category: 'habits', requirement: 100 },
  { id: 'habits_500', name: 'Discipline Master', description: 'Complete 500 habit check-ins', icon: '💎', category: 'habits', requirement: 500 },
];

export const useAchievements = () => {
  const achievements = useMemo<Achievement[]>(() => {
    const data = loadDiaryData();
    const currentStreak = calculateStreak(data);
    const totalEntries = calculateTotalEntries(data);
    const totalPhotos = calculateTotalPhotos(data);
    const habitsCompleted = calculateHabitsCompleted(data);
    const hasHabit = hasCreatedHabit();

    return ACHIEVEMENTS_CONFIG.map(config => {
      let progress = 0;
      let unlocked = false;

      switch (config.category) {
        case 'starter':
          if (config.id === 'first_entry') {
            progress = Math.min(totalEntries, 1);
            unlocked = totalEntries >= 1;
          } else if (config.id === 'first_photo') {
            progress = Math.min(totalPhotos, 1);
            unlocked = totalPhotos >= 1;
          } else if (config.id === 'first_habit') {
            progress = hasHabit ? 1 : 0;
            unlocked = hasHabit;
          }
          break;
        case 'streak':
          progress = Math.min(currentStreak, config.requirement);
          unlocked = currentStreak >= config.requirement;
          break;
        case 'entries':
          progress = Math.min(totalEntries, config.requirement);
          unlocked = totalEntries >= config.requirement;
          break;
        case 'photos':
          progress = Math.min(totalPhotos, config.requirement);
          unlocked = totalPhotos >= config.requirement;
          break;
        case 'habits':
          progress = Math.min(habitsCompleted, config.requirement);
          unlocked = habitsCompleted >= config.requirement;
          break;
      }

      return {
        ...config,
        unlocked,
        progress,
        maxProgress: config.requirement,
      };
    });
  }, []);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const nextAchievement = achievements.find(a => !a.unlocked);

  const categorizedAchievements = {
    starter: achievements.filter(a => a.category === 'starter'),
    streak: achievements.filter(a => a.category === 'streak'),
    entries: achievements.filter(a => a.category === 'entries'),
    photos: achievements.filter(a => a.category === 'photos'),
    habits: achievements.filter(a => a.category === 'habits'),
  };

  return {
    achievements,
    unlockedCount,
    totalCount,
    nextAchievement,
    categorizedAchievements,
  };
};
