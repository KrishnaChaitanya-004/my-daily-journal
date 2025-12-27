import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAllPhotos } from '@/hooks/useAllPhotos';
import { format } from 'date-fns';

const Photos = () => {
  const navigate = useNavigate();
  const { allPhotos, getPhotoUrl } = useAllPhotos();

  const formatDate = (dateKey?: string) => {
    if (!dateKey) return '';
    try {
      return format(new Date(dateKey), 'MMM d, yyyy');
    } catch {
      return dateKey;
    }
  };

  const handlePhotoClick = (dateKey?: string) => {
    if (dateKey) {
      navigate(`/?date=${dateKey}`);
    }
  };

  return (
    <main className="h-screen bg-background flex flex-col max-w-md mx-auto overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 p-4 border-b border-border shrink-0">
        <button
          onClick={() => navigate('/')}
          className="p-2 text-muted-foreground hover:text-foreground transition-smooth"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-medium text-foreground">Photos</h1>
      </header>

      {/* Photo grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {allPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <span className="text-2xl">📷</span>
            </div>
            <p className="text-muted-foreground text-sm">No photos yet</p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Photos you add to your diary will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {allPhotos.map((photo, index) => {
              const photoUrl = getPhotoUrl(photo);

              // 🚨 SAFETY CHECK (prevents broken images)
              if (!photoUrl) return null;

              return (
                <button
                  key={`${photo.filename}-${index}`}
                  onClick={() => handlePhotoClick(photo.dateKey)}
                  className="aspect-square rounded-lg overflow-hidden bg-secondary relative"
                >
                  <img
                    src={photoUrl}
                    alt="Diary photo"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {photo.dateKey && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                      <span className="text-[10px] text-white">
                        {formatDate(photo.dateKey)}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default Photos;
