import { X } from 'lucide-react';

interface PhotoThumbnailProps {
  src: string;
  timestamp: number;
  onView: () => void;
  onDelete: () => void;
}

const PhotoThumbnail = ({ src, timestamp, onView, onDelete }: PhotoThumbnailProps) => {
  const formatTime = (ts: number): string => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative inline-block group">
      <button
        onClick={onView}
        className="block rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
      >
        <img 
          src={src} 
          alt="Photo" 
          className="w-20 h-20 object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-1 py-0.5 text-center">
          {formatTime(timestamp)}
        </div>
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

export default PhotoThumbnail;
