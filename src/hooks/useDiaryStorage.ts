import { useState, useCallback } from 'react';

export interface ContentItem {
  id: string;
  type: 'note' | 'task';
  text: string;
  completed?: boolean;
}

export interface DayData {
  items: ContentItem[];
}

const STORAGE_KEY = 'diary-app-data';

const formatDateKey = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const loadAllData = (): Record<string, DayData> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return {};
    
    const parsed = JSON.parse(data);
    
    // Migrate old format to new format
    const migrated: Record<string, DayData> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const oldData = value as any;
      
      // Check if it's old format (has diary/todos) or new format (has items)
      if (oldData.items) {
        migrated[key] = oldData as DayData;
      } else {
        // Migrate old format
        const items: ContentItem[] = [];
        
        // Convert diary text to note items (split by lines)
        if (oldData.diary) {
          const lines = oldData.diary.split('\n').filter((line: string) => line.trim());
          lines.forEach((line: string) => {
            items.push({
              id: generateId(),
              type: 'note',
              text: line.trim()
            });
          });
        }
        
        // Convert todos to task items
        if (oldData.todos && Array.isArray(oldData.todos)) {
          oldData.todos.forEach((todo: any) => {
            items.push({
              id: todo.id || generateId(),
              type: 'task',
              text: todo.text,
              completed: todo.completed
            });
          });
        }
        
        migrated[key] = { items };
      }
    }
    
    return migrated;
  } catch {
    return {};
  }
};

const saveAllData = (data: Record<string, DayData>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const useDiaryStorage = (selectedDate: Date) => {
  const [allData, setAllData] = useState<Record<string, DayData>>(loadAllData);
  
  const dateKey = formatDateKey(selectedDate);
  const dayData = allData[dateKey] || { items: [] };

  const updateDayData = useCallback((newDayData: DayData) => {
    setAllData(prev => {
      const updated = { ...prev, [dateKey]: newDayData };
      saveAllData(updated);
      return updated;
    });
  }, [dateKey]);

  const addItem = useCallback((text: string, type: 'note' | 'task') => {
    const newItem: ContentItem = {
      id: generateId(),
      type,
      text,
      ...(type === 'task' ? { completed: false } : {})
    };
    updateDayData({ items: [...dayData.items, newItem] });
  }, [dayData.items, updateDayData]);

  const updateItem = useCallback((id: string, text: string) => {
    updateDayData({
      items: dayData.items.map(item =>
        item.id === id ? { ...item, text } : item
      )
    });
  }, [dayData.items, updateDayData]);

  const toggleItem = useCallback((id: string) => {
    updateDayData({
      items: dayData.items.map(item =>
        item.id === id && item.type === 'task'
          ? { ...item, completed: !item.completed }
          : item
      )
    });
  }, [dayData.items, updateDayData]);

  const deleteItem = useCallback((id: string) => {
    updateDayData({
      items: dayData.items.filter(item => item.id !== id)
    });
  }, [dayData.items, updateDayData]);

  const hasContent = useCallback((date: Date): boolean => {
    const key = formatDateKey(date);
    const data = allData[key];
    return data?.items?.length > 0;
  }, [allData]);

  return {
    items: dayData.items,
    addItem,
    updateItem,
    toggleItem,
    deleteItem,
    hasContent
  };
};
