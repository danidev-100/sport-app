import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, CreditCard, Receipt, Settings, Zap } from 'lucide-react';

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'ADMIN';

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/jugadores', label: 'Jugadores', icon: Users },
    { to: '/cuotas', label: 'Cuotas', icon: CreditCard },
    { to: '/pagos', label: 'Pagos', icon: Receipt },
  ];

  if (isAdmin) {
    links.push({ to: '/usuarios', label: 'Usuarios', icon: Settings });
  }

  return (
    <>
      {/* Overlay for small screens */}
      <div
        className={`fixed inset-0 bg-black/40 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      <aside
        className={`w-64 min-h-screen flex flex-col border-r bg-card z-40 transform transition-transform md:static fixed md:inset-auto inset-y-0 left-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        aria-hidden={!isOpen && 'true'}
      >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <img src="/Logo club coop beltrán.svg" alt="Club" className="w-10 h-10 rounded-xl object-contain" />
          <span className="text-foreground font-bold text-lg">Club</span>
        </div>

        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          v1.0.0
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
