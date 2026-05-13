import Table from '../common/Table';
import Button from '../common/Button';
import { formatCurrency } from '../../utils/formatters';

const MorososList = ({ morosos, onPagar }) => {
  const columns = [
    { 
      header: 'Jugador', 
      render: (row) => <span className="text-white font-medium">{row.jugador?.nombre}</span>
    },
    { 
      header: 'Cuotas Pendientes', 
      key: 'cuotasPendientes',
      render: (row) => <span className="text-red-400 font-bold">{row.cuotasPendientes}</span>
    },
    { 
      header: 'Total Adeudado', 
      key: 'totalAdeudado',
      render: (row) => <span className="text-red-400 font-bold">{formatCurrency(row.totalAdeudado)}</span>
    },
    {
      header: 'Acciones',
      render: (row) => (
        <Button size="sm" className="btn-green" onClick={(e) => { e.stopPropagation(); onPagar?.(row); }}>
          Registrar Pago
        </Button>
      )
    }
  ];

  return (
    <div>
      <h3 className="text-lg font-bold text-white mb-4">Jugadores Morosos</h3>
      <Table columns={columns} data={morosos} emptyMessage="No hay jugadores morosos" />
    </div>
  );
};

export default MorososList;