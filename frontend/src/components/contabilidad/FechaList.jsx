import { useState, useEffect } from 'react';
import { getFechas, deleteFecha, createIngreso, createGasto, deleteIngreso, deleteGasto } from '../../api/contabilidad';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ChevronDown, ChevronRight, Plus, Trash2, Receipt, ShoppingCart,
  CalendarDays, MoreHorizontal, Pencil
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

const FechaList = ({ refreshTrigger, onEditFecha }) => {
  const [fechas, setFechas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  // Inline add states
  const [addingIngreso, setAddingIngreso] = useState(null);
  const [addingGasto, setAddingGasto] = useState(null);
  const [newIngreso, setNewIngreso] = useState({ descripcion: '', monto: '' });
  const [newGasto, setNewGasto] = useState({ descripcion: '', monto: '' });

  useEffect(() => {
    const fetchFechas = async () => {
      setLoading(true);
      try {
        const res = await getFechas();
        setFechas(res.data?.fechas || []);
      } catch (err) {
        console.error('Error fetching fechas:', err);
        setFechas([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFechas();
  }, [refreshTrigger]);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDeleteFecha = async (id) => {
    if (window.confirm('¿Eliminar esta fecha con todos sus ingresos y gastos?')) {
      try {
        await deleteFecha(id);
        setFechas((prev) => prev.filter((f) => f.id !== id));
      } catch (err) {
        console.error('Error deleting fecha:', err);
      }
    }
  };

  const handleAddIngreso = async (fechaId) => {
    if (!newIngreso.descripcion || !newIngreso.monto) return;
    try {
      const res = await createIngreso({
        descripcion: newIngreso.descripcion,
        monto: parseFloat(newIngreso.monto),
        fecha: new Date().toISOString(),
        fechaId,
      });
      setFechas((prev) =>
        prev.map((f) =>
          f.id === fechaId
            ? { ...f, ingresos: [res.data.ingreso, ...f.ingresos] }
            : f
        )
      );
      setNewIngreso({ descripcion: '', monto: '' });
      setAddingIngreso(null);
    } catch (err) {
      console.error('Error creating ingreso:', err);
    }
  };

  const handleAddGasto = async (fechaId) => {
    if (!newGasto.descripcion || !newGasto.monto) return;
    try {
      const res = await createGasto({
        descripcion: newGasto.descripcion,
        monto: parseFloat(newGasto.monto),
        fecha: new Date().toISOString(),
        fechaId,
      });
      setFechas((prev) =>
        prev.map((f) =>
          f.id === fechaId
            ? { ...f, gastos: [res.data.gasto, ...f.gastos] }
            : f
        )
      );
      setNewGasto({ descripcion: '', monto: '' });
      setAddingGasto(null);
    } catch (err) {
      console.error('Error creating gasto:', err);
    }
  };

  const handleDeleteIngreso = async (fechaId, ingresoId) => {
    try {
      await deleteIngreso(ingresoId);
      setFechas((prev) =>
        prev.map((f) =>
          f.id === fechaId
            ? { ...f, ingresos: f.ingresos.filter((i) => i.id !== ingresoId) }
            : f
        )
      );
    } catch (err) {
      console.error('Error deleting ingreso:', err);
    }
  };

  const handleDeleteGasto = async (fechaId, gastoId) => {
    try {
      await deleteGasto(gastoId);
      setFechas((prev) =>
        prev.map((f) =>
          f.id === fechaId
            ? { ...f, gastos: f.gastos.filter((g) => g.id !== gastoId) }
            : f
        )
      );
    } catch (err) {
      console.error('Error deleting gasto:', err);
    }
  };

  const formatCurrency = (value) =>
    Number(value).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  if (loading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
        <div className="spinner mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Cargando fechas...</p>
      </div>
    );
  }

  if (fechas.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
          <CalendarDays className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium">No hay fechas registradas</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Creá una nueva fecha para empezar
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {fechas.map((fecha) => {
        const isExpanded = expanded[fecha.id];
        const totalIngresos = fecha.ingresos.reduce((s, i) => s + Number(i.monto), 0);
        const totalGastos = fecha.gastos.reduce((s, g) => s + Number(g.monto), 0);
        const balance = totalIngresos - totalGastos;
        const balanceColor = balance > 0 ? 'text-green-500' : balance < 0 ? 'text-red-500' : 'text-muted-foreground';

        return (
          <div key={fecha.id} className="rounded-xl border border-border/50 bg-card overflow-hidden">
            {/* Fecha header */}
            <button
              onClick={() => toggleExpand(fecha.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-semibold truncate">{fecha.titulo}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(fecha.fecha)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="hidden sm:flex items-center gap-3 text-sm">
                  <span className="text-green-500 font-medium">
                    +{formatCurrency(totalIngresos)}
                  </span>
                  <span className="text-red-500 font-medium">
                    -{formatCurrency(totalGastos)}
                  </span>
                </div>
                <span className={`font-semibold text-sm min-w-[80px] text-right ${balanceColor}`}>
                  {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
                </span>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => onEditFecha(fecha)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteFecha(fecha.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-border/50 px-5 py-4 space-y-4">
                {/* Ingresos section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-semibold">Ingresos</span>
                      <span className="text-xs text-muted-foreground">({fecha.ingresos.length})</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => setAddingIngreso(addingIngreso === fecha.id ? null : fecha.id)}
                    >
                      <Plus className="w-3 h-3" /> Agregar
                    </Button>
                  </div>

                  {addingIngreso === fecha.id && (
                    <div className="flex gap-2 mb-2 p-2 rounded-lg bg-muted/30">
                      <Input
                        placeholder="Descripción"
                        value={newIngreso.descripcion}
                        onChange={(e) => setNewIngreso({ ...newIngreso, descripcion: e.target.value })}
                        className="h-8 text-sm flex-1"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Monto"
                        value={newIngreso.monto}
                        onChange={(e) => setNewIngreso({ ...newIngreso, monto: e.target.value })}
                        className="h-8 text-sm w-28"
                      />
                      <Button size="sm" className="h-8" onClick={() => handleAddIngreso(fecha.id)}>
                        +
                      </Button>
                    </div>
                  )}

                  {fecha.ingresos.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-1">Sin ingresos</p>
                  ) : (
                    <div className="space-y-1">
                      {fecha.ingresos.map((ing) => (
                        <div key={ing.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/30 group">
                          <span className="text-sm">{ing.descripcion}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-green-500">
                              +{formatCurrency(ing.monto)}
                            </span>
                            <button
                              onClick={() => handleDeleteIngreso(fecha.id, ing.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Gastos section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-semibold">Gastos</span>
                      <span className="text-xs text-muted-foreground">({fecha.gastos.length})</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => setAddingGasto(addingGasto === fecha.id ? null : fecha.id)}
                    >
                      <Plus className="w-3 h-3" /> Agregar
                    </Button>
                  </div>

                  {addingGasto === fecha.id && (
                    <div className="flex gap-2 mb-2 p-2 rounded-lg bg-muted/30">
                      <Input
                        placeholder="Descripción"
                        value={newGasto.descripcion}
                        onChange={(e) => setNewGasto({ ...newGasto, descripcion: e.target.value })}
                        className="h-8 text-sm flex-1"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Monto"
                        value={newGasto.monto}
                        onChange={(e) => setNewGasto({ ...newGasto, monto: e.target.value })}
                        className="h-8 text-sm w-28"
                      />
                      <Button size="sm" className="h-8" onClick={() => handleAddGasto(fecha.id)}>
                        +
                      </Button>
                    </div>
                  )}

                  {fecha.gastos.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-1">Sin gastos</p>
                  ) : (
                    <div className="space-y-1">
                      {fecha.gastos.map((gasto) => (
                        <div key={gasto.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/30 group">
                          <span className="text-sm">{gasto.descripcion}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-red-500">
                              -{formatCurrency(gasto.monto)}
                            </span>
                            <button
                              onClick={() => handleDeleteGasto(fecha.id, gasto.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fecha balance summary */}
                <div className="flex justify-end items-center gap-2 pt-2 border-t border-border/30">
                  <span className="text-xs text-muted-foreground">Balance de fecha:</span>
                  <span className={`text-sm font-bold ${balanceColor}`}>
                    {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FechaList;
