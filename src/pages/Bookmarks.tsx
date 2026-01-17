import { ArrowLeft, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBookmarks } from '@/hooks/useBookmarks';
import { format } from 'date-fns';

// Helper to format date consistently (timezone-safe)
const formatDateKey = (date: Date): string => {
  return new Intl.DateTimeFormat('en-CA').format(date);
};

const Bookmarks = () => {
  const navigate = useNavigate();
  const { getBookmarkedDates } = useBookmarks();
  const bookmarkedDates = getBookmarkedDates();

  const handleDateClick = (date: Date) => {
    // Navigate to home with the date as a query param
    navigate(`/?date=${formatDateKey(date)}`);
  };

  return (
    <main className="h-screen bg-background flex flex-col max-w-md mx-auto overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 p-4 border-b border-border shrink-0">
        <button
          onClick={() => navigate('/')}
          className="p-2 text-muted-foreground hover:text-foreground transition-smooth tap-highlight-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-medium text-foreground">Bookmarks</h1>
      </header>

      {/* Bookmarks list */}
      <div className="flex-1 overflow-y-auto p-4">
        {bookmarkedDates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Bookmark className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No bookmarks yet</p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Bookmark important days to find them quickly
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {bookmarkedDates.map((date) => (
              <button
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-smooth tap-highlight-none text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-primary leading-none">
                    {format(date, 'd')}
                  </span>
                  <span className="text-[10px] text-primary/70 uppercase">
                    {format(date, 'MMM')}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {format(date, 'EEEE')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(date, 'MMMM d, yyyy')}
                  </p>
                </div>
                <Bookmark className="w-4 h-4 text-primary fill-primary" />
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Bookmarks;
