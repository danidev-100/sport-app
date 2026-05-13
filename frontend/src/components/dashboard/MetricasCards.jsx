import { Users, CheckCircle, DollarSign, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const metricsConfig = [
  { label: 'Jugadores', key: 'totalJugadores', icon: Users, color: 'text-primary' },
  { label: 'Activos', key: 'jugadoresActivos', icon: CheckCircle, color: 'text-emerald-400' },
  { label: 'Ingresos', key: 'totalIngresos', icon: DollarSign, color: 'text-sky-400', format: true },
  { label: 'Morosos', key: 'totalMorosos', icon: AlertTriangle, color: 'text-rose-400' },
];

const MetricasCards = ({ metricas, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metricsConfig.map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-5 animate-pulse">
            <div className="h-3 w-16 bg-muted rounded mb-3" />
            <div className="h-7 w-20 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metricsConfig.map((cfg) => {
        const Icon = cfg.icon;
        const raw = metricas?.[cfg.key] ?? 0;
        const value = cfg.format ? formatCurrency(raw) : raw;

        return (
          <div
            key={cfg.key}
            className="rounded-xl border border-border/50 bg-card p-5 transition-colors hover:border-border"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {cfg.label}
              </span>
              <Icon className={`w-4 h-4 ${cfg.color}`} />
            </div>
            <div className="text-2xl font-semibold tracking-tight">
              {value}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MetricasCards;
