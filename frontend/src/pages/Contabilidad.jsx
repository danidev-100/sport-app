import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, Lock, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { createIngreso, updateIngreso, createGasto, updateGasto, createPartido, getPartidos } from '../api/contabilidad';
import IngresoList from '../components/contabilidad/IngresoList';
import IngresoForm from '../components/contabilidad/IngresoForm';
import GastoList from '../components/contabilidad/GastoList';
import GastoForm from '../components/contabilidad/GastoForm';
import FechaForm from '../components/contabilidad/FechaForm';
import PartidoBalance from '../components/contabilidad/PartidoBalance';

const Contabilidad = () => {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState('ingresos');

  // Partido list state
  const [partidos, setPartidos] = useState([]);
  const [selectedPartido, setSelectedPartido] = useState(null);
  const [loadingPartidos, setLoadingPartidos] = useState(true);

  // Partido form state
  const [partidoModalOpen, setPartidoModalOpen] = useState(false);
  const [partidoSaving, setPartidoSaving] = useState(false);

  // Ingreso state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIngreso, setEditingIngreso] = useState(null);
  const [saving, setSaving] = useState(false);

  // Gasto state
  const [gastoModalOpen, setGastoModalOpen] = useState(false);
  const [editingGasto, setEditingGasto] = useState(null);
  const [gastoSaving, setGastoSaving] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch partidos
  useEffect(() => {
    const fetchPartidos = async () => {
      setLoadingPartidos(true);
      try {
        const res = await getPartidos();
        setPartidos(res.data?.partidos || []);
      } catch (err) {
        console.error('Error fetching partidos:', err);
        setPartidos([]);
      } finally {
        setLoadingPartidos(false);
      }
    };
    fetchPartidos();
  }, [refreshTrigger]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No autorizado</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Sin permisos</p>
        </div>
      </div>
    );
  }

  const handlePartidoSubmit = async (data) => {
    setPartidoSaving(true);
    setErrorMsg('');
    try {
      const res = await createPartido(data);
      const nuevoPartido = res.data?.partido || res.data;
      if (!nuevoPartido?.id) throw new Error('Respuesta inesperada del servidor');
      setPartidoModalOpen(false);
      setRefreshTrigger((t) => t + 1);
      setSelectedPartido(nuevoPartido);
      setTab('ingresos');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al crear partido';
      toast.error(msg);
      setErrorMsg(msg);
      console.error('Error creating partido:', err);
    } finally {
      setPartidoSaving(false);
    }
  };

  const handleIngresoSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = { ...data };
      if (selectedPartido) payload.partidoId = selectedPartido.id;

      if (editingIngreso) {
        await updateIngreso(editingIngreso.id, payload);
      } else {
        await createIngreso(payload);
      }
      setModalOpen(false);
      setEditingIngreso(null);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al guardar ingreso';
      toast.error(msg);
      console.error('Error saving ingreso:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditIngreso = (ingreso) => {
    setEditingIngreso(ingreso);
    setModalOpen(true);
  };

  const handleGastoSubmit = async (data) => {
    setGastoSaving(true);
    try {
      const payload = { ...data };
      if (selectedPartido) payload.partidoId = selectedPartido.id;

      if (editingGasto) {
        await updateGasto(editingGasto.id, payload);
      } else {
        await createGasto(payload);
      }
      setGastoModalOpen(false);
      setEditingGasto(null);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al guardar gasto';
      toast.error(msg);
      console.error('Error saving gasto:', err);
    } finally {
      setGastoSaving(false);
    }
  };

  const handleEditGasto = (gasto) => {
    setEditingGasto(gasto);
    setGastoModalOpen(true);
  };

  const formatCurrency = (value) =>
    Number(value).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  // ──────────── PARTIDO LIST VIEW ────────────
  if (!selectedPartido) {
    return (
      <div className="space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold tracking-tight">Contabilidad</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestión financiera del club</p>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setPartidoModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Nuevo Partido
          </Button>
        </div>

        {errorMsg && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3">
            {errorMsg}
          </div>
        )}

        {loadingPartidos ? (
          <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
            <div className="spinner mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Cargando partidos...</p>
          </div>
        ) : partidos.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium mb-1">No hay partidos todavía</p>
            <p className="text-sm text-muted-foreground/70">Creá un partido para empezar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partidos.map((p) => {
              const totalIng = (p.ingresos || []).reduce((s, i) => s + Number(i.monto), 0);
              const totalGas = (p.gastos || []).reduce((s, g) => s + Number(g.monto), 0);
              const balance = totalIng - totalGas;
              const balColor = balance > 0 ? 'text-green-500' : balance < 0 ? 'text-red-500' : 'text-muted-foreground';

              return (
                <button
                  key={p.id}
                  onClick={() => { setSelectedPartido(p); setTab('ingresos'); }}
                  className="text-left bg-card border border-border/50 rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all space-y-3"
                >
                  <h3 className="font-semibold text-base truncate">{p.titulo}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                      {p.ingresos?.length || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                      {p.gastos?.length || 0}
                    </span>
                  </div>
                  <p className={`text-lg font-bold ${balColor}`}>
                    {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        <FechaForm open={partidoModalOpen} onOpenChange={setPartidoModalOpen}
          onSubmit={handlePartidoSubmit} loading={partidoSaving} />
      </div>
    );
  }

  // ──────────── PARTIDO DETAIL VIEW ────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setSelectedPartido(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{selectedPartido.titulo}</h1>
            <p className="text-sm text-muted-foreground mt-1">Gestión financiera del partido</p>
          </div>
        </div>
        <Button onClick={() => setPartidoModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Partido
        </Button>
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3">
          {errorMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 animate-slide-up">
        <Button variant={tab === 'ingresos' ? 'default' : 'outline'} onClick={() => setTab('ingresos')}>Ingresos</Button>
        <Button variant={tab === 'gastos' ? 'default' : 'outline'} onClick={() => setTab('gastos')}>Gastos</Button>
        <Button variant={tab === 'balance' ? 'default' : 'outline'} onClick={() => setTab('balance')}>Balance</Button>
      </div>

      {/* Ingresos tab */}
      {tab === 'ingresos' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingIngreso(null); setModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Nuevo Ingreso
            </Button>
          </div>
          <IngresoList onEdit={handleEditIngreso} refreshTrigger={refreshTrigger} partidoId={selectedPartido.id} />
          <IngresoForm open={modalOpen} onOpenChange={setModalOpen}
            onSubmit={handleIngresoSubmit} initialData={editingIngreso} loading={saving} />
        </div>
      )}

      {/* Gastos tab */}
      {tab === 'gastos' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingGasto(null); setGastoModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Nuevo Gasto
            </Button>
          </div>
          <GastoList onEdit={handleEditGasto} refreshTrigger={refreshTrigger} partidoId={selectedPartido.id} />
          <GastoForm open={gastoModalOpen} onOpenChange={setGastoModalOpen}
            onSubmit={handleGastoSubmit} initialData={editingGasto} loading={gastoSaving} />
        </div>
      )}

      {/* Balance tab */}
      {tab === 'balance' && (
        <div className="animate-fade-in">
          <PartidoBalance partidoId={selectedPartido.id} refreshTrigger={refreshTrigger} />
        </div>
      )}

      <FechaForm open={partidoModalOpen} onOpenChange={setPartidoModalOpen}
        onSubmit={handlePartidoSubmit} loading={partidoSaving} />
    </div>
  );
};

export default Contabilidad;
