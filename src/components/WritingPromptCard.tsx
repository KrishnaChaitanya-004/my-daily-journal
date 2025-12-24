import { useState } from 'react';
import { Lightbulb, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useWritingPrompts, WritingPrompt } from '@/hooks/useWritingPrompts';

interface WritingPromptCardProps {
  onInsertPrompt: (text: string) => void;
}

const WritingPromptCard = ({ onInsertPrompt }: WritingPromptCardProps) => {
  const { dailyPrompt, getRandomPrompt, categories, categoryIcons, promptsEnabled } = useWritingPrompts();
  const [currentPrompt, setCurrentPrompt] = useState<WritingPrompt>(dailyPrompt);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<WritingPrompt['category'] | null>(null);

  if (!promptsEnabled) return null;

  const handleNewPrompt = () => {
    const newPrompt = getRandomPrompt(selectedCategory || undefined);
    setCurrentPrompt(newPrompt);
  };

  const handleInsert = () => {
    onInsertPrompt(currentPrompt.text);
  };

  return (
    <div className="mx-4 mb-3">
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20 overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 hover:bg-primary/5 transition-smooth"
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">Writing Prompt</span>
            <span className="text-xs text-muted-foreground">
              {categoryIcons[currentPrompt.category]} {currentPrompt.category}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {/* Prompt Content */}
        <div className={`px-3 pb-3 ${isExpanded ? '' : ''}`}>
          <p className="text-sm text-foreground leading-relaxed mb-3">
            "{currentPrompt.text}"
          </p>

          {/* Categories - show when expanded */}
          {isExpanded && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`
                  px-2 py-1 rounded-full text-xs transition-smooth
                  ${!selectedCategory 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-muted-foreground hover:text-foreground'}
                `}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`
                    px-2 py-1 rounded-full text-xs transition-smooth
                    ${selectedCategory === cat 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-muted-foreground hover:text-foreground'}
                  `}
                >
                  {categoryIcons[cat]} {cat}
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewPrompt}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full text-xs text-muted-foreground hover:text-foreground transition-smooth"
            >
              <RefreshCw className="w-3 h-3" />
              New Prompt
            </button>
            <button
              onClick={handleInsert}
              className="flex-1 px-3 py-1.5 bg-primary/10 rounded-full text-xs text-primary font-medium hover:bg-primary/20 transition-smooth"
            >
              Use This Prompt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WritingPromptCard;
