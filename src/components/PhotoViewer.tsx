import { X, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PhotoViewerProps {
  src: string;
  onClose: () => void;
}

const PhotoViewer = ({ src, onClose }: PhotoViewerProps) => {
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(src);
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
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Could not download the photo.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={handleDownload}
          className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <Download className="w-7 h-7" />
        </button>
        <button
          onClick={onClose}
          className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-8 h-8" />
        </button>
      </div>

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
