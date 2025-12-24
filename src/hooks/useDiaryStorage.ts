import { useState, useEffect, useCallback } from 'react';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export interface DayData {
  diary: string;
  todos: Todo[];
}

const STORAGE_KEY = 'diary-app-data';

const getStorageData = (): Record<string, DayData> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

const setStorageData = (data: Record<string, DayData>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const formatDateKey = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const useDiaryStorage = (selectedDate: Date) => {
  const dateKey = formatDateKey(selectedDate);
  const [dayData, setDayData] = useState<DayData>({ diary: '', todos: [] });
  const [allData, setAllData] = useState<Record<string, DayData>>({});

  // Load all data on mount
  useEffect(() => {
    const data = getStorageData();
    setAllData(data);
  }, []);

  // Load data for selected date
  useEffect(() => {
    const data = getStorageData();
    setAllData(data);
    setDayData(data[dateKey] || { diary: '', todos: [] });
  }, [dateKey]);

  const saveDiary = useCallback((text: string) => {
    const data = getStorageData();
    const currentDayData = data[dateKey] || { diary: '', todos: [] };
    const newDayData = { ...currentDayData, diary: text };
    
    if (text === '' && newDayData.todos.length === 0) {
      delete data[dateKey];
    } else {
      data[dateKey] = newDayData;
    }
    
    setStorageData(data);
    setDayData(newDayData);
    setAllData(data);
  }, [dateKey]);

  const addTodo = useCallback((text: string) => {
    if (!text.trim()) return;
    
    const data = getStorageData();
    const currentDayData = data[dateKey] || { diary: '', todos: [] };
    const newTodo: Todo = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
    };
    const newDayData = {
      ...currentDayData,
      todos: [...currentDayData.todos, newTodo],
    };
    
    data[dateKey] = newDayData;
    setStorageData(data);
    setDayData(newDayData);
    setAllData(data);
  }, [dateKey]);

  const toggleTodo = useCallback((id: string) => {
    const data = getStorageData();
    const currentDayData = data[dateKey] || { diary: '', todos: [] };
    const newTodos = currentDayData.todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    const newDayData = { ...currentDayData, todos: newTodos };
    
    data[dateKey] = newDayData;
    setStorageData(data);
    setDayData(newDayData);
    setAllData(data);
  }, [dateKey]);

  const deleteTodo = useCallback((id: string) => {
    const data = getStorageData();
    const currentDayData = data[dateKey] || { diary: '', todos: [] };
    const newTodos = currentDayData.todos.filter(todo => todo.id !== id);
    const newDayData = { ...currentDayData, todos: newTodos };
    
    if (newDayData.diary === '' && newTodos.length === 0) {
      delete data[dateKey];
    } else {
      data[dateKey] = newDayData;
    }
    
    setStorageData(data);
    setDayData(newDayData);
    setAllData(data);
  }, [dateKey]);

  const hasContent = useCallback((date: Date): boolean => {
    const key = formatDateKey(date);
    const data = allData[key];
    return !!(data && (data.diary.trim() || data.todos.length > 0));
  }, [allData]);

  return {
    diary: dayData.diary,
    todos: dayData.todos,
    saveDiary,
    addTodo,
    toggleTodo,
    deleteTodo,
    hasContent,
  };
};
