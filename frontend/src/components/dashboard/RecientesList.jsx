import { Link } from 'react-router-dom';
import { formatDate, getPosicionLabel } from '../../utils/formatters';
import { Users } from 'lucide-react';

const Skeleton = () => (
  <div className="rounded-xl border border-border/50 bg-card p-6 animate-pulse">
    <div className="h-4 w-28 bg-muted rounded mb-5" />
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-3 mb-4 last:mb-0">
        <div className="w-9 h-9 rounded-full bg-muted" />
        <div className="flex-1">
          <div className="h-3 w-24 bg-muted rounded mb-1.5" />
          <div className="h-2.5 w-16 bg-muted rounded" />
        </div>
      </div>
    ))}
  </div>
);

const Empty = () => (
  <div className="rounded-xl border border-border/50 bg-card p-6">
    <div className="flex flex-col items-center justify-center h-48 text-center">
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3">
        <Users className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">No hay jugadores recientes</p>
    </div>
  </div>
);

const RecientesList = ({ jugadores, loading }) => {
  if (loading) return <Skeleton />;
  if (!jugadores?.length) return <Empty />;

  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 hover:border-border-light transition-all duration-300">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Jugadores recientes</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Últimos agregados</p>
        </div>
        <Link
          to="/jugadores"
          className="text-xs font-medium text-primary hover:text-primary-lighter transition-colors"
        >
          Ver todos
        </Link>
      </div>

      <div className="space-y-0.5">
        {jugadores.map((jugador) => (
          <Link
            key={jugador.id}
            to={`/jugadores`}
            className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors -mx-2 group"
          >
            {jugador.fotoUrl ? (
              <img
                src={jugador.fotoUrl}
                alt={jugador.nombre}
                className="w-9 h-9 rounded-full object-cover ring-1 ring-border"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary ring-1 ring-primary/20">
                {jugador.nombre?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-foreground group-hover:text-primary transition-colors">
                {jugador.nombre}
              </p>
              <p className="text-xs text-muted-foreground">
                {getPosicionLabel(jugador.posicion) || 'Sin posición'}
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
              {formatDate(jugador.createdAt)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecientesList;
