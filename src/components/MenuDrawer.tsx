import { Image, Bookmark, Settings, Home, Search, BarChart3, CheckSquare, Tag, Mic, MapPin, Trophy } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useSettings } from '@/hooks/useSettings';

const STORAGE_KEY = 'diary-app-data';

interface SearchResult {
  dateKey: string;
  displayDate: string;
  preview: string;
}

interface MenuDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const menuItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: BarChart3, label: 'Statistics', path: '/statistics' },
  { icon: Trophy, label: 'Achievements', path: '/achievements' },
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

const MenuDrawer = ({ open, onOpenChange }: MenuDrawerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  const diaryName = settings.diaryName || "KC's Diary";

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
          const lines = content.split('\n');
          const matchingLine = lines.find((line: string) => 
            line.toLowerCase().includes(query)
          ) || lines[0];
          
          let preview = matchingLine.substring(0, 80);
          if (matchingLine.length > 80) preview += '...';
          
          results.push({
            dateKey,
            displayDate: formatDisplayDate(dateKey),
            preview
          });
        }
      }
      
      results.sort((a, b) => new Date(b.dateKey).getTime() - new Date(a.dateKey).getTime());
      
      return results;
    } catch {
      return [];
    }
  }, [searchQuery]);

  const handleNavigate = (path: string) => {
    navigate(path);
    onOpenChange(false);
    setSearchQuery('');
  };

  const handleSearchResultClick = (dateKey: string) => {
    navigate(`/?date=${dateKey}`);
    onOpenChange(false);
    setSearchQuery('');
  };
const handleOpenChange = (isOpen: boolean) => {
  onOpenChange(isOpen);
  if (!isOpen) setSearchQuery('');
};

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent
    side="left"
    className="w-[300px] p-0 bg-background border-r border-border"
    onOpenAutoFocus={(e) => e.preventDefault()}
  >

        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">
                  {diaryName.charAt(0).toUpperCase()}
                </span>
              </div>
              {diaryName}
            </SheetTitle>
          </div>
        </SheetHeader>

        {/* Search Section */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search your diary..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border 
                text-foreground placeholder:text-muted-foreground text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
                transition-smooth"
            />
          </div>
        </div>

        {/* Search Results or Menu Items */}
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-180px)]">
          {searchQuery.trim() ? (
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
                      className="w-full text-left px-3 py-3 rounded-xl hover:bg-secondary/70 
                        transition-smooth tap-highlight-none border-b border-border/30 last:border-0"
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
            <nav className="p-2 space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl
                      transition-smooth tap-highlight-none text-left group
                      ${isActive 
                        ? 'bg-primary/15 text-primary border border-primary/20' 
                        : 'text-foreground hover:bg-secondary/70 border border-transparent'
                      }
                    `}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background">
          <p className="text-xs text-muted-foreground text-center">
            Your personal diary companion
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MenuDrawer;
