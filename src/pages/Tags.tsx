import { ArrowLeft, Tag, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTags } from '@/hooks/useTags';
import { format, parseISO } from 'date-fns';

const Tags = () => {
  const navigate = useNavigate();
  const { allTags, tagCounts, getEntriesByTag } = useTags();

  const handleTagClick = (tag: string) => {
    const entries = getEntriesByTag(tag);
    if (entries.length > 0) {
      navigate(`/?date=${entries[0]}`);
    }
  };

  // Sort tags by count
  const sortedTags = [...allTags].sort((a, b) => (tagCounts[b] || 0) - (tagCounts[a] || 0));

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
        <h1 className="text-lg font-medium text-foreground">Tags</h1>
      </header>

      <div className="p-4">
        {sortedTags.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No tags yet</h3>
            <p className="text-sm text-muted-foreground">
              Add tags to your diary entries to organize them better!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Tag Cloud */}
            <div className="flex flex-wrap gap-2 mb-6">
              {sortedTags.slice(0, 10).map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className="
                    px-3 py-1.5 rounded-full bg-primary/10 text-primary 
                    text-sm font-medium hover:bg-primary/20 transition-smooth
                    flex items-center gap-1
                  "
                >
                  <Hash className="w-3 h-3" />
                  {tag}
                  <span className="text-xs opacity-70">({tagCounts[tag]})</span>
                </button>
              ))}
            </div>

            {/* Tag List with Entries */}
            {sortedTags.map(tag => {
              const entries = getEntriesByTag(tag);
              
              return (
                <div key={tag} className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-primary" />
                      <h3 className="font-medium text-foreground">{tag}</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {tagCounts[tag]} {tagCounts[tag] === 1 ? 'entry' : 'entries'}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {entries.slice(0, 5).map(dateKey => (
                      <button
                        key={dateKey}
                        onClick={() => navigate(`/?date=${dateKey}`)}
                        className="
                          px-2 py-1 text-xs bg-secondary rounded-md
                          text-muted-foreground hover:text-foreground
                          hover:bg-secondary/80 transition-smooth
                        "
                      >
                        {format(parseISO(dateKey), 'MMM d, yyyy')}
                      </button>
                    ))}
                    {entries.length > 5 && (
                      <span className="px-2 py-1 text-xs text-muted-foreground">
                        +{entries.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default Tags;
