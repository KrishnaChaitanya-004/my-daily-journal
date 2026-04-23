import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoThumbnailProps {
  src: string;
  timestamp: number;
  onView: () => void;
  onDelete?: () => void;
  sizeClassName?: string;
}

const PhotoThumbnail = ({
  src,
  timestamp,
  onView,
  onDelete,
  sizeClassName,
}: PhotoThumbnailProps) => {
  const formatTime = (ts: number): string => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const [isDeleteVisible, setIsDeleteVisible] = useState(false);
  const longPressTimeoutRef = useRef<number | null>(null);
  const suppressNextClickRef = useRef(false);

  useEffect(() => {
    if (!isDeleteVisible) return;

    const timeoutId = window.setTimeout(() => {
      setIsDeleteVisible(false);
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [isDeleteVisible]);

  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current !== null) {
        window.clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, []);

  const clearLongPressTimeout = () => {
    if (longPressTimeoutRef.current !== null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const handleTouchStart = () => {
    if (!onDelete) return;

    clearLongPressTimeout();
    longPressTimeoutRef.current = window.setTimeout(() => {
      setIsDeleteVisible(true);
      suppressNextClickRef.current = true;
    }, 450);
  };

  const handleTouchEnd = () => {
    clearLongPressTimeout();
  };

  const handleView = () => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }

    onView();
  };

  return (
    <div className={cn('relative shrink-0 group', sizeClassName || 'w-[72px]')}>
      <button
        onClick={handleView}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="block w-full overflow-hidden rounded-[22px] shadow-md transition-shadow hover:shadow-lg"
      >
        <img 
          src={src} 
          alt="Photo" 
          className="aspect-square w-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-1 text-center text-[10px] text-white">
          {formatTime(timestamp)}
        </div>
      </button>
      
      {onDelete ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsDeleteVisible(false);
            onDelete();
          }}
          className={cn(
            'absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity sm:group-hover:opacity-100',
            isDeleteVisible && 'opacity-100'
          )}
        >
          <X className="w-3 h-3" />
        </button>
      ) : null}
    </div>
  );
};

export default PhotoThumbnail;
