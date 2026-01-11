import { useState } from 'react';
import { Image, Camera, X } from 'lucide-react';

interface MediaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGallery: () => void;
  onSelectCamera: () => void;
}

const MediaMenu = ({ isOpen, onClose, onSelectGallery, onSelectCamera }: MediaMenuProps) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="fixed bottom-20 left-4 z-50 bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-fade-in">
        <div className="py-2">
          <button
            onClick={() => {
              onSelectGallery();
              onClose();
            }}
            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-secondary transition-smooth"
          >
            <Image className="w-5 h-5 text-primary" />
            <span className="text-sm text-foreground">Add photos</span>
          </button>
          
          <button
            onClick={() => {
              onSelectCamera();
              onClose();
            }}
            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-secondary transition-smooth"
          >
            <Camera className="w-5 h-5 text-primary" />
            <span className="text-sm text-foreground">Take photo</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default MediaMenu;
