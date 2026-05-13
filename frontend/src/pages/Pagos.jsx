import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, CheckCircle, AlertTriangle, ArrowLeft, ExternalLink } from 'lucide-react';

const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const Pagos = () => {
  const [jugador, setJugador] = useState(null);
  const [cuotas, setCuotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [jugadorRes, cuotasRes] = await Promise.all([
        apiClient.get('/jugadores/auth/me'),
        apiClient.get('/pagos/mis-cuotas')
      ]);
      setJugador(jugadorRes.data);
      setCuotas(cuotasRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePagar = async (cuotaId) => {
    setPaying(cuotaId);
    try {
      const res = await apiClient.post('/pagos/crear-preferencia', { cuotaId });

      if (res.data.initPoint) {
        window.location.href = res.data.initPoint;
      } else {
        alert('Error al crear preferencia de pago');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error al procesar pago');
    } finally {
      setPaying(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const cuotasPendientes = cuotas.filter(c => c.pagos.length === 0);
  const cuotasPagadas = cuotas.filter(c => c.pagos.length > 0);

  return (
    <div className="min-h-screen hero-gradient">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
              <img
                src="/Logo club coop beltrán.svg"
                alt="Club"
                className="w-6 h-6 object-contain"
              />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">Mis Cuotas</h1>
              <p className="text-xs text-muted-foreground">{jugador?.nombre}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {jugador?.email}
          </Badge>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8 animate-fade-in">
        {/* Pendientes */}
        {cuotasPendientes.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <h2 className="text-sm font-semibold text-foreground">
                Pendientes ({cuotasPendientes.length})
              </h2>
            </div>
            <div className="space-y-2">
              {cuotasPendientes.map(cuota => (
                <div
                  key={cuota.id}
                  className="group rounded-xl border border-border/50 bg-card p-4 flex items-center justify-between hover:border-destructive/30 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {meses[cuota.mes - 1]} {cuota.anio}
                      </p>
                      <p className="text-sm text-destructive font-medium">
                        ${cuota.monto}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handlePagar(cuota.id)}
                    disabled={paying === cuota.id}
                    size="sm"
                    className="gap-1.5"
                  >
                    {paying === cuota.id ? (
                      <>Procesando...</>
                    ) : (
                      <>
                        Pagar
                        <ExternalLink className="w-3 h-3" />
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pagadas */}
        {cuotasPagadas.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Pagadas ({cuotasPagadas.length})
              </h2>
            </div>
            <div className="space-y-2">
              {cuotasPagadas.map(cuota => (
                <div
                  key={cuota.id}
                  className="rounded-xl border border-border/50 bg-card p-4 flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {meses[cuota.mes - 1]} {cuota.anio}
                      </p>
                      <p className="text-sm text-primary font-medium">
                        ${cuota.monto}
                      </p>
                    </div>
                  </div>
                  <Badge className="font-medium">Pagado</Badge>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {cuotas.length === 0 && (
          <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium mb-1">No tenés cuotas registradas</p>
            <p className="text-sm text-muted-foreground/60">Consultá con la administración del club</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pagos;
