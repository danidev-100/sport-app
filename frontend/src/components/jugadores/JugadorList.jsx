import Table from '../common/Table';
import Button from '../common/Button';
import { getPosicionLabel } from '../../utils/formatters';

const JugadorList = ({ jugadores, onEdit, onDelete, onView, loading }) => {
  const columns = [
    { 
      header: 'Nombre', 
      key: 'nombre',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.fotoUrl && (
            <img src={row.fotoUrl} alt={row.nombre} className="w-10 h-10 rounded-xl object-cover" />
          )}
          {!row.fotoUrl && (
            <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 font-bold">
              {row.nombre.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-medium text-white">{row.nombre}</span>
        </div>
      )
    },
    { 
      header: 'Posición', 
      key: 'posicion',
      render: (row) => (
        <span className="text-gray-400">{getPosicionLabel(row.posicion)}</span>
      )
    },
    { header: 'Edad', key: 'edad', render: (row) => <span className="text-gray-400">{row.edad}</span> },
    { header: 'Teléfono', key: 'telefono', render: (row) => <span className="text-gray-400">{row.telefono || '-'}</span> },
    { header: 'Email', key: 'email', render: (row) => <span className="text-gray-400">{row.email || '-'}</span> },
    {
      header: 'Estado',
      key: 'activo',
      render: (row) => (
        <span className={`badge ${row.activo ? 'badge-green' : 'badge-red'}`}>
          {row.activo ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      header: 'Acciones',
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onEdit?.(row); }}>
            Editar
          </Button>
          <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); onDelete?.(row); }}>
            Eliminar
          </Button>
        </div>
      )
    }
  ];

  return <Table columns={columns} data={jugadores} loading={loading} onRowClick={onView} emptyMessage="No hay jugadores" />;
};

export default JugadorList;