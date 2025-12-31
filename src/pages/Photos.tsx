import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAllPhotos } from '@/hooks/useAllPhotos';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const Photos = () => {
  const navigate = useNavigate();
  const { allPhotos, getPhotoUrl, loadPhotoUrl, deletePhoto } = useAllPhotos();
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ filename: string; dateKey: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load photo URLs asynchronously
  useEffect(() => {
    const loadUrls = async () => {
      const urls: Record<string, string> = {};
      for (const photo of allPhotos) {
        const syncUrl = getPhotoUrl(photo);
        if (syncUrl) {
          urls[photo.filename] = syncUrl;
        } else {
          const asyncUrl = await loadPhotoUrl(photo);
          if (asyncUrl) {
            urls[photo.filename] = asyncUrl;
          }
        }
      }
      setPhotoUrls(urls);
    };
    loadUrls();
  }, [allPhotos, getPhotoUrl, loadPhotoUrl]);

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

  const handleDeleteClick = (e: React.MouseEvent, filename: string, dateKey?: string) => {
    e.stopPropagation();
    if (dateKey) {
      setDeleteConfirm({ filename, dateKey });
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    
    setIsDeleting(true);
    try {
      await deletePhoto(deleteConfirm.filename, deleteConfirm.dateKey);
      toast({
        title: 'Photo deleted',
        description: 'The photo has been removed from your diary.',
      });
      setDeleteConfirm(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete photo.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
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
              const photoUrl = photoUrls[photo.filename];

              if (!photoUrl) {
                return (
                  <div
                    key={`${photo.filename}-${index}`}
                    className="aspect-square rounded-lg bg-secondary animate-pulse"
                  />
                );
              }

              return (
                <div
                  key={`${photo.filename}-${index}`}
                  className="aspect-square rounded-lg overflow-hidden bg-secondary relative group"
                >
                  <button
                    onClick={() => handlePhotoClick(photo.dateKey)}
                    className="w-full h-full"
                  >
                    <img
                      src={photoUrl}
                      alt="Diary photo"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteClick(e, photo.filename, photo.dateKey)}
                    className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center
                      opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                  </button>

                  {photo.dateKey && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                      <span className="text-[10px] text-white">
                        {formatDate(photo.dateKey)}
                      </span>
                    </div>
                  )}
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
              <h3 className="text-lg font-medium text-foreground">Delete Photo?</h3>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              This will permanently remove the photo from your diary entry.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-foreground
                  hover:bg-secondary transition-smooth"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium
                  hover:bg-red-600 transition-smooth disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Photos;