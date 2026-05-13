import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { LogOut, User, Menu } from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  const userInitial = user?.nombre?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-20">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/[0.06] transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="w-4.5 h-4.5 text-muted-foreground" />
          </button>
          <Link to="/" className="flex items-center gap-2.5">
            <span className="text-base font-bold tracking-tight">
              Club <span className="gradient-text">Deportivo</span>
            </span>
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-border/40">
            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs ring-1 ring-primary/20">
              {userInitial}
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-sm font-medium text-foreground leading-tight">
                {user?.nombre}
              </span>
              <span className="text-[11px] text-primary font-medium">
                {user?.rol === 'ADMIN' ? 'Admin' : 'Editor'}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
