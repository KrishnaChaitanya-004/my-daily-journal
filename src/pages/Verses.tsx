import { useState } from 'react';
import { ArrowLeft, Plus, Quote, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useVerses, VerseCategory } from '@/hooks/useVerses';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const categoryOptions: Array<{ value: VerseCategory; label: string }> = [
  { value: 'verse', label: 'Verse' },
  { value: 'quote', label: 'Quote' },
  { value: 'proverb', label: 'Proverb' },
  { value: 'poem', label: 'Poem' },
  { value: 'other', label: 'Other' },
];

const categoryBadgeClasses: Record<VerseCategory, string> = {
  verse: 'bg-primary/15 text-primary border border-primary/25',
  quote: 'bg-secondary text-foreground border border-border',
  proverb: 'bg-primary/10 text-primary border border-primary/20',
  poem: 'bg-secondary/80 text-foreground border border-border',
  other: 'bg-muted text-muted-foreground border border-border',
};

const categoryLabels = categoryOptions.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {} as Record<VerseCategory, string>);

const formatVerseDate = (timestamp: number) => {
  try {
    return format(new Date(timestamp), 'MMM d, yyyy');
  } catch {
    return 'Unknown date';
  }
};

const Verses = () => {
  const navigate = useNavigate();
  const { verses, addVerse, deleteVerse } = useVerses();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [textDraft, setTextDraft] = useState('');
  const [sourceDraft, setSourceDraft] = useState('');
  const [categoryDraft, setCategoryDraft] = useState<VerseCategory>('verse');

  const resetDraft = () => {
    setTextDraft('');
    setSourceDraft('');
    setCategoryDraft('verse');
  };

  const handleSave = () => {
    if (!textDraft.trim()) {
      toast({
        title: 'Text is required',
        description: 'Write a verse, quote, proverb, or poem before saving.',
        variant: 'destructive',
      });
      return;
    }

    addVerse({
      text: textDraft,
      category: categoryDraft,
      source: sourceDraft,
    });

    toast({
      title: 'Saved',
      description: 'Added to your Verses collection.',
    });

    resetDraft();
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteVerse(id);
    toast({
      title: 'Removed',
      description: 'Entry deleted from Verses.',
    });
  };

  return (
    <main className="h-screen bg-background max-w-md mx-auto flex flex-col overflow-hidden relative">
      <header className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border bg-background/95 backdrop-blur-sm">
        <button
          onClick={() => navigate('/')}
          className="p-2 text-muted-foreground hover:text-foreground transition-smooth tap-highlight-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Verses</h1>
          <p className="text-xs text-muted-foreground">Your favorite verses, quotes, proverbs, and poems</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        {verses.length === 0 ? (
          <div className="h-full flex items-center justify-center fade-in">
            <p className="text-sm text-muted-foreground text-center">
              start writing ur first verse
            </p>
          </div>
        ) : (
          <div className="space-y-4 fade-in">
            {verses.map((entry) => (
              <article
                key={entry.id}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${categoryBadgeClasses[entry.category]}`}
                    >
                      {categoryLabels[entry.category]}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate">{formatVerseDate(entry.createdAt)}</span>
                  </div>

                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-smooth"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-start gap-2">
                  <Quote className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-[15px] leading-6 text-foreground whitespace-pre-wrap">
                    {entry.text}
                  </p>
                </div>

                {entry.source && (
                  <p className="mt-3 text-sm text-muted-foreground italic">- {entry.source}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setDialogOpen(true)}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border border-primary/30
          bg-primary text-primary-foreground shadow-lg flex items-center justify-center
          transition-transform duration-200 active:scale-95 hover:scale-[1.03]"
        aria-label="Add verse"
      >
        <Plus className="w-8 h-8 stroke-[2.5]" />
      </button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Verses</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCategoryDraft(option.value)}
                    className={`
                      px-3 py-1.5 rounded-full text-xs font-medium border transition-smooth
                      ${categoryDraft === option.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary text-foreground border-border hover:bg-secondary/80'}
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground mb-2">Text</p>
              <Textarea
                value={textDraft}
                onChange={(e) => setTextDraft(e.target.value)}
                placeholder="Write your favorite verse, quote, proverb, or poem..."
                className="min-h-[140px] resize-none"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-foreground mb-2">Author / Source (optional)</p>
              <Input
                value={sourceDraft}
                onChange={(e) => setSourceDraft(e.target.value)}
                placeholder="e.g., Proverbs 3:5 or Maya Angelou"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={handleSave}
                disabled={!textDraft.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Verses;
