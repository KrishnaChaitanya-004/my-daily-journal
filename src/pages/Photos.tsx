import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAllPhotos } from '@/hooks/useAllPhotos';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import PhotoViewer, { ViewerPhoto } from '@/components/PhotoViewer';

interface DeleteConfirmState {
  filename: string;
  dateKey: string;
}

interface ActionSheetPhoto {
  filename: string;
  dateKey?: string;
  src: string;
}

type GalleryViewerPhoto = ViewerPhoto & { dateKey?: string };

const Photos = () => {
  const navigate = useNavigate();
  const { allPhotos, getPhotoUrl, loadPhotoUrl, deletePhoto } = useAllPhotos();
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [actionSheetPhoto, setActionSheetPhoto] = useState<ActionSheetPhoto | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLongPressAtRef = useRef(0);

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

  const viewerPhotos = useMemo<GalleryViewerPhoto[]>(() => {
    return allPhotos.flatMap((photo) => {
      const src = photoUrls[photo.filename];
      if (!src) return [];

      return [{
        filename: photo.filename,
        src,
        dateKey: photo.dateKey,
        metaLabel: formatDate(photo.dateKey),
      }];
    });
  }, [allPhotos, photoUrls]);

  useEffect(() => {
    if (viewerIndex === null) return;

    if (viewerPhotos.length === 0) {
      setViewerIndex(null);
      return;
    }

    if (viewerIndex > viewerPhotos.length - 1) {
      setViewerIndex(viewerPhotos.length - 1);
    }
  }, [viewerIndex, viewerPhotos.length]);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const openPhotoViewer = (filename: string) => {
    const nextIndex = viewerPhotos.findIndex((photo) => photo.filename === filename);
    if (nextIndex !== -1) {
      setViewerIndex(nextIndex);
    }
  };

  const handleViewerDelete = async (filename: string) => {
    const targetPhoto = viewerPhotos.find((photo) => photo.filename === filename);
    if (!targetPhoto?.dateKey) return;

    const currentLength = viewerPhotos.length;
    setIsDeleting(true);

    try {
      await deletePhoto(filename, targetPhoto.dateKey);
      toast({
        title: 'Photo deleted',
        description: 'The photo has been removed from your diary.',
      });

      setViewerIndex((prev) => {
        if (prev === null || currentLength <= 1) return null;
        return Math.min(prev, currentLength - 2);
      });
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

  const startLongPress = (photo: ActionSheetPhoto) => {
    clearLongPressTimer();

    longPressTimerRef.current = setTimeout(() => {
      lastLongPressAtRef.current = Date.now();
      setActionSheetPhoto(photo);
      if (navigator.vibrate) navigator.vibrate(20);
    }, 380);
  };

  const handleThumbnailClick = (filename: string) => {
    if (Date.now() - lastLongPressAtRef.current < 700) {
      return;
    }

    openPhotoViewer(filename);
  };

  const handleContextMenu = (e: React.MouseEvent, photo: ActionSheetPhoto) => {
    e.preventDefault();
    clearLongPressTimer();
    lastLongPressAtRef.current = Date.now();
    setActionSheetPhoto(photo);
  };

  const requestDelete = (filename: string, dateKey?: string) => {
    if (!dateKey) return;
    setDeleteConfirm({ filename, dateKey });
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

  const handleOpenDateFromSheet = () => {
    if (!actionSheetPhoto?.dateKey) return;
    const dateKey = actionSheetPhoto.dateKey;
    setActionSheetPhoto(null);
    navigate(`/?date=${dateKey}`);
  };

  const handleDeleteFromSheet = () => {
    if (!actionSheetPhoto) return;
    requestDelete(actionSheetPhoto.filename, actionSheetPhoto.dateKey);
    setActionSheetPhoto(null);
  };

  return (
    <main className="h-screen bg-background flex flex-col max-w-md mx-auto overflow-hidden">
      <header className="flex items-center gap-3 p-4 border-b border-border shrink-0">
        <button
          onClick={() => navigate('/')}
          className="p-2 text-muted-foreground hover:text-foreground transition-smooth"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-medium text-foreground">Photos</h1>
      </header>

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
                    className="aspect-square rounded-2xl bg-secondary animate-pulse"
                  />
                );
              }

              const actionPhoto: ActionSheetPhoto = {
                filename: photo.filename,
                dateKey: photo.dateKey,
                src: photoUrl,
              };

              return (
                <button
                  key={`${photo.filename}-${index}`}
                  onClick={() => handleThumbnailClick(photo.filename)}
                  onContextMenu={(e) => handleContextMenu(e, actionPhoto)}
                  onTouchStart={() => startLongPress(actionPhoto)}
                  onTouchMove={clearLongPressTimer}
                  onTouchEnd={clearLongPressTimer}
                  onTouchCancel={clearLongPressTimer}
                  className="group relative aspect-square overflow-hidden rounded-2xl bg-secondary text-left"
                >
                  <img
                    src={photoUrl}
                    alt="Diary photo"
                    className="h-full w-full object-cover transition-transform duration-300 group-active:scale-[0.98]"
                    loading="lazy"
                  />

                  {photo.dateKey && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent p-2">
                      <span className="text-[10px] text-white/90">
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

      {viewerIndex !== null && viewerPhotos[viewerIndex] && (
        <PhotoViewer
          photos={viewerPhotos}
          currentIndex={viewerIndex}
          onChangeIndex={setViewerIndex}
          onClose={() => setViewerIndex(null)}
          onDelete={handleViewerDelete}
        />
      )}

      {actionSheetPhoto && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]"
            onClick={() => setActionSheetPhoto(null)}
          />

          <div className="fixed inset-x-4 bottom-4 z-50 overflow-hidden rounded-[28px] border border-border bg-card/95 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-3 border-b border-border/70 px-4 py-4">
              <img
                src={actionSheetPhoto.src}
                alt="Selected diary photo"
                className="h-14 w-14 rounded-2xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">Photo options</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(actionSheetPhoto.dateKey)}
                </p>
              </div>
              <button
                onClick={() => setActionSheetPhoto(null)}
                className="rounded-full p-2 text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 space-y-2">
              <button
                onClick={handleOpenDateFromSheet}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-left transition-smooth hover:bg-secondary"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Open this date</p>
                  <p className="text-xs text-muted-foreground">Jump to the diary day for this photo</p>
                </div>
              </button>

              <button
                onClick={handleDeleteFromSheet}
                className="flex w-full items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-left transition-smooth hover:bg-red-500/15"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Delete photo</p>
                  <p className="text-xs text-muted-foreground">Remove it from the diary permanently</p>
                </div>
              </button>

              <button
                onClick={() => setActionSheetPhoto(null)}
                className="mt-1 w-full rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition-smooth hover:bg-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
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
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-secondary transition-smooth"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-smooth disabled:opacity-50"
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
