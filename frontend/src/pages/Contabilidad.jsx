import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, Lock } from 'lucide-react';
import { createIngreso, updateIngreso, createGasto, updateGasto } from '../api/contabilidad';
import IngresoList from '../components/contabilidad/IngresoList';
import IngresoForm from '../components/contabilidad/IngresoForm';
import GastoList from '../components/contabilidad/GastoList';
import GastoForm from '../components/contabilidad/GastoForm';
import BalanceCard from '../components/contabilidad/BalanceCard';

const Contabilidad = () => {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState('ingresos');

  // Ingreso state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIngreso, setEditingIngreso] = useState(null);
  const [saving, setSaving] = useState(false);

  // Gasto state
  const [gastoModalOpen, setGastoModalOpen] = useState(false);
  const [editingGasto, setEditingGasto] = useState(null);
  const [gastoSaving, setGastoSaving] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No autorizado</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            No tienes permisos para acceder a esta sección
          </p>
        </div>
      </div>
    );
  }

  const handleIngresoSubmit = async (data) => {
    setSaving(true);
    try {
      if (editingIngreso) {
        await updateIngreso(editingIngreso.id, data);
      } else {
        await createIngreso(data);
      }
      setModalOpen(false);
      setEditingIngreso(null);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error('Error saving ingreso:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditIngreso = (ingreso) => {
    setEditingIngreso(ingreso);
    setModalOpen(true);
  };

  const handleNewIngreso = () => {
    setEditingIngreso(null);
    setModalOpen(true);
  };

  const handleGastoSubmit = async (data) => {
    setGastoSaving(true);
    try {
      if (editingGasto) {
        await updateGasto(editingGasto.id, data);
      } else {
        await createGasto(data);
      }
      setGastoModalOpen(false);
      setEditingGasto(null);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error('Error saving gasto:', err);
    } finally {
      setGastoSaving(false);
    }
  };

  const handleEditGasto = (gasto) => {
    setEditingGasto(gasto);
    setGastoModalOpen(true);
  };

  const handleNewGasto = () => {
    setEditingGasto(null);
    setGastoModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">Contabilidad</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestión financiera del club
        </p>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-2 animate-slide-up">
        <Button
          variant={tab === 'ingresos' ? 'default' : 'outline'}
          onClick={() => setTab('ingresos')}
        >
          Ingresos
        </Button>
        <Button
          variant={tab === 'gastos' ? 'default' : 'outline'}
          onClick={() => setTab('gastos')}
        >
          Gastos
        </Button>
        <Button
          variant={tab === 'balance' ? 'default' : 'outline'}
          onClick={() => setTab('balance')}
        >
          Balance
        </Button>
      </div>

      {/* Tab Content */}
      {tab === 'ingresos' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-end">
            <Button onClick={handleNewIngreso}>
              <Plus className="w-4 h-4 mr-2" /> Nuevo Ingreso
            </Button>
          </div>
          <IngresoList onEdit={handleEditIngreso} refreshTrigger={refreshTrigger} />
          <IngresoForm
            open={modalOpen}
            onOpenChange={setModalOpen}
            onSubmit={handleIngresoSubmit}
            initialData={editingIngreso}
            loading={saving}
          />
        </div>
      )}

      {tab === 'gastos' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-end">
            <Button onClick={handleNewGasto}>
              <Plus className="w-4 h-4 mr-2" /> Nuevo Gasto
            </Button>
          </div>
          <GastoList onEdit={handleEditGasto} refreshTrigger={refreshTrigger} />
          <GastoForm
            open={gastoModalOpen}
            onOpenChange={setGastoModalOpen}
            onSubmit={handleGastoSubmit}
            initialData={editingGasto}
            loading={gastoSaving}
          />
        </div>
      )}

      {tab === 'balance' && (
        <div className="animate-fade-in">
          <BalanceCard refreshTrigger={refreshTrigger} />
        </div>
      )}
    </div>
  );
};

export default Contabilidad;
