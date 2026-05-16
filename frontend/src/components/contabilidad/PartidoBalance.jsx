import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Receipt, ShoppingCart } from 'lucide-react';
import { getIngresos, getGastos } from '../../api/contabilidad';

const PartidoBalance = ({ partidoId, refreshTrigger }) => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [totales, setTotales] = useState({ ingresos: 0, gastos: 0 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = { partidoId };
        const [ingRes, gasRes] = await Promise.all([
          getIngresos(params),
          getGastos(params),
        ]);
        const ingresos = (ingRes.data?.ingresos || []).map((i) => ({
          id: i.id,
          descripcion: i.descripcion,
          monto: Number(i.monto),
          tipo: 'ingreso',
          fecha: i.fecha,
        }));
        const gastos = (gasRes.data?.gastos || []).map((g) => ({
          id: g.id,
          descripcion: g.descripcion,
          monto: Number(g.monto),
          tipo: 'gasto',
          fecha: g.fecha,
        }));

        const totalIngresos = ingresos.reduce((s, i) => s + i.monto, 0);
        const totalGastos = gastos.reduce((s, g) => s + g.monto, 0);

        // Merge and sort by fecha desc
        const merged = [...ingresos, ...gastos].sort(
          (a, b) => new Date(b.fecha) - new Date(a.fecha)
        );

        setItems(merged);
        setTotales({ ingresos: totalIngresos, gastos: totalGastos });
      } catch (err) {
        console.error('Error fetching partido balance:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [partidoId, refreshTrigger]);

  const balance = totales.ingresos - totales.gastos;
  const balanceColor =
    balance > 0 ? 'text-green-500' : balance < 0 ? 'text-red-500' : 'text-muted-foreground';

  const formatCurrency = (value) =>
    Number(value).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  if (loading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
        <div className="spinner mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Cargando balance...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Totales cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border/50 rounded-xl p-5 space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm text-muted-foreground font-medium">Total Ingresos</span>
          </div>
          <p className="text-2xl font-bold text-green-500">{formatCurrency(totales.ingresos)}</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-5 space-y-1">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-sm text-muted-foreground font-medium">Total Gastos</span>
          </div>
          <p className="text-2xl font-bold text-red-500">{formatCurrency(totales.gastos)}</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-5 space-y-1">
          <div className="flex items-center gap-2">
            <DollarSign className={`w-4 h-4 ${balanceColor}`} />
            <span className="text-sm text-muted-foreground font-medium">Balance</span>
          </div>
          <p className={`text-2xl font-bold ${balanceColor}`}>
            {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
          </p>
        </div>
      </div>

      {/* Tabla detallada */}
      <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h3 className="font-semibold">Movimientos del Partido</h3>
        </div>

        {items.length === 0 ? (
          <div className="p-10 text-center">
            <DollarSign className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No hay movimientos en este partido</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 text-sm text-muted-foreground">
                  <th className="text-left font-medium px-5 py-3">Descripción</th>
                  <th className="text-left font-medium px-5 py-3">Tipo</th>
                  <th className="text-left font-medium px-5 py-3">Fecha</th>
                  <th className="text-right font-medium px-5 py-3">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {items.map((item) => (
                  <tr key={`${item.tipo}-${item.id}`} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium">{item.descripcion}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${
                        item.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.tipo === 'ingreso' ? (
                          <><Receipt className="w-3.5 h-3.5" /> Ingreso</>
                        ) : (
                          <><ShoppingCart className="w-3.5 h-3.5" /> Gasto</>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {formatDate(item.fecha)}
                    </td>
                    <td className={`px-5 py-3.5 text-right font-semibold tabular-nums ${
                      item.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(item.monto)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border/60 bg-muted/20">
                  <td colSpan={3} className="px-5 py-4 text-right font-bold text-sm">
                    TOTAL
                  </td>
                  <td className={`px-5 py-4 text-right font-bold text-base tabular-nums ${balanceColor}`}>
                    {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartidoBalance;
