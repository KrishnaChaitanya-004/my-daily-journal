import { useCallback, useEffect, useState } from 'react';

export type VerseCategory = 'verse' | 'quote' | 'proverb' | 'poem' | 'other';

export interface VerseEntry {
  id: string;
  text: string;
  category: VerseCategory;
  source?: string;
  createdAt: number;
}

const VERSES_KEY = 'diary-verses';

const createVerseId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `verse_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

const loadVerses = (): VerseEntry[] => {
  try {
    const stored = localStorage.getItem(VERSES_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is VerseEntry => {
        return (
          typeof item?.id === 'string' &&
          typeof item?.text === 'string' &&
          typeof item?.category === 'string' &&
          typeof item?.createdAt === 'number'
        );
      })
      .map((item) => ({
        ...item,
        text: item.text.trim(),
        source: typeof item.source === 'string' ? item.source.trim() : undefined,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
};

export const useVerses = () => {
  const [verses, setVerses] = useState<VerseEntry[]>(loadVerses);

  useEffect(() => {
    try {
      localStorage.setItem(VERSES_KEY, JSON.stringify(verses));
    } catch {
      // Ignore write failures (e.g. storage quota/full private mode)
    }
  }, [verses]);

  const addVerse = useCallback(
    ({
      text,
      category,
      source,
    }: {
      text: string;
      category: VerseCategory;
      source?: string;
    }) => {
      const newVerse: VerseEntry = {
        id: createVerseId(),
        text: text.trim(),
        category,
        source: source?.trim() || undefined,
        createdAt: Date.now(),
      };

      setVerses((prev) => [newVerse, ...prev]);
      return newVerse;
    },
    [],
  );

  const deleteVerse = useCallback((id: string) => {
    setVerses((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  return {
    verses,
    addVerse,
    deleteVerse,
  };
};
