import { useState, useCallback } from 'react';

// Global menu state for Android back button handling
let globalMenuOpen = false;
let globalCloseMenu: (() => void) | null = null;

export const getMenuState = () => globalMenuOpen;
export const closeGlobalMenu = () => {
  if (globalCloseMenu) {
    globalCloseMenu();
    return true;
  }
  return false;
};

export const useMenuState = () => {
  const [isOpen, setIsOpen] = useState(false);

  const setOpen = useCallback((open: boolean) => {
    setIsOpen(open);
    globalMenuOpen = open;
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    globalMenuOpen = false;
  }, []);

  // Register close function globally
  globalCloseMenu = close;

  return {
    isOpen,
    setOpen,
    close,
  };
};
