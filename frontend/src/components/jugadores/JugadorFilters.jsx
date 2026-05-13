import Input from '../common/Input';

const posiciones = ['', 'PORTERO', 'DEFENSA', 'CENTROCAMPISTA', 'DELANTERO'];

const JugadorFilters = ({ filters, onChange }) => {
  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="dark-card p-4 rounded-2xl mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={filters.busqueda || ''}
            onChange={(e) => handleChange('busqueda', e.target.value)}
            className="dark-input"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Posición</label>
          <select
            value={filters.posicion || ''}
            onChange={(e) => handleChange('posicion', e.target.value)}
            className="dark-select"
          >
            {posiciones.map((p) => (
              <option key={p} value={p}>
                {p === '' ? 'Todas' : p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Estado</label>
          <select
            value={filters.activo ?? ''}
            onChange={(e) => handleChange('activo', e.target.value === '' ? '' : e.target.value === 'true')}
            className="dark-select"
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default JugadorFilters;