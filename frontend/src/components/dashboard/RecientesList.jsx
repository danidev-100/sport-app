import { Link } from 'react-router-dom';
import { formatDate, getPosicionLabel } from '../../utils/formatters';

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
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
        <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <p className="text-sm text-muted-foreground">No hay jugadores</p>
    </div>
  </div>
);

const RecientesList = ({ jugadores, loading }) => {
  if (loading) return <Skeleton />;
  if (!jugadores?.length) return <Empty />;

  return (
    <div className="rounded-xl border border-border/50 bg-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-medium text-foreground">Jugadores recientes</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Últimos agregados</p>
        </div>
        <Link
          to="/jugadores"
          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Ver todos
        </Link>
      </div>

      <div className="space-y-1">
        {jugadores.map((jugador) => (
          <Link
            key={jugador.id}
            to={`/jugadores/${jugador.id}`}
            className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-accent/40 transition-colors -mx-2"
          >
            {jugador.fotoUrl ? (
              <img
                src={jugador.fotoUrl}
                alt={jugador.nombre}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                {jugador.nombre?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{jugador.nombre}</p>
              <p className="text-xs text-muted-foreground">
                {getPosicionLabel(jugador.posicion)}
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
