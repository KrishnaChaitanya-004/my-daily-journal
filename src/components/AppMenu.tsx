import { Menu } from 'lucide-react';
import { useState } from 'react';
import MenuDrawer from './MenuDrawer';

const AppMenu = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-muted-foreground hover:text-foreground transition-smooth tap-highlight-none rounded-xl hover:bg-secondary/50"
      >
        <Menu className="w-5 h-5" />
      </button>
      <MenuDrawer open={open} onOpenChange={setOpen} />
    </>
  );
};

export default AppMenu;
