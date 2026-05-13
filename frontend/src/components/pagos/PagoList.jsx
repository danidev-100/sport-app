import Table from '../common/Table';
import Button from '../common/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';

const PagoList = ({ pagos, onDelete, loading }) => {
  const columns = [
    { 
      header: 'Cuota', 
      render: (row) => {
        const cuota = row.cuota;
        if (!cuota) return '-';
        return <span className="text-white">{cuota.jugador?.nombre || ''} - {cuota.mes}/{cuota.anio}</span>;
      }
    },
    { 
      header: 'Monto', 
      key: 'monto',
      render: (row) => <span className="text-green-500 font-medium">{formatCurrency(row.monto)}</span>
    },
    { 
      header: 'Fecha Pago', 
      key: 'fechaPago',
      render: (row) => <span className="text-gray-400">{formatDate(row.fechaPago)}</span>
    },
    { header: 'Método', key: 'metodoPago', render: (row) => <span className="text-gray-400">{row.metodoPago || '-'}</span> },
    { header: 'Observación', key: 'observacion', render: (row) => <span className="text-gray-500">{row.observacion || '-'}</span> },
    {
      header: 'Acciones',
      render: (row) => (
        <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); onDelete?.(row); }}>
          Eliminar
        </Button>
      )
    }
  ];

  return <Table columns={columns} data={pagos} loading={loading} emptyMessage="No hay pagos registrados" />;
};

export default PagoList;