import { useState, useMemo, useCallback } from 'react';

export interface WritingPrompt {
  id: number;
  category: 'gratitude' | 'reflection' | 'creative' | 'questions' | 'goals';
  text: string;
}

const writingPrompts: WritingPrompt[] = [
  // Gratitude
  { id: 1, category: 'gratitude', text: 'What are three things you\'re grateful for today?' },
  { id: 2, category: 'gratitude', text: 'Who made you smile today and why?' },
  { id: 3, category: 'gratitude', text: 'What small moment brought you joy today?' },
  { id: 4, category: 'gratitude', text: 'What\'s something you often take for granted?' },
  { id: 5, category: 'gratitude', text: 'Describe a recent act of kindness you witnessed or received.' },
  { id: 6, category: 'gratitude', text: 'What skill or ability are you thankful to have?' },
  { id: 7, category: 'gratitude', text: 'What\'s your favorite thing about your home?' },
  { id: 8, category: 'gratitude', text: 'Who has positively influenced your life recently?' },
  { id: 9, category: 'gratitude', text: 'What technology are you most grateful for?' },
  { id: 10, category: 'gratitude', text: 'What simple pleasure did you enjoy today?' },
  
  // Reflection
  { id: 11, category: 'reflection', text: 'What did you learn about yourself today?' },
  { id: 12, category: 'reflection', text: 'How have you grown in the past year?' },
  { id: 13, category: 'reflection', text: 'What challenge did you overcome recently?' },
  { id: 14, category: 'reflection', text: 'Describe your current emotional state in detail.' },
  { id: 15, category: 'reflection', text: 'What would your younger self think of you now?' },
  { id: 16, category: 'reflection', text: 'What habit would you like to change and why?' },
  { id: 17, category: 'reflection', text: 'What\'s weighing on your mind lately?' },
  { id: 18, category: 'reflection', text: 'How did you handle stress today?' },
  { id: 19, category: 'reflection', text: 'What\'s a belief you\'ve changed recently?' },
  { id: 20, category: 'reflection', text: 'What does success mean to you right now?' },
  
  // Creative
  { id: 21, category: 'creative', text: 'If you could live anywhere, where would it be and why?' },
  { id: 22, category: 'creative', text: 'Describe your perfect day from start to finish.' },
  { id: 23, category: 'creative', text: 'What would you do if you knew you couldn\'t fail?' },
  { id: 24, category: 'creative', text: 'Write a letter to your future self, one year from now.' },
  { id: 25, category: 'creative', text: 'If you could have dinner with anyone, who and why?' },
  { id: 26, category: 'creative', text: 'Describe a memory that feels like a movie scene.' },
  { id: 27, category: 'creative', text: 'What superpower would you want and how would you use it?' },
  { id: 28, category: 'creative', text: 'Write about a dream you remember vividly.' },
  { id: 29, category: 'creative', text: 'Create a bucket list of 10 experiences you want.' },
  { id: 30, category: 'creative', text: 'Describe the view from your window, make it poetic.' },
  
  // Questions
  { id: 31, category: 'questions', text: 'What are you avoiding that you should face?' },
  { id: 32, category: 'questions', text: 'What would you do differently if you could restart today?' },
  { id: 33, category: 'questions', text: 'What does happiness look like to you?' },
  { id: 34, category: 'questions', text: 'What are you most afraid of and why?' },
  { id: 35, category: 'questions', text: 'What would you tell yourself 5 years ago?' },
  { id: 36, category: 'questions', text: 'What makes you feel most alive?' },
  { id: 37, category: 'questions', text: 'What do you need more of in your life?' },
  { id: 38, category: 'questions', text: 'What legacy do you want to leave behind?' },
  { id: 39, category: 'questions', text: 'Who do you need to forgive, including yourself?' },
  { id: 40, category: 'questions', text: 'What are you pretending not to know?' },
  
  // Goals
  { id: 41, category: 'goals', text: 'What\'s one thing you want to accomplish this week?' },
  { id: 42, category: 'goals', text: 'What skills do you want to develop this year?' },
  { id: 43, category: 'goals', text: 'Where do you see yourself in 5 years?' },
  { id: 44, category: 'goals', text: 'What steps can you take today toward your biggest goal?' },
  { id: 45, category: 'goals', text: 'What\'s holding you back from your dreams?' },
  { id: 46, category: 'goals', text: 'What would you do if money wasn\'t a concern?' },
  { id: 47, category: 'goals', text: 'What new thing do you want to try this month?' },
  { id: 48, category: 'goals', text: 'How can you be kinder to yourself tomorrow?' },
  { id: 49, category: 'goals', text: 'What relationship do you want to improve and how?' },
  { id: 50, category: 'goals', text: 'What would make today a success?' }
];

const PROMPT_SETTINGS_KEY = 'diary-prompts-settings';

export const useWritingPrompts = () => {
  const [promptsEnabled, setPromptsEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem(PROMPT_SETTINGS_KEY);
      return saved ? JSON.parse(saved).enabled !== false : true;
    } catch {
      return true;
    }
  });

  const getDailyPrompt = useMemo(() => {
    // Use date as seed for consistent daily prompt
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const index = seed % writingPrompts.length;
    return writingPrompts[index];
  }, []);

  const getRandomPrompt = useCallback((category?: WritingPrompt['category']): WritingPrompt => {
    const filtered = category 
      ? writingPrompts.filter(p => p.category === category)
      : writingPrompts;
    const index = Math.floor(Math.random() * filtered.length);
    return filtered[index];
  }, []);

  const getPromptsByCategory = useCallback((category: WritingPrompt['category']): WritingPrompt[] => {
    return writingPrompts.filter(p => p.category === category);
  }, []);

  const togglePrompts = useCallback((enabled: boolean) => {
    setPromptsEnabled(enabled);
    localStorage.setItem(PROMPT_SETTINGS_KEY, JSON.stringify({ enabled }));
  }, []);

  const categories: WritingPrompt['category'][] = ['gratitude', 'reflection', 'creative', 'questions', 'goals'];

  const categoryIcons: Record<WritingPrompt['category'], string> = {
    gratitude: '🙏',
    reflection: '🪞',
    creative: '✨',
    questions: '❓',
    goals: '🎯'
  };

  return {
    dailyPrompt: getDailyPrompt,
    getRandomPrompt,
    getPromptsByCategory,
    categories,
    categoryIcons,
    promptsEnabled,
    togglePrompts
  };
};
