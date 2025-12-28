import { Menu, X, Image, Bookmark, Settings, Home, Search, BarChart3, CheckSquare, Tag, Mic, MapPin } from 'lucide-react';
import { useState, useMemo } from 'react';
import appLogo from '@/assets/app-logo.jpeg';
import { useNavigate, useLocation } from 'react-router-dom';

const STORAGE_KEY = 'diary-app-data';

interface SearchResult {
  dateKey: string;
  displayDate: string;
  preview: string;
}

const menuItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: BarChart3, label: 'Statistics', path: '/statistics' },
  { icon: CheckSquare, label: 'Habits', path: '/habits' },
  { icon: Tag, label: 'Tags', path: '/tags' },
  { icon: Image, label: 'Photos', path: '/photos' },
  { icon: Mic, label: 'Voice Notes', path: '/voice-notes' },
  { icon: MapPin, label: 'Places', path: '/places' },
  { icon: Bookmark, label: 'Bookmarks', path: '/bookmarks' },
  { icon: Settings, label: 'Settings', path: '/settings' }
];

const formatDisplayDate = (dateKey: string): string => {
  const date = new Date(dateKey);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
};

const AppMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const searchResults = useMemo<SearchResult[]>(() => {
    if (!searchQuery.trim()) return [];
    
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      const results: SearchResult[] = [];
      const query = searchQuery.toLowerCase();
      
      for (const [dateKey, dayData] of Object.entries(parsed)) {
        const content = (dayData as any)?.content || '';
        if (content.toLowerCase().includes(query)) {
          // Find the matching line for preview
          const lines = content.split('\n');
          const matchingLine = lines.find((line: string) => 
            line.toLowerCase().includes(query)
          ) || lines[0];
          
          // Highlight the match in preview (truncate if too long)
          let preview = matchingLine.substring(0, 80);
          if (matchingLine.length > 80) preview += '...';
          
          results.push({
            dateKey,
            displayDate: formatDisplayDate(dateKey),
            preview
          });
        }
      }
      
      // Sort by date (newest first)
      results.sort((a, b) => new Date(b.dateKey).getTime() - new Date(a.dateKey).getTime());
      
      return results;
    } catch {
      return [];
    }
  }, [searchQuery]);

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setShowSearch(false);
    setSearchQuery('');
  };

  const handleSearchResultClick = (dateKey: string) => {
    navigate(`/?date=${dateKey}`);
    setIsOpen(false);
    setShowSearch(false);
    setSearchQuery('');
  };

  return (
    <>
      {/* Menu button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-muted-foreground hover:text-foreground transition-smooth tap-highlight-none"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={() => {
            setIsOpen(false);
            setShowSearch(false);
            setSearchQuery('');
          }}
        />
      )}

      {/* Slide-in menu */}
      <div
        className={`
          fixed top-0 left-0 z-50 h-full w-72 bg-card border-r border-border
          transform transition-transform duration-300 ease-out flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <img 
              src={appLogo} 
              alt="KC's Diary" 
              className="w-10 h-10 rounded-full object-cover border-2 border-primary"
            />
            <span className="text-lg font-medium text-foreground">KC's Diary</span>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              setShowSearch(false);
              setSearchQuery('');
            }}
            className="p-2 text-muted-foreground hover:text-foreground transition-smooth tap-highlight-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Section */}
        <div className="p-3 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search your diary..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearch(e.target.value.trim().length > 0);
              }}
              onFocus={() => setShowSearch(searchQuery.trim().length > 0)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary border border-border 
                text-foreground placeholder:text-muted-foreground text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
                transition-smooth"
            />
          </div>
        </div>

        {/* Search Results or Menu Items */}
        <div className="flex-1 overflow-y-auto">
          {showSearch && searchQuery.trim() ? (
            <div className="p-2">
              {searchResults.length > 0 ? (
                <>
                  <p className="text-xs text-muted-foreground px-3 py-2">
                    Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  </p>
                  {searchResults.map((result) => (
                    <button
                      key={result.dateKey}
                      onClick={() => handleSearchResultClick(result.dateKey)}
                      className="w-full text-left px-3 py-3 rounded-lg hover:bg-secondary 
                        transition-smooth tap-highlight-none border-b border-border/50 last:border-0"
                    >
                      <p className="text-sm font-medium text-primary">{result.displayDate}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {result.preview}
                      </p>
                    </button>
                  ))}
                </>
              ) : (
                <div className="text-center py-8">
                  <Search className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No results found</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Try different keywords
                  </p>
                </div>
              )}
            </div>
          ) : (
            <nav className="p-2">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-smooth tap-highlight-none text-left
                      ${isActive 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-foreground hover:bg-secondary'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            KC's Diary
          </p>
        </div>
      </div>
    </>
  );
};

export default AppMenu;
