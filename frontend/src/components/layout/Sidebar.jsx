import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, CreditCard, Receipt, Settings } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/jugadores', label: 'Jugadores', icon: Users },
  { to: '/cuotas', label: 'Cuotas', icon: CreditCard },
  { to: '/pagos', label: 'Pagos', icon: Receipt },
];

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'ADMIN';

  const links = isAdmin
    ? [...navItems, { to: '/usuarios', label: 'Usuarios', icon: Settings }]
    : navItems;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      <aside
        className={`w-64 min-h-screen glass-strong flex flex-col z-40 transform transition-transform duration-300 ease-out md:static fixed inset-y-0 left-0 border-r border-border/50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center ring-1 ring-primary/20">
              <img
                src="/Logo club coop beltrán.svg"
                alt="Club"
                className="w-7 h-7 object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-foreground font-bold text-base tracking-tight leading-none">
                Club
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5">
                Deportivo
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5">
          <p className="px-3 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
            Menú
          </p>
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/12 text-primary shadow-sm shadow-primary/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`w-1 h-6 rounded-full transition-all duration-200 -ml-1.5 ${
                        isActive
                          ? 'bg-primary shadow-sm shadow-primary/40'
                          : 'bg-transparent group-hover:bg-white/[0.06]'
                      }`}
                    />
                    <Icon
                      className={`w-4.5 h-4.5 transition-all duration-200 ${
                        isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    />
                    <span>{link.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/50">
          <div className="text-[11px] text-muted-foreground/60 text-center">
            v1.0.0
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
