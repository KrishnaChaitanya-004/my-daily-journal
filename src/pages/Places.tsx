import { ArrowLeft, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const STORAGE_KEY = 'diary-app-data';

interface LocationWithDate {
  name: string;
  lat?: number;
  lng?: number;
  dateKey: string;
}

const Places = () => {
  const navigate = useNavigate();

  const getAllLocations = (): LocationWithDate[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      const locations: LocationWithDate[] = [];
      
      for (const [dateKey, dayData] of Object.entries(parsed)) {
        const location = (dayData as any)?.location;
        if (location?.name) {
          locations.push({ ...location, dateKey });
        }
      }
      
      // Sort by date (newest first)
      locations.sort((a, b) => new Date(b.dateKey).getTime() - new Date(a.dateKey).getTime());
      
      return locations;
    } catch {
      return [];
    }
  };

  const allLocations = getAllLocations();

  // Group locations by place name
  const groupedLocations = allLocations.reduce((acc, loc) => {
    if (!acc[loc.name]) {
      acc[loc.name] = [];
    }
    acc[loc.name].push(loc);
    return acc;
  }, {} as Record<string, LocationWithDate[]>);

  const formatDate = (dateKey: string) => {
    try {
      return format(new Date(dateKey), 'MMM d, yyyy');
    } catch {
      return dateKey;
    }
  };

  const handleLocationClick = (dateKey: string) => {
    navigate(`/?date=${dateKey}`);
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
        <h1 className="text-lg font-medium text-foreground">Places</h1>
      </header>

      {/* Places list */}
      <div className="flex-1 overflow-y-auto p-4">
        {allLocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No places yet</p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Locations you add to entries will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedLocations).map(([placeName, locations]) => (
              <div
                key={placeName}
                className="rounded-xl bg-card border border-border overflow-hidden"
              >
                <div className="flex items-center gap-3 p-4 border-b border-border bg-secondary/30">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{placeName}</p>
                    <p className="text-xs text-muted-foreground">
                      {locations.length} {locations.length === 1 ? 'entry' : 'entries'}
                    </p>
                  </div>
                </div>
                
                <div className="divide-y divide-border">
                  {locations.map((loc, index) => (
                    <button
                      key={`${loc.dateKey}-${index}`}
                      onClick={() => handleLocationClick(loc.dateKey)}
                      className="w-full flex items-center justify-between px-4 py-3 
                        hover:bg-secondary/50 transition-smooth text-left"
                    >
                      <span className="text-sm text-foreground">
                        {formatDate(loc.dateKey)}
                      </span>
                      <span className="text-xs text-primary">View →</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Places;
