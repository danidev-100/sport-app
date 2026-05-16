import { DollarSign } from 'lucide-react';
import { formatCurrency, formatMonth } from '../../utils/formatters';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const IngresosMensualesModal = ({ open, onOpenChange, data, loading }) => {
  const totalGeneral = (data || []).reduce((sum, row) => sum + parseFloat(row.total), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-violet-500" />
            Ingresos por Mes
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <DollarSign className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
            <p>No hay ingresos registrados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Table */}
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border/50">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Año</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Mes</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {data.map((row, i) => (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{row.anio}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatMonth(row.mes)}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(row.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <span className="font-bold text-sm">Total General</span>
              <span className="font-bold text-lg text-violet-600">
                {formatCurrency(totalGeneral)}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default IngresosMensualesModal;
