import { useState, useEffect, useMemo } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Search, AlertTriangle, Plus, CheckCircle, Users, DollarSign } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const filterMeses = [
  { value: '1', label: 'Enero' }, { value: '2', label: 'Febrero' }, { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' }, { value: '5', label: 'Mayo' }, { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' }, { value: '8', label: 'Agosto' }, { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' }, { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' }
];

const anios = ['2025', '2026', '2027'];

// ── Helper: compute morosos from cuotas + jugadores list ─────
// Finds both: (a) existing unpaid cuotas from past months, and
// (b) active players who are missing cuotas for past months
function computeMorosos(cuotasList, jugadoresList = []) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  const jugadorMap = {};

  // Part A: existing unpaid cuotas
  cuotasList.forEach((c) => {
    const totalPagado = (c.pagos || []).reduce((s, p) => s + parseFloat(p.monto || 0), 0);
    const isPagada = totalPagado >= parseFloat(c.monto || 0);
    if (isPagada) return;

    // Only count months strictly before the current month
    const esVencida = c.anio < currentYear || (c.anio === currentYear && c.mes < currentMonth);
    if (!esVencida) return;

    const jugadorId = c.jugadorId || c.jugador?.id;
    if (!jugadorId) return;

    if (!jugadorMap[jugadorId]) {
      jugadorMap[jugadorId] = {
        jugador: c.jugador || { id: jugadorId, nombre: 'Desconocido' },
        cuotasPendientes: 0,
        totalAdeudado: 0,
      };
    }
    jugadorMap[jugadorId].cuotasPendientes += 1;
    jugadorMap[jugadorId].totalAdeudado += parseFloat(c.monto || 0);
  });

  // Part B: players who are missing cuotas for past months
  // Only consider jugadores who have at least one cuota ever (they're in the cuota system)
  const jugadoresConCuotas = new Set();
  const ultimoMontoPorJugador = {};
  cuotasList.forEach((c) => {
    const jId = c.jugadorId || c.jugador?.id;
    if (!jId) return;
    jugadoresConCuotas.add(jId);
    // Track the latest monto for each player as reference
    ultimoMontoPorJugador[jId] = parseFloat(c.monto || 0);
  });

  (jugadoresList.filter((j) => j.activo !== false)).forEach((j) => {
    if (!jugadoresConCuotas.has(j.id)) return; // skip players never in the cuota system

    // Check each past month of the current year
    let missingCount = 0;
    let missingAmount = 0;
    const refMonto = ultimoMontoPorJugador[j.id] || 0;

    for (let mes = 1; mes < currentMonth; mes++) {
      const hasCuota = cuotasList.some(
        (c) =>
          (c.jugadorId === j.id || c.jugador?.id === j.id) &&
          c.mes === mes &&
          c.anio === currentYear
      );
      if (!hasCuota) {
        missingCount++;
        missingAmount += refMonto;
      }
    }

    if (missingCount === 0) return;

    if (jugadorMap[j.id]) {
      // Player already has unpaid cuotas — merge missing months too
      jugadorMap[j.id].cuotasPendientes += missingCount;
      jugadorMap[j.id].totalAdeudado += missingAmount;
    } else {
      jugadorMap[j.id] = {
        jugador: { id: j.id, nombre: j.nombre },
        cuotasPendientes: missingCount,
        totalAdeudado: missingAmount,
      };
    }
  });

  return Object.values(jugadorMap);
}

// ── Helper: is a single cuota paid? ────────────────
function isCuotaPagada(c) {
  if (!c) return false;
  if (c.pagos && c.pagos.length) {
    const total = c.pagos.reduce((s, p) => s + parseFloat(p.monto || 0), 0);
    return total >= parseFloat(c.monto || 0);
  }
  return false;
}

