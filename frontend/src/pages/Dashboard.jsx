import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import apiClient from '../api/apiClient';
import MetricasCards from '../components/dashboard/MetricasCards';
import DonutChart from '../components/dashboard/DonutChart';
import RecientesList from '../components/dashboard/RecientesList';
import MorososModal from '../components/dashboard/MorososModal';
import IngresosMensualesModal from '../components/dashboard/IngresosMensualesModal';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i); // últimos 2, actual, próximos 2

const Dashboard = () => {
  const [metricas, setMetricas] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [recientes, setRecientes] = useState([]);
  const [morososData, setMorososData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [morososOpen, setMorososOpen] = useState(false);
  const [ingresosOpen, setIngresosOpen] = useState(false);
  const [ingresosData, setIngresosData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMorosos, setLoadingMorosos] = useState(false);
  const [loadingIngresos, setLoadingIngresos] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [metricasRes, chartRes, recientesRes] = await Promise.all([
          apiClient.get('/dashboard/metricas'),
          apiClient.get(`/dashboard/cuotas-grafico?anio=${selectedYear}`),
          apiClient.get('/jugadores/recientes?limit=5')
        ]);
        setMetricas(metricasRes.data);
        setRecientes(recientesRes.data?.jugadores || recientesRes.data || []);

        const data = chartRes.data;
        const meses = data.meses || [];
        const pagadas = data.pagadas || [];
        const pendientes = data.pendientes || [];
        const labels = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        setChartData(
          meses.map((m, i) => ({
            mes: m,
            pagadas: pagadas[i] || 0,
            pendientes: pendientes[i] || 0,
            total: (pagadas[i] || 0) + (pendientes[i] || 0),
            label: labels[i] || m,
          }))
        );
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setRecientes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedYear]);

  const handleMorososClick = async () => {
    setMorososOpen(true);
    if (!morososData) {
      setLoadingMorosos(true);
      try {
        const res = await apiClient.get('/dashboard/morosos');
        setMorososData(res.data?.porCategoria || []);
      } catch (err) {
        console.error('Error fetching morosos:', err);
      } finally {
        setLoadingMorosos(false);
      }
    }
  };

  const handleIngresosClick = async () => {
    setIngresosOpen(true);
    if (!ingresosData) {
      setLoadingIngresos(true);
      try {
        const res = await apiClient.get('/dashboard/ingresos-mensuales');
        setIngresosData(res.data || []);
      } catch (err) {
        console.error('Error fetching ingresos mensuales:', err);
      } finally {
        setLoadingIngresos(false);
      }
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold tracking-tight">Resumen</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Panorama general del club
          </p>
        </div>
        <div className="relative">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="appearance-none rounded-lg border border-border/50 bg-muted/40 px-3 py-1.5 pr-8 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {YEARS.map((y) => (
              <option key={y} value={y} className="bg-card">{y}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Metrics */}
      <div className="animate-slide-up">
        <MetricasCards metricas={metricas} loading={loading} onMorososClick={handleMorososClick} onIngresosClick={handleIngresosClick} />
      </div>

      {/* Charts & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6 animate-slide-up">
        <div className="lg:col-span-3">
          <DonutChart data={chartData} loading={loading} />
        </div>
        <div className="lg:col-span-2">
          <RecientesList jugadores={recientes} loading={loading} />
        </div>
      </div>

      <MorososModal open={morososOpen} onOpenChange={setMorososOpen}
        morososData={morososData} loading={loadingMorosos} />
      <IngresosMensualesModal open={ingresosOpen} onOpenChange={setIngresosOpen}
        data={ingresosData} loading={loadingIngresos} />
    </div>
  );
};

export default Dashboard;
