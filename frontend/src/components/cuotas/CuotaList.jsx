import Table from '../common/Table';
import Button from '../common/Button';
import { formatCurrency, formatMonth, getEstadoCuota } from '../../utils/formatters';

const CuotaList = ({ cuotas, onPagar, onView, loading }) => {
  const columns = [
    { 
      header: 'Jugador', 
      key: 'jugador',
      render: (row) => <span className="text-white">{row.jugador?.nombre || '-'}</span>
    },
    { 
      header: 'Período', 
      render: (row) => <span className="text-gray-400">{formatMonth(row.mes)} {row.anio}</span>
    },
    { 
      header: 'Monto', 
      key: 'monto',
      render: (row) => <span className="text-white font-medium">{formatCurrency(row.monto)}</span>
    },
    {
      header: 'Estado',
      render: (row) => {
        const estado = getEstadoCuota(row);
        return (
          <span className={`badge ${estado === 'pagada' ? 'badge-green' : estado === 'parcial' ? 'badge-muted' : 'badge-red'}`}>
            {estado === 'pagada' ? 'Pagada' : estado === 'parcial' ? 'Parcial' : 'Pendiente'}
          </span>
        );
      }
    },
    {
      header: 'Vencimiento',
      key: 'fechaVencimiento',
      render: (row) => <span className="text-gray-500">{new Date(row.fechaVencimiento).toLocaleDateString('es-AR')}</span>
    },
    {
      header: 'Acciones',
      render: (row) => {
        const estado = getEstadoCuota(row);
        return (
          <div className="flex gap-2">
            {estado !== 'pagada' && (
              <Button size="sm" className="btn-green" onClick={(e) => { e.stopPropagation(); onPagar?.(row); }}>
                Pagar
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  return <Table columns={columns} data={cuotas} loading={loading} onRowClick={onView} emptyMessage="No hay cuotas" />;
};

export default CuotaList;