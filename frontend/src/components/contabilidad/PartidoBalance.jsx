import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { getIngresos, getGastos } from '../../api/contabilidad';

const PartidoBalance = ({ partidoId, refreshTrigger }) => {
  const [loading, setLoading] = useState(true);
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [totalGastos, setTotalGastos] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = { partidoId };
        const [ingRes, gasRes] = await Promise.all([
          getIngresos(params),
          getGastos(params),
        ]);
        const ingresos = ingRes.data?.ingresos || [];
        const gastos = gasRes.data?.gastos || [];
        setTotalIngresos(ingresos.reduce((sum, i) => sum + Number(i.monto), 0));
        setTotalGastos(gastos.reduce((sum, g) => sum + Number(g.monto), 0));
      } catch (err) {
        console.error('Error fetching partido balance:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [partidoId, refreshTrigger]);

  const balance = totalIngresos - totalGastos;
  const balanceColor =
    balance > 0 ? 'text-green-500' : balance < 0 ? 'text-red-500' : 'text-muted-foreground';
  const BalanceIcon = balance > 0 ? TrendingUp : balance < 0 ? TrendingDown : DollarSign;

  const formatCurrency = (value) =>
    Number(value).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  if (loading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
        <div className="spinner mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Cargando balance...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-card border border-border/50 rounded-xl p-6 space-y-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="text-sm text-muted-foreground font-medium">Ingresos</span>
        </div>
        <p className="text-2xl font-bold text-green-500">{formatCurrency(totalIngresos)}</p>
      </div>

      <div className="bg-card border border-border/50 rounded-xl p-6 space-y-2">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-red-500" />
          <span className="text-sm text-muted-foreground font-medium">Gastos</span>
        </div>
        <p className="text-2xl font-bold text-red-500">{formatCurrency(totalGastos)}</p>
      </div>

      <div className="bg-card border border-border/50 rounded-xl p-6 space-y-2">
        <div className="flex items-center gap-2">
          <BalanceIcon className={`w-4 h-4 ${balanceColor}`} />
          <span className="text-sm text-muted-foreground font-medium">Balance</span>
        </div>
        <p className={`text-2xl font-bold ${balanceColor}`}>{formatCurrency(balance)}</p>
      </div>
    </div>
  );
};

export default PartidoBalance;
