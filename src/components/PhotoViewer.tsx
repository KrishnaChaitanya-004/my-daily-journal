import { X, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

interface PhotoViewerProps {
  src: string;
  onClose: () => void;
}

const PhotoViewer = ({ src, onClose }: PhotoViewerProps) => {
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (Capacitor.isNativePlatform()) {
        // Native Android: save to Downloads via Capacitor Filesystem
        let base64Data = '';
        
        if (src.startsWith('data:')) {
          // Already base64 data URL
          base64Data = src.split(',')[1];
        } else {
          // Fetch and convert to base64
          const response = await fetch(src);
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
        // Web fallback: blob download
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
