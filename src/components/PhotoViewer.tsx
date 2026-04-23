import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Download, Trash2, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

export interface ViewerPhoto {
  filename: string;
  src: string;
  metaLabel?: string;
}

interface PhotoViewerProps {
  photos: ViewerPhoto[];
  currentIndex: number;
  onChangeIndex: (index: number) => void;
  onClose: () => void;
  onDelete?: (filename: string) => void;
}

const PhotoViewer = ({
  photos,
  currentIndex,
  onChangeIndex,
  onClose,
  onDelete,
}: PhotoViewerProps) => {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const currentPhoto = useMemo(() => {
    return photos[currentIndex];
  }, [currentIndex, photos]);

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < photos.length - 1;

  const goPrev = useCallback(() => {
    if (canGoPrev) {
      onChangeIndex(currentIndex - 1);
    }
  }, [canGoPrev, currentIndex, onChangeIndex]);

  const goNext = useCallback(() => {
    if (canGoNext) {
      onChangeIndex(currentIndex + 1);
    }
  }, [canGoNext, currentIndex, onChangeIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowLeft') {
        goPrev();
      } else if (event.key === 'ArrowRight') {
        goNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goNext, goPrev, onClose]);

  if (!currentPhoto) return null;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      if (Capacitor.isNativePlatform()) {
        let base64Data = '';

        if (currentPhoto.src.startsWith('data:')) {
          base64Data = currentPhoto.src.split(',')[1];
        } else {
          const response = await fetch(currentPhoto.src);
          const blob = await response.blob();
          base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }

        const filename = `photo_${Date.now()}.jpg`;

        await Filesystem.writeFile({
          path: `Download/${filename}`,
          data: base64Data,
          directory: Directory.ExternalStorage,
        });

        toast({
          title: 'Photo saved',
          description: `Saved to Downloads/${filename}`,
        });
      } else {
        const response = await fetch(currentPhoto.src);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `photo-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: 'Photo downloaded',
          description: 'Photo saved to your device.',
        });
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: 'Download failed',
        description: 'Could not download the photo.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(currentPhoto.filename);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.2) {
      return;
    }

    if (dx < 0) {
      goNext();
    } else {
      goPrev();
    }
  };

  return (
    <div
      data-block-swipe-nav="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white">
        {currentIndex + 1} / {photos.length}
      </div>

      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <button
          onClick={handleDownload}
          className="rounded-full p-2 text-white transition-colors hover:bg-white/10"
          title="Save photo"
        >
          <Download className="h-7 w-7" />
        </button>
        {onDelete ? (
          <button
            onClick={handleDelete}
            className="rounded-full p-2 text-white transition-colors hover:bg-red-500/20"
            title="Delete photo"
          >
            <Trash2 className="h-7 w-7" />
          </button>
        ) : null}
        <button
          onClick={onClose}
          className="rounded-full p-2 text-white transition-colors hover:bg-white/10"
          title="Close viewer"
        >
          <X className="h-8 w-8" />
        </button>
      </div>

      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            disabled={!canGoPrev}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition-colors hover:bg-black/60 disabled:opacity-30"
            title="Previous photo"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            disabled={!canGoNext}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition-colors hover:bg-black/60 disabled:opacity-30"
            title="Next photo"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        </>
      )}

      <div
        className="flex h-full w-full touch-none items-center justify-center px-4 pb-6 pt-20"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex h-full w-full flex-col items-center justify-center gap-4">
          <img
            src={currentPhoto.src}
            alt="Photo"
            className="max-h-full max-w-full flex-1 object-contain"
          />
          {currentPhoto.metaLabel && (
            <div className="rounded-full bg-black/45 px-4 py-2 text-sm font-medium text-white">
              {currentPhoto.metaLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoViewer;
