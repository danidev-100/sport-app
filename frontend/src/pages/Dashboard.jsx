import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import MetricasCards from '../components/dashboard/MetricasCards';
import DonutChart from '../components/dashboard/DonutChart';
import RecientesList from '../components/dashboard/RecientesList';

const Dashboard = () => {
  const [metricas, setMetricas] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [recientes, setRecientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricasRes, chartRes, recientesRes] = await Promise.all([
          apiClient.get('/dashboard/metricas'),
          apiClient.get(`/dashboard/cuotas-grafico?anio=${new Date().getFullYear()}`),
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
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Resumen</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Panorama general del club
          </p>
        </div>
        <span className="text-sm text-muted-foreground">{new Date().getFullYear()}</span>
      </div>

      <MetricasCards metricas={metricas} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <DonutChart data={chartData} loading={loading} />
        </div>
        <div className="lg:col-span-2">
          <RecientesList jugadores={recientes} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
