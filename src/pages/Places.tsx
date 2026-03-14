import { useState } from 'react';
import { ArrowLeft, MapPin, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const STORAGE_KEY = 'diary-app-data';

interface LocationWithDate {
  name: string;
  lat?: number;
  lng?: number;
  dateKey: string;
}

const Places = () => {
  const navigate = useNavigate();
  const [deleteConfirm, setDeleteConfirm] = useState<{ placeName: string; dateKey?: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

  // Group locations by place name, sorted alphabetically
  const groupedLocations = allLocations.reduce((acc, loc) => {
    if (!acc[loc.name]) {
      acc[loc.name] = [];
    }
    acc[loc.name].push(loc);
    return acc;
  }, {} as Record<string, LocationWithDate[]>);

  const sortedPlaceNames = Object.keys(groupedLocations).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );

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

  const deleteLocation = (placeName: string, dateKey?: string) => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return;
      const parsed = JSON.parse(data);

      if (dateKey) {
        // Delete location from a specific date
        if (parsed[dateKey]?.location?.name === placeName) {
          delete parsed[dateKey].location;
        }
      } else {
        // Delete all entries for this place
        for (const [dk, dayData] of Object.entries(parsed)) {
          if ((dayData as any)?.location?.name === placeName) {
            delete (parsed[dk] as any).location;
          }
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      setRefreshKey(k => k + 1);
      setDeleteConfirm(null);
      toast({
        title: 'Location deleted',
        description: dateKey ? 'Location removed from that date.' : `All "${placeName}" entries removed.`,
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete location.', variant: 'destructive' });
    }
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
            {sortedPlaceNames.map((placeName) => {
              const locations = groupedLocations[placeName];
              return (
                <div
                  key={placeName}
                  className="rounded-xl bg-card border border-border overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-4 border-b border-border bg-secondary/30">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{placeName}</p>
                      <p className="text-xs text-muted-foreground">
                        {locations.length} {locations.length === 1 ? 'entry' : 'entries'}
                      </p>
                    </div>
                    <button
                      onClick={() => setDeleteConfirm({ placeName })}
                      className="p-2 text-muted-foreground hover:text-red-500 transition-smooth"
                      title="Delete all entries for this place"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="divide-y divide-border">
                    {locations.map((loc, index) => (
                      <div
                        key={`${loc.dateKey}-${index}`}
                        className="flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-smooth"
                      >
                        <button
                          onClick={() => handleLocationClick(loc.dateKey)}
                          className="flex-1 text-left"
                        >
                          <span className="text-sm text-foreground">
                            {formatDate(loc.dateKey)}
                          </span>
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setDeleteConfirm({ placeName, dateKey: loc.dateKey })}
                            className="p-1.5 text-muted-foreground hover:text-red-500 transition-smooth"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleLocationClick(loc.dateKey)}
                            className="text-xs text-primary"
                          >
                            View →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-xs border border-border shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-foreground">Delete Location?</h3>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {deleteConfirm.dateKey
                ? `Remove "${deleteConfirm.placeName}" from ${formatDate(deleteConfirm.dateKey)}?`
                : `Remove all entries for "${deleteConfirm.placeName}"?`
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-secondary transition-smooth"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteLocation(deleteConfirm.placeName, deleteConfirm.dateKey)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-smooth"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Places;
