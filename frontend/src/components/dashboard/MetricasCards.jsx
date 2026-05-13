import { Users, CheckCircle, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const metricsConfig = [
  {
    label: 'Jugadores',
    key: 'totalJugadores',
    icon: Users,
    gradient: 'from-emerald-500/20 to-emerald-500/5',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
  },
  {
    label: 'Activos',
    key: 'jugadoresActivos',
    icon: CheckCircle,
    gradient: 'from-sky-500/20 to-sky-500/5',
    iconBg: 'bg-sky-500/15',
    iconColor: 'text-sky-400',
  },
  {
    label: 'Ingresos',
    key: 'totalIngresos',
    icon: DollarSign,
    format: true,
    gradient: 'from-violet-500/20 to-violet-500/5',
    iconBg: 'bg-violet-500/15',
    iconColor: 'text-violet-400',
  },
  {
    label: 'Morosos',
    key: 'totalMorosos',
    icon: AlertTriangle,
    gradient: 'from-rose-500/20 to-rose-500/5',
    iconBg: 'bg-rose-500/15',
    iconColor: 'text-rose-400',
  },
];

const MetricasCards = ({ metricas, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {metricsConfig.map((_, i) => (
          <div key={i} className="rounded-xl bg-card border border-border/50 p-5 animate-pulse">
            <div className="h-3 w-16 bg-muted rounded mb-3" />
            <div className="h-8 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {metricsConfig.map((cfg) => {
        const Icon = cfg.icon;
        const raw = metricas?.[cfg.key] ?? 0;
        const value = cfg.format ? formatCurrency(raw) : raw;

        return (
          <div
            key={cfg.key}
            className="group relative rounded-xl border border-border/50 bg-card p-5 hover:border-border-light transition-all duration-300 hover:shadow-md"
          >
            {/* Gradient overlay */}
            <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${cfg.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {cfg.label}
                </span>
                <div className={`w-8 h-8 rounded-lg ${cfg.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {value}
              </div>
              {cfg.key === 'totalIngresos' && raw > 0 && (
                <div className="flex items-center gap-1 mt-1.5">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span className="text-[11px] text-emerald-400 font-medium">Este mes</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MetricasCards;
