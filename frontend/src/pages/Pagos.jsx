import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  const cuotasPendientes = cuotas.filter(c => c.pagos.length === 0);
  const cuotasPagadas = cuotas.filter(c => c.pagos.length > 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mis Cuotas</h1>
            <p className="text-muted-foreground">{jugador?.nombre} - {jugador?.email}</p>
          </div>
        </div>

        {cuotasPendientes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">
                Cuotas Pendientes ({cuotasPendientes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cuotasPendientes.map(cuota => (
                <div key={cuota.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{meses[cuota.mes - 1]} {cuota.anio}</p>
                    <p className="text-sm text-destructive">${cuota.monto} - Vencida</p>
                  </div>
                  <Button
                    onClick={() => handlePagar(cuota.id)}
                    disabled={paying === cuota.id}
                  >
                    {paying === cuota.id ? 'Procesando...' : 'Pagar'}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {cuotasPagadas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">
                Cuotas Pagadas ({cuotasPagadas.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cuotasPagadas.map(cuota => (
                <div key={cuota.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{meses[cuota.mes - 1]} {cuota.anio}</p>
                    <p className="text-sm text-primary">${cuota.monto} - Pagado</p>
                  </div>
                  <Badge variant="default">Pagado</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {cuotas.length === 0 && (
          <div className="text-center text-muted-foreground p-12">
            No tenés cuotas registradas
          </div>
        )}
      </div>
    </div>
  );
};

export default Pagos;