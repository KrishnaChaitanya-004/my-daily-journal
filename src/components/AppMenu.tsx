import { Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AppMenu = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/menu')}
      className="p-2 text-muted-foreground hover:text-foreground transition-smooth tap-highlight-none"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
};

export default AppMenu;
