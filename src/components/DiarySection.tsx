import { useEffect, useState, useRef } from 'react';

interface DiarySectionProps {
  diary: string;
  onSave: (text: string) => void;
}

const DiarySection = ({ diary, onSave }: DiarySectionProps) => {
  const [text, setText] = useState(diary);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with prop changes (when date changes)
  useEffect(() => {
    setText(diary);
  }, [diary]);

  const handleChange = (value: string) => {
    setText(value);
    
    // Debounced auto-save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      onSave(value);
    }, 500);
  };

  return (
    <div className="w-full animate-fade-in">
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Write something here..."
        className="
          w-full min-h-[180px] p-4
          bg-transparent text-foreground
          placeholder:text-muted-foreground/60
          font-light text-base leading-relaxed
          border-b border-border
          resize-none focus:outline-none
          transition-smooth
        "
      />
    </div>
  );
};

export default DiarySection;
