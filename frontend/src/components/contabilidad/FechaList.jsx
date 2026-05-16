import { useState, useEffect } from 'react';
import {
  getIngresos, getGastos, createIngreso, createGasto,
  deleteIngreso, deleteGasto
} from '../../api/contabilidad';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ChevronDown, ChevronRight, Plus, Trash2, Receipt, ShoppingCart, CalendarDays
} from 'lucide-react';

const FechaList = ({ refreshTrigger }) => {
  const [ingresos, setIngresos] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  // Inline add states
  const [addingIngreso, setAddingIngreso] = useState(null);
  const [addingGasto, setAddingGasto] = useState(null);
  const [newIngreso, setNewIngreso] = useState({ descripcion: '', monto: '' });
  const [newGasto, setNewGasto] = useState({ descripcion: '', monto: '' });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ingRes, gasRes] = await Promise.all([
          getIngresos(),
          getGastos(),
        ]);
        setIngresos(ingRes.data?.ingresos || []);
        setGastos(gasRes.data?.gastos || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setIngresos([]);
        setGastos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshTrigger]);

  // Group by date (YYYY-MM-DD)
  const groupedByDate = {};
  for (const ing of ingresos) {
    const key = new Date(ing.fecha).toISOString().split('T')[0];
    if (!groupedByDate[key]) groupedByDate[key] = { ingresos: [], gastos: [], date: ing.fecha };
    groupedByDate[key].ingresos.push(ing);
  }
  for (const gas of gastos) {
    const key = new Date(gas.fecha).toISOString().split('T')[0];
    if (!groupedByDate[key]) groupedByDate[key] = { ingresos: [], gastos: [], date: gas.fecha };
    groupedByDate[key].gastos.push(gas);
  }

  const sortedDates = Object.entries(groupedByDate)
    .sort(([a], [b]) => b.localeCompare(a));

  const toggleExpand = (dateKey) => {
    setExpanded((prev) => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  const handleAddIngreso = async (dateKey) => {
    if (!newIngreso.descripcion || !newIngreso.monto) return;
    try {
      const res = await createIngreso({
        descripcion: newIngreso.descripcion,
        monto: parseFloat(newIngreso.monto),
        fecha: dateKey,
      });
      setIngresos((prev) => [...prev, res.data.ingreso]);
      setNewIngreso({ descripcion: '', monto: '' });
      setAddingIngreso(null);
    } catch (err) {
      console.error('Error creating ingreso:', err);
    }
  };

  const handleAddGasto = async (dateKey) => {
    if (!newGasto.descripcion || !newGasto.monto) return;
    try {
      const res = await createGasto({
        descripcion: newGasto.descripcion,
        monto: parseFloat(newGasto.monto),
        fecha: dateKey,
      });
      setGastos((prev) => [...prev, res.data.gasto]);
      setNewGasto({ descripcion: '', monto: '' });
      setAddingGasto(null);
    } catch (err) {
      console.error('Error creating gasto:', err);
    }
  };

  const handleDeleteIngreso = async (id) => {
    try {
      await deleteIngreso(id);
      setIngresos((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error('Error deleting ingreso:', err);
    }
  };

  const handleDeleteGasto = async (id) => {
    try {
      await deleteGasto(id);
      setGastos((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      console.error('Error deleting gasto:', err);
    }
  };

  const formatCurrency = (value) =>
    Number(value).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  const formatDate = (dateStr) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('es-AR', {
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

  if (sortedDates.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
          <CalendarDays className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium">No hay movimientos registrados</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Creá una nueva fecha para empezar
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedDates.map(([dateKey, group]) => {
        const isExpanded = expanded[dateKey];
        const totalIngresos = group.ingresos.reduce((s, i) => s + Number(i.monto), 0);
        const totalGastos = group.gastos.reduce((s, g) => s + Number(g.monto), 0);
        const balance = totalIngresos - totalGastos;
        const balanceColor = balance > 0 ? 'text-green-500' : balance < 0 ? 'text-red-500' : 'text-muted-foreground';

        return (
          <div key={dateKey} className="rounded-xl border border-border/50 bg-card overflow-hidden">
            {/* Date header */}
            <button
              onClick={() => toggleExpand(dateKey)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <span className="font-semibold">{formatDate(dateKey)}</span>
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
                      <span className="text-xs text-muted-foreground">({group.ingresos.length})</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => setAddingIngreso(addingIngreso === dateKey ? null : dateKey)}
                    >
                      <Plus className="w-3 h-3" /> Agregar
                    </Button>
                  </div>

                  {addingIngreso === dateKey && (
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
                      <Button size="sm" className="h-8" onClick={() => handleAddIngreso(dateKey)}>
                        +
                      </Button>
                    </div>
                  )}

                  {group.ingresos.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-1">Sin ingresos</p>
                  ) : (
                    <div className="space-y-1">
                      {group.ingresos.map((ing) => (
                        <div key={ing.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/30 group">
                          <span className="text-sm">{ing.descripcion}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-green-500">
                              +{formatCurrency(ing.monto)}
                            </span>
                            <button
                              onClick={() => handleDeleteIngreso(ing.id)}
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
                      <span className="text-xs text-muted-foreground">({group.gastos.length})</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => setAddingGasto(addingGasto === dateKey ? null : dateKey)}
                    >
                      <Plus className="w-3 h-3" /> Agregar
                    </Button>
                  </div>

                  {addingGasto === dateKey && (
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
                      <Button size="sm" className="h-8" onClick={() => handleAddGasto(dateKey)}>
                        +
                      </Button>
                    </div>
                  )}

                  {group.gastos.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-1">Sin gastos</p>
                  ) : (
                    <div className="space-y-1">
                      {group.gastos.map((gas) => (
                        <div key={gas.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/30 group">
                          <span className="text-sm">{gas.descripcion}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-red-500">
                              -{formatCurrency(gas.monto)}
                            </span>
                            <button
                              onClick={() => handleDeleteGasto(gas.id)}
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

                {/* Date balance */}
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
