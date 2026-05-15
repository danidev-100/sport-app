import { useState, useEffect } from 'react';
import { getBalance } from '../../api/contabilidad';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const BalanceCard = ({ refreshTrigger }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBalance = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getBalance();
        setData(res.data);
      } catch (err) {
        console.error('Error fetching balance:', err);
        setError('Error al cargar el balance');
      } finally {
        setLoading(false);
      }
    };
    fetchBalance();
  }, [refreshTrigger]);

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

  if (error) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
        <p className="text-destructive font-medium">{error}</p>
      </div>
    );
  }

  const balanceValue = Number(data?.balance || 0);
  const ingresosValue = Number(data?.totalIngresos || 0);
  const gastosValue = Number(data?.totalGastos || 0);

  const balanceColor =
    balanceValue > 0
      ? 'text-green-500'
      : balanceValue < 0
        ? 'text-red-500'
        : 'text-muted-foreground';

  const balanceIcon =
    balanceValue > 0
      ? TrendingUp
      : balanceValue < 0
        ? TrendingDown
        : DollarSign;

  const BalanceIcon = balanceIcon;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Ingresos */}
      <div className="bg-card border border-border/50 rounded-xl p-6 space-y-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="text-sm text-muted-foreground font-medium">
            Total Ingresos
          </span>
        </div>
        <p className="text-2xl font-bold text-green-500">
          {formatCurrency(ingresosValue)}
        </p>
      </div>

      {/* Total Gastos */}
      <div className="bg-card border border-border/50 rounded-xl p-6 space-y-2">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-red-500" />
          <span className="text-sm text-muted-foreground font-medium">
            Total Gastos
          </span>
        </div>
        <p className="text-2xl font-bold text-red-500">
          {formatCurrency(gastosValue)}
        </p>
      </div>

      {/* Balance */}
      <div className="bg-card border border-border/50 rounded-xl p-6 space-y-2">
        <div className="flex items-center gap-2">
          <BalanceIcon className={`w-4 h-4 ${balanceColor}`} />
          <span className="text-sm text-muted-foreground font-medium">
            Balance
          </span>
        </div>
        <p className={`text-2xl font-bold ${balanceColor}`}>
          {formatCurrency(balanceValue)}
        </p>
      </div>
    </div>
  );
};

export default BalanceCard;