const Cuotas = () => {
  const { isAdmin } = useAuth();

  // ── Data ──────────────────────────────────────────
  const [allCuotas, setAllCuotas] = useState([]);   // unfiltered master list
  const [cuotas, setCuotas] = useState([]);          // filtered for main table
  const [loading, setLoading] = useState(true);
  const [jugadores, setJugadores] = useState([]);
  const [morosos, setMorosos] = useState([]);

  // ── UI state ─────────────────────────────────────
  const [showMorosos, setShowMorosos] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [filters, setFilters] = useState({ playerSearch: '', anio: '' });
  const [searchInput, setSearchInput] = useState('');
  const [genData, setGenData] = useState({ jugadorId: '', mes: '', anio: '', monto: '' });
  const [payingId, setPayingId] = useState(null);

  // ── Fetch everything on mount ────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [cuotasRes, jugadoresRes] = await Promise.all([
          apiClient.get('/cuotas'),
          apiClient.get('/jugadores'),
        ]);

        const all = cuotasRes.data.cuotas || [];
        setAllCuotas(all);
        setCuotas(all);
        setJugadores(jugadoresRes.data.jugadores || []);
        setMorosos(computeMorosos(all, jugadoresRes.data.jugadores || []));
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // ── Client-side filtering when filters change ────
  useEffect(() => {
    let filtered = [...allCuotas];

    if (filters.playerSearch) {
      const q = filters.playerSearch.toLowerCase();
      filtered = filtered.filter((c) =>
        c.jugador?.nombre?.toLowerCase().includes(q)
      );
    }

    if (filters.anio && filters.anio !== 'all') {
      filtered = filtered.filter((c) => String(c.anio) === String(filters.anio));
    }

    setCuotas(filtered);
  }, [filters, allCuotas]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((prev) => ({ ...prev, playerSearch: searchInput }));
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Handlers ─────────────────────────────────────
  const handleGenerar = async (e) => {
    e.preventDefault();
    const missing = [];
    if (!genData.jugadorId) missing.push('Jugador');
    if (genData.mes === '' || genData.mes === undefined) missing.push('Mes');
    if (genData.anio === '' || genData.anio === undefined) missing.push('Año');
    if (genData.monto === undefined || genData.monto === '' || isNaN(Number(genData.monto))) missing.push('Monto');
    if (missing.length) {
      alert('Completa los campos: ' + missing.join(', '));
      return;
    }

    setGenerating(true);
    try {
      await apiClient.post('/cuotas/generar-jugador', {
        jugadorId: genData.jugadorId,
        mes: parseInt(genData.mes, 10),
        anio: parseInt(genData.anio, 10),
        monto: parseFloat(genData.monto),
        pagada: true,
        fechaPago: new Date().toISOString(),
      });

      // Re-fetch all data
      const [cuotasRes] = await Promise.all([apiClient.get('/cuotas')]);
      const all = cuotasRes.data.cuotas || [];
      setAllCuotas(all);
      setMorosos(computeMorosos(all, jugadores));
      alert('Cuota generada y marcada como pagada');
      setGenData({ jugadorId: '', mes: '', anio: '', monto: '' });
    } catch (err) {
      const serverData = err.response?.data;
      alert('Error: ' + (serverData?.message || err.message));
    } finally {
      setGenerating(false);
    }
  };

  // ── Computed values ──────────────────────────────
  // Build 12-month view if filtering by player
  const matchedPlayer = useMemo(() => {
    if (!filters.playerSearch) return null;
    return jugadores.find((j) =>
      j.nombre?.toLowerCase().includes(filters.playerSearch.toLowerCase())
    ) || null;
  }, [filters.playerSearch, jugadores]);

  // Auto-sync the searched player into the generate form
  useEffect(() => {
    setGenData((prev) => ({
      ...prev,
      jugadorId: matchedPlayer ? String(matchedPlayer.id) : '',
    }));
  }, [matchedPlayer]);

  const playerMonths = useMemo(() => {
    if (!filters.playerSearch) return null;
    const match = jugadores.find((j) =>
      j.nombre?.toLowerCase().includes(filters.playerSearch.toLowerCase())
    );
    if (!match) return null;

    const year = filters.anio && filters.anio !== 'all' ? filters.anio : new Date().getFullYear();
    return Array.from({ length: 12 }).map((_, idx) => {
      const mes = idx + 1;
      const cuota = allCuotas.find(
        (c) =>
          (c.jugadorId === match.id || c.jugador?.id === match.id) &&
          String(c.anio) === String(year) &&
          c.mes === mes
      );
      const pagos = cuota?.pagos || [];
      const totalPagado = pagos.reduce((s, p) => s + parseFloat(p.monto || 0), 0);
      const montoCuota = cuota ? parseFloat(cuota.monto || 0) : null;
      const pagada = cuota ? totalPagado >= montoCuota && montoCuota > 0 : false;
      return { mes, label: filterMeses[idx].label, cuota, pagada, monto: montoCuota };
    });
  }, [filters, allCuotas, jugadores]);

  // ── Handle pay cuota ────────────────────────────
  const handlePagar = async (cuotaId, monto) => {
    if (!confirm(`¿Confirmás el pago de $${monto} para esta cuota?`)) return;
    setPayingId(cuotaId);
    try {
      await apiClient.post('/pagos', {
        cuotaId,
        monto: parseFloat(monto),
        metodoPago: 'EFECTIVO',
        observacion: 'Pago registrado por administrador',
      });

      // Re-fetch and refresh
      const [cuotasRes] = await Promise.all([apiClient.get('/cuotas')]);
      const all = cuotasRes.data.cuotas || [];
      setAllCuotas(all);
      setMorosos(computeMorosos(all, jugadores));
    } catch (err) {
      const serverData = err.response?.data;
      alert('Error al registrar pago: ' + (serverData?.message || err.message));
    } finally {
      setPayingId(null);
    }
  };

  // ── Render ───────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cuotas</h1>
          <p className="text-sm text-muted-foreground mt-1">{allCuotas.length} cuotas registradas</p>
        </div>
        <Button
          variant={showMorosos ? 'default' : 'outline'}
          onClick={() => setShowMorosos(!showMorosos)}
          className="gap-2"
        >
          <AlertTriangle className="w-4 h-4" />
          {showMorosos ? 'Ver Cuotas' : `Morosos (${morosos.length})`}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar jugador..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={filters.anio || undefined}
            onValueChange={(value) =>
              setFilters((prev) =>
                prev.anio === value ? { ...prev, anio: '' } : { ...prev, anio: value }
              )
            }
          >
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {anios.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Generate Cuota Form (admin only) */}
      {isAdmin && (
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Generar Cuota</h2>
          </div>
          <form onSubmit={handleGenerar}>
            {matchedPlayer ? (
              <div className="flex items-center gap-2 mb-4 px-1">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                  Generar cuota para: <strong>{matchedPlayer.nombre}</strong>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-4 px-1">
                <Search className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Buscá un jugador arriba para generar una cuota
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">

              <Select
                value={genData.mes || undefined}
                onValueChange={(v) => setGenData((prev) => ({ ...prev, mes: v || '' }))}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Mes" /></SelectTrigger>
                <SelectContent>
                  {filterMeses.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={genData.anio || undefined}
                onValueChange={(v) => setGenData((prev) => ({ ...prev, anio: v || '' }))}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Año" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder="Monto"
                value={genData.monto}
                onChange={(e) => setGenData((prev) => ({ ...prev, monto: e.target.value }))}
                required
              />
            </div>
            <Button type="submit" disabled={generating || !matchedPlayer} size="sm">
              {generating ? 'Generando...' : 'Generar Cuota'}
            </Button>
          </form>
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
          <div className="spinner mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Cargando cuotas...</p>
        </div>
      ) : showMorosos ? (
        morosos.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
            <CheckCircle className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No hay morosos</p>
            <p className="text-sm text-muted-foreground/60">Todos los jugadores están al día</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Jugador</TableHead>
                  <TableHead className="font-semibold">Cuotas Pendientes</TableHead>
                  <TableHead className="font-semibold">Total Adeudado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {morosos.map((m, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{m.jugador?.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{m.cuotasPendientes} cuota{m.cuotasPendientes !== 1 ? 's' : ''}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-destructive">
                      {formatCurrency(m.totalAdeudado)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      ) : playerMonths ? (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">
                {matchedPlayer?.nombre || filters.playerSearch}
                {' — '}
                Cuotas {filters.anio && filters.anio !== 'all' ? filters.anio : new Date().getFullYear()}
              </span>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Mes</TableHead>
                <TableHead className="font-semibold">Monto</TableHead>
                <TableHead className="font-semibold">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playerMonths.map((m) => (
                <TableRow key={m.mes}>
                  <TableCell className="text-muted-foreground">{m.label}</TableCell>
                  <TableCell className="text-primary font-medium">
                    {m.monto != null ? `$${m.monto}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.pagada ? 'default' : 'destructive'}>
                      {m.pagada ? 'Pagada' : 'Impaga'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : cuotas.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium mb-1">No hay cuotas</p>
          <p className="text-sm text-muted-foreground/60">Generá cuotas para empezar a gestionar pagos</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">ID</TableHead>
                <TableHead className="font-semibold">Jugador</TableHead>
                <TableHead className="font-semibold">Período</TableHead>
                <TableHead className="font-semibold">Monto</TableHead>
                <TableHead className="font-semibold">Estado</TableHead>
                {isAdmin && <TableHead className="font-semibold text-right">Acción</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {cuotas.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {c.numeroIdentificacion ? c.numeroIdentificacion.slice(0, 8) : '-'}
                  </TableCell>
                  <TableCell className="font-medium">{c.jugador?.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {filterMeses[c.mes - 1]?.label} {c.anio}
                  </TableCell>
                  <TableCell className="text-primary font-medium">${c.monto}</TableCell>
                  <TableCell>
                    <Badge variant={isCuotaPagada(c) ? 'default' : 'destructive'}>
                      {isCuotaPagada(c) ? 'Pagada' : 'Impaga'}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      {isCuotaPagada(c) ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1.5 text-xs"
                          onClick={() => handlePagar(c.id, c.monto)}
                          disabled={payingId === c.id}
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          {payingId === c.id ? 'Pagando...' : 'Pagar'}
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Cuotas;
