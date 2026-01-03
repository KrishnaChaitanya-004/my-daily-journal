import { Menu } from 'lucide-react';
import MenuDrawer from './MenuDrawer';
import { useMenuState } from '@/hooks/useMenuState';

const AppMenu = () => {
  const { isOpen, setOpen } = useMenuState();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2.5 text-muted-foreground hover:text-foreground transition-smooth tap-highlight-none rounded-xl hover:bg-secondary/50"
        title="Menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      <MenuDrawer open={isOpen} onOpenChange={setOpen} />
    </>
  );
};

export default AppMenu;
