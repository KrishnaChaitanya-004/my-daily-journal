import { X } from 'lucide-react';

interface PhotoViewerProps {
  src: string;
  onClose: () => void;
}

const PhotoViewer = ({ src, onClose }: PhotoViewerProps) => {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white p-2"
      >
        <X className="w-8 h-8" />
      </button>

      <img
        src={src}
        alt="Photo"
        className="max-w-full max-h-full object-contain p-4"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export default PhotoViewer;
