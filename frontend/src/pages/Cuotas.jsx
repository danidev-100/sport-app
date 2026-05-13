import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const filterMeses = [
  { value: '1', label: 'Enero' }, { value: '2', label: 'Febrero' }, { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' }, { value: '5', label: 'Mayo' }, { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' }, { value: '8', label: 'Agosto' }, { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' }, { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' }
];

const anios = ['2025', '2026', '2027'];

const Cuotas = () => {
  const [cuotas, setCuotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMorosos, setShowMorosos] = useState(false);
  const [morosos, setMorosos] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [jugadores, setJugadores] = useState([]);
  const [filters, setFilters] = useState({ playerSearch: '', anio: '' });
  const [searchInput, setSearchInput] = useState('');
  const { isAdmin } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      const cleanFilters = {};
      if (filters.anio && filters.anio !== 'all') cleanFilters.anio = filters.anio;
      if (filters.playerSearch) cleanFilters.search = filters.playerSearch;
      const params = new URLSearchParams(cleanFilters).toString();
      const res = await apiClient.get(`/cuotas?${params}`);
      setCuotas(res.data.cuotas || []);
      
      const morososRes = await apiClient.get('/cuotas/morosos');
      setMorosos(morososRes.data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchJugadores = async () => {
    try {
      const res = await apiClient.get('/jugadores');
      setJugadores(res.data.jugadores || []);
    } catch (err) { console.error(err); }
  };

  // fetch cuotas when filters change
  useEffect(() => { fetchData(); }, [filters]);

  // fetch jugadores once
  useEffect(() => { fetchJugadores(); }, []);

  // debounce search input -> update filters.playerSearch
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(prev => ({ ...prev, playerSearch: searchInput }));
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // controlled state for generate form
  const [genData, setGenData] = useState({ jugadorId: '', mes: '', anio: '', monto: '' });

  const handleGenerar = async (e) => {
    e.preventDefault();
    // Client-side validation: ensure required fields are present and valid
    const missing = [];
    if (!genData.jugadorId) missing.push('Jugador');
    if (genData.mes === '' || genData.mes === undefined) missing.push('Mes');
    if (genData.anio === '' || genData.anio === undefined) missing.push('Año');
    if (genData.monto === undefined || genData.monto === '' || isNaN(Number(genData.monto))) missing.push('Monto');
    if (missing.length) {
      alert('Completa los campos: ' + missing.join(', '));
      return;
    }

    const payload = {
      jugadorId: genData.jugadorId,
      mes: parseInt(genData.mes, 10),
      anio: parseInt(genData.anio, 10),
      monto: parseFloat(genData.monto),
      pagada: true,
      fechaPago: new Date().toISOString(),
    };

    setGenerating(true);
    try {
      await apiClient.post('/cuotas/generar-jugador', payload);
      await fetchData();
      alert('Cuota generada y marcada como pagada');
      setGenData({ jugadorId: '', mes: '', anio: '', monto: '' });
    } catch (err) {
      console.error('Error generando cuota:', err);
      const serverData = err.response?.data;
      const msg = serverData?.message || (serverData ? JSON.stringify(serverData) : err.message);
      alert('Error al generar cuota: ' + msg);
    } finally {
      setGenerating(false);
    }
  };

  const isFormValid = (() => {
    if (!genData.jugadorId) return false;
    if (genData.mes === undefined || genData.mes === '') return false;
    if (genData.anio === undefined || genData.anio === '') return false;
    if (genData.monto === undefined || genData.monto === '' || isNaN(Number(genData.monto))) return false;
    // validate jugadorId uuid shape
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(String(genData.jugadorId))) return false;
    return true;
  })();

  // filter by search and year; show all months but restrict to jugador search and year
  const filteredCuotas = cuotas.filter((c) => {
    if (filters.playerSearch) {
      const name = (c.jugador?.nombre || '').toLowerCase();
      if (!name.includes(filters.playerSearch.toLowerCase())) return false;
    }
    if (filters.anio && filters.anio !== 'all') {
      if (String(c.anio) !== String(filters.anio)) return false;
    }
    return true;
  });

  // If filtering by a player, prepare a months list for that player (show all 12 months)
  let playerMonths = null;
  if (filters.playerSearch) {
    const match = jugadores.find(j => j.nombre?.toLowerCase().includes(filters.playerSearch.toLowerCase()));
    if (match) {
      const year = filters.anio && filters.anio !== 'all' ? filters.anio : new Date().getFullYear();
      playerMonths = Array.from({ length: 12 }).map((_, idx) => {
        const mes = idx + 1;
        const cuota = cuotas.find(c => (c.jugadorId === match.id || c.jugador?.id === match.id) && String(c.anio) === String(year) && c.mes === mes);
        const pagos = cuota?.pagos || [];
        const totalPagado = pagos.reduce((s, p) => s + parseFloat(p.monto || 0), 0);
        const montoCuota = cuota ? parseFloat(cuota.monto || 0) : null;
        const pagada = cuota ? totalPagado >= montoCuota && montoCuota > 0 : false;
        return { mes, label: filterMeses[idx].label, cuota, pagada, monto: montoCuota };
      });
  }
}

  const isCuotaPagada = (c) => {
    if (!c) return false;
    if (c.pagos && c.pagos.length) {
      const total = c.pagos.reduce((s, p) => s + parseFloat(p.monto || 0), 0);
      return total >= parseFloat(c.monto || 0);
    }
    return false;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cuotas</h1>
          <p className="text-muted-foreground">{cuotas.length} cuotas — mostrando {filteredCuotas.length}</p>
        </div>
        <Button
          variant={showMorosos ? 'default' : 'outline'}
          onClick={() => setShowMorosos(!showMorosos)}
        >
          {showMorosos ? 'Ver Cuotas' : `Morosos (${morosos.length})`}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Buscar jugador.."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Select
              value={filters.anio || undefined}
              onValueChange={(value) => setFilters(prev => prev.anio === value ? {...prev, anio: ''} : {...prev, anio: value})}
            >
              <SelectTrigger><SelectValue placeholder="Año" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {anios.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader><CardTitle>Generar Cuota</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleGenerar} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <Select
                  value={genData.jugadorId || undefined}
                  onValueChange={(v) => setGenData(prev => ({ ...prev, jugadorId: v || '' }))}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar jugador" /></SelectTrigger>
                  <SelectContent>
                    {jugadores.filter(j => j.activo).map(j => (
                      <SelectItem key={j.id} value={String(j.id)}>{j.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={genData.mes || undefined}
                  onValueChange={(v) => setGenData(prev => ({ ...prev, mes: v || '' }))}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Mes" /></SelectTrigger>
                  <SelectContent>
                    {filterMeses.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={genData.anio || undefined}
                  onValueChange={(v) => setGenData(prev => ({ ...prev, anio: v || '' }))}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Año" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  name="monto"
                  type="number"
                  placeholder="Monto"
                  value={genData.monto}
                  onChange={(e) => setGenData(prev => ({ ...prev, monto: e.target.value }))}
                  required
                />
              </div>
              <Button type="submit" disabled={generating} className="w-full md:w-48">
                {generating ? 'Generando...' : 'Generar Cuota'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Cargando...</div>
      ) : showMorosos ? (
        morosos.length === 0 ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground">No hay morosos</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Jugador</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cuotas</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {morosos.map((m, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-4">{m.jugador?.nombre}</td>
                      <td className="p-4 text-destructive">{m.cuotasPendientes}</td>
                      <td className="p-4 text-destructive">${m.totalAdeudado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )
      ) : (
        // If playerMonths is prepared, show 12-month view for the matched player
        playerMonths ? (
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Mes</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cuota</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {playerMonths.map((m) => (
                    <tr key={m.mes} className="border-b">
                      <td className="p-4 text-muted-foreground">{m.label}</td>
                      <td className="p-4 text-primary">{m.monto != null ? `$${m.monto}` : '-'}</td>
                      <td className="p-4">
                        <Badge variant={m.pagada ? 'default' : 'destructive'}>
                          {m.pagada ? 'PAGADA' : 'IMPAGA'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : (
          filteredCuotas.length === 0 ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">No hay cuotas</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">ID</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Jugador</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Período</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Monto</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCuotas.map((c) => (
                      <tr key={c.id} className="border-b">
                        <td className="p-4 text-muted-foreground">{c.numeroIdentificacion || '-'}</td>
                        <td className="p-4">{c.jugador?.nombre}</td>
                        <td className="p-4 text-muted-foreground">{filterMeses[c.mes-1]?.label} {c.anio}</td>
                        <td className="p-4 text-primary">${c.monto}</td>
                        <td className="p-4">
                          <Badge variant={isCuotaPagada(c) ? 'default' : 'destructive'}>
                            {isCuotaPagada(c) ? 'PAGADA' : 'IMPAGA'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )
        )
      )}
    </div>
  );
};

export default Cuotas;
