import { useState, useEffect } from 'react';
import { getBalance, getBalancePorFecha } from '../../api/contabilidad';
import { TrendingUp, TrendingDown, DollarSign, ChevronDown, ChevronRight, Receipt, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BalanceCard = ({ refreshTrigger }) => {
  const [globalData, setGlobalData] = useState(null);
  const [porFecha, setPorFecha] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDates, setExpandedDates] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [globalRes, porFechaRes] = await Promise.all([
          getBalance(),
          getBalancePorFecha(),
        ]);
        setGlobalData(globalRes.data);
        setPorFecha(porFechaRes.data?.balancePorFecha || []);
      } catch (err) {
        console.error('Error fetching balance:', err);
        setError('Error al cargar el balance');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshTrigger]);

  const toggleDate = (fecha) => {
    setExpandedDates((prev) => ({ ...prev, [fecha]: !prev[fecha] }));
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

  const balanceValue = Number(globalData?.balance || 0);
  const ingresosValue = Number(globalData?.totalIngresos || 0);
  const gastosValue = Number(globalData?.totalGastos || 0);

  const balanceColor =
    balanceValue > 0
      ? 'text-green-500'
      : balanceValue < 0
        ? 'text-red-500'
        : 'text-muted-foreground';

  const BalanceIcon = balanceValue > 0 ? TrendingUp : balanceValue < 0 ? TrendingDown : DollarSign;

  return (
    <div className="space-y-6">
      {/* Global Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <div className="bg-card border border-border/50 rounded-xl p-6 space-y-2">
          <div className="flex items-center gap-2">
            <BalanceIcon className={`w-4 h-4 ${balanceColor}`} />
            <span className="text-sm text-muted-foreground font-medium">
              Balance Global
            </span>
          </div>
          <p className={`text-2xl font-bold ${balanceColor}`}>
            {formatCurrency(balanceValue)}
          </p>
        </div>
      </div>

      {/* Balance por Fecha */}
      <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50">
          <h3 className="font-semibold text-lg">Balance por Fecha</h3>
        </div>

        {porFecha.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No hay movimientos registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {porFecha.map((item) => {
              const isExpanded = expandedDates[item.fecha];
              const dateBalanceColor =
                item.balance > 0
                  ? 'text-green-500'
                  : item.balance < 0
                    ? 'text-red-500'
                    : 'text-muted-foreground';

              return (
                <div key={item.fecha}>
                  {/* Date header — click to expand */}
                  <button
                    onClick={() => toggleDate(item.fecha)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">{formatDate(item.fecha)}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-green-500 font-medium">
                        +{formatCurrency(item.totalIngresos)}
                      </span>
                      <span className="text-red-500 font-medium">
                        -{formatCurrency(item.totalGastos)}
                      </span>
                      <span className={`font-semibold min-w-[100px] text-right ${dateBalanceColor}`}>
                        {item.balance >= 0 ? '+' : ''}{formatCurrency(item.balance)}
                      </span>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-6 pb-4 pl-14 space-y-3">
                      {/* Ingresos */}
                      {item.ingresos.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Receipt className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Ingresos
                            </span>
                          </div>
                          <div className="space-y-1">
                            {item.ingresos.map((ing) => (
                              <div
                                key={ing.id}
                                className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-muted/30"
                              >
                                <span className="text-sm">{ing.descripcion}</span>
                                <span className="text-sm font-medium text-green-500">
                                  +{formatCurrency(ing.monto)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Gastos */}
                      {item.gastos.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <ShoppingCart className="w-3.5 h-3.5 text-red-500" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Gastos
                            </span>
                          </div>
                          <div className="space-y-1">
                            {item.gastos.map((gasto) => (
                              <div
                                key={gasto.id}
                                className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-muted/30"
                              >
                                <span className="text-sm">{gasto.descripcion}</span>
                                <span className="text-sm font-medium text-red-500">
                                  -{formatCurrency(gasto.monto)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceCard;
