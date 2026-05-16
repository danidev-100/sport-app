import { useState, useEffect } from 'react';
import { getGastos, deleteGasto } from '../../api/contabilidad';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Pencil, Trash2, Receipt } from 'lucide-react';

const GastoList = ({ onEdit, refreshTrigger, partidoId }) => {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGastos = async () => {
      setLoading(true);
      try {
        const params = {};
        if (partidoId) params.partidoId = partidoId;
        const res = await getGastos(params);
        setGastos(res.data?.gastos || []);
      } catch (err) {
        console.error('Error fetching gastos:', err);
        setGastos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchGastos();
  }, [partidoId, refreshTrigger]);

  const handleDelete = async (gasto) => {
    if (window.confirm('¿Eliminar este gasto?')) {
      try {
        await deleteGasto(gasto.id);
        setGastos((prev) => prev.filter((g) => g.id !== gasto.id));
      } catch (err) {
        console.error('Error deleting gasto:', err);
      }
    }
  };

  const formatCurrency = (value) =>
    Number(value).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  if (loading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
        <div className="spinner mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Cargando gastos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Content */}
      {gastos.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No hay gastos registrados</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Descripción</TableHead>
                <TableHead className="font-semibold">Monto</TableHead>
                <TableHead className="font-semibold">Fecha</TableHead>
                <TableHead className="text-right font-semibold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gastos.map((row) => (
                <TableRow key={row.id} className="group">
                  <TableCell className="font-medium">{row.descripcion}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatCurrency(row.monto)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(row.fecha)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => onEdit(row)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(row)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default GastoList;
