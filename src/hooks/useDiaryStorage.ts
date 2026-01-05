import { useState, useCallback, useEffect } from 'react';
import { widgetsBridge } from '@/lib/widgetsBridge';

export interface DayData {
  content: string;
}

const STORAGE_KEY = 'diary-app-data';

const formatDateKey = (date: Date): string => {
  return date.toISOString().split('T')[0];
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

      // Check if it's new format (has content string)
      if (typeof oldData.content === 'string') {
        migrated[key] = oldData as DayData;
      } else if (oldData.items) {
        // Migrate from items array format
        const lines: string[] = [];
        oldData.items.forEach((item: any) => {
          if (item.type === 'task') {
            const checkbox = item.completed ? '✓' : '□';
            lines.push(`${checkbox} ${item.text}`);
          } else {
            lines.push(item.text);
          }
        });
        migrated[key] = { content: lines.join('\n') };
      } else {
        // Migrate very old format (diary/todos)
        const lines: string[] = [];
        if (oldData.diary) {
          lines.push(oldData.diary);
        }
        if (oldData.todos && Array.isArray(oldData.todos)) {
          oldData.todos.forEach((todo: any) => {
            const checkbox = todo.completed ? '✓' : '□';
            lines.push(`${checkbox} ${todo.text}`);
          });
        }
        migrated[key] = { content: lines.join('\n') };
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

const makeSnippet = (content: string): string => {
  const trimmed = (content || '').trim();
  if (!trimmed) return '';
  const oneLine = trimmed.replace(/\s+/g, ' ');
  return oneLine.length > 80 ? oneLine.slice(0, 80) + '…' : oneLine;
};

export const useDiaryStorage = (selectedDate: Date) => {
  const [allData, setAllData] = useState<Record<string, DayData>>(loadAllData);

  const dateKey = formatDateKey(selectedDate);
  const dayData = allData[dateKey] || { content: '' };

  const updateContent = useCallback((content: string) => {
    setAllData(prev => {
      const updated = { ...prev, [dateKey]: { content } };
      saveAllData(updated);
      return updated;
    });
  }, [dateKey]);

  // Push today's content snippet into widgets (so they update immediately)
  useEffect(() => {
    const todayKey = formatDateKey(new Date());
    if (dateKey !== todayKey) return;
    widgetsBridge.setTodaySnippet(dateKey, makeSnippet(dayData.content));
  }, [dateKey, dayData.content]);

  const addTask = useCallback((taskText: string) => {
    const taskLine = `□ ${taskText}`;
    const newContent = dayData.content
      ? `${dayData.content}\n${taskLine}`
      : taskLine;
    updateContent(newContent);
  }, [dayData.content, updateContent]);

  const toggleTask = useCallback((lineIndex: number) => {
    const lines = dayData.content.split('\n');
    const line = lines[lineIndex];

    if (line.startsWith('□ ')) {
      lines[lineIndex] = '✓ ' + line.slice(2);
    } else if (line.startsWith('✓ ')) {
      lines[lineIndex] = '□ ' + line.slice(2);
    }

    updateContent(lines.join('\n'));
  }, [dayData.content, updateContent]);

  const hasContent = useCallback((date: Date): boolean => {
    const key = formatDateKey(date);
    const data = allData[key];
    return data?.content?.trim().length > 0;
  }, [allData]);

  return {
    content: dayData.content,
    updateContent,
    addTask,
    toggleTask,
    hasContent
  };
};
