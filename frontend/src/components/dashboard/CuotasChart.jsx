import { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  Legend,
  Cell,
} from 'recharts';

const CuotasChart = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const year = new Date().getFullYear();
        const res = await apiClient.get(`/dashboard/cuotas-grafico?anio=${year}`);
        // transform data into array of objects for recharts
        const meses = res.data.meses || [];
        const pagadas = res.data.pagadas || [];
        const pendientes = res.data.pendientes || [];
        const data = meses.map((m, i) => ({
          mes: m,
          pagadas: pagadas[i] || 0,
          pendientes: pendientes[i] || 0,
          pct: Math.round(((pagadas[i] || 0) / ((pagadas[i] || 0) + (pendientes[i] || 0) || 1)) * 100),
          label: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][i] || m,
        }));
        setChartData(data);
      } catch (err) {
        console.error('Error fetching chart data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="dark-card p-6 rounded-2xl animate-pulse h-72"></div>;
  }

  if (!chartData) {
    return <div className="dark-card p-6 rounded-2xl">No hay datos</div>;
  }

  const handleSlider = (e) => setSelectedMonth(Number(e.target.value));

  return (
    <div className="dark-card p-4 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">Porcentaje de Cuotas Pagas</h3>
          <p className="text-sm text-gray-500 mt-1">Selecciona un mes para ver el porcentaje pagado</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="dark-select bg-transparent"
            >
              {chartData.map((d, i) => (
                <option key={d.mes} value={i}>{d.label}</option>
              ))}
            </select>
            <input
              type="range"
              min={0}
              max={chartData.length - 1}
              value={selectedMonth}
              onChange={handleSlider}
              className="w-40 mt-2"
              aria-label="Seleccionar mes"
            />
          </div>

          <div className="hidden sm:flex flex-col items-center">
            <div className="text-sm text-gray-400">{chartData[selectedMonth]?.label}</div>
            <div className="text-xl font-bold">{chartData[selectedMonth]?.pct}%</div>
            <span className="sr-only" aria-live="polite">{chartData[selectedMonth]?.pct}% pagadas</span>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="label" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <ReTooltip formatter={(value, name) => [value, name === 'pagadas' ? 'Pagadas' : 'Pendientes']} />
            <Legend />
            <Bar dataKey="pendientes" stackId="a" fill="#ef4444" isAnimationActive>
              {chartData.map((entry, idx) => (
                <Cell key={`pen-${idx}`} fill="#ef4444" opacity={selectedMonth === idx ? 1 : 0.7} />
              ))}
            </Bar>
            <Bar dataKey="pagadas" stackId="a" fill="#22c55e" isAnimationActive>
              {chartData.map((entry, idx) => (
                <Cell key={`pag-${idx}`} fill="#22c55e" opacity={selectedMonth === idx ? 1 : 0.9} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CuotasChart;
