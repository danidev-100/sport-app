import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { LogOut, User, Menu } from 'lucide-react';

// Navbar receives a handler to toggle the mobile sidebar
const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="h-14 border-b bg-card px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-md hover:bg-accent/20"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/" className="flex items-center gap-3">
          <span className="text-lg font-bold text-foreground">Club Deportivo</span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-secondary">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            {user?.nombre?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-foreground">{user?.nombre}</span>
            <span className="text-xs text-primary">
              {user?.rol === 'ADMIN' ? 'Admin' : 'Editor'}
            </span>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
