import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';

const meses = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' }
];

const GenerarCuotas = ({ onSubmit, loading }) => {
  const { register, handleSubmit } = useForm();
  const [jugadores, setJugadores] = useState([]);
  const [loadingJugadores, setLoadingJugadores] = useState(true);

  useEffect(() => {
    apiClient.get('/jugadores').then(res => {
      setJugadores(res.data.jugadores || []);
      setLoadingJugadores(false);
    }).catch(() => setLoadingJugadores(false));
  }, []);

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="dark-card p-4 rounded-2xl mb-6">
      <h3 className="text-lg font-bold text-white mb-4">Generar Cuota para Jugador</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Jugador</label>
          {loadingJugadores ? (
            <div className="dark-select">Cargando...</div>
          ) : (
            <select {...register('jugadorId')} className="dark-select" required>
              <option value="">Seleccionar jugador</option>
              {jugadores.filter(j => j.activo).map((j) => (
                <option key={j.id} value={j.id}>{j.nombre} ({j.categoria})</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Número de Identificación</label>
          <input
            {...register('numeroIdentificacion')}
            className="dark-input"
            placeholder="Ej: CUOTA-001"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Mes</label>
          <select {...register('mes')} className="dark-select">
            {meses.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Año</label>
          <select {...register('anio')} className="dark-select">
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-400 mb-2">Monto</label>
          <input
            {...register('monto')}
            type="number"
            className="dark-input"
            placeholder="10000"
            required
          />
        </div>
      </div>

      <Button type="submit" loading={loading} className="btn-green mt-4">
        Generar Cuota
      </Button>
    </form>
  );
};

export default GenerarCuotas;