import { useState } from 'react';
import { AlertTriangle, Users, ChevronDown, ChevronRight, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const MorososModal = ({ open, onOpenChange, morososData, loading }) => {
  const [expandedCat, setExpandedCat] = useState(null);

  const toggleCat = (cat) => {
    setExpandedCat(expandedCat === cat ? null : cat);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            Jugadores Morosos
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" />
          </div>
        ) : !morososData || morososData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
            <p>No hay morosos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {morososData.map((cat) => (
              <div key={cat.categoria} className="rounded-xl border border-border/50 overflow-hidden">
                {/* Category header — clickeable */}
                <button
                  onClick={() => toggleCat(cat.categoria)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    {expandedCat === cat.categoria ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="font-semibold text-sm">{cat.categoria}</span>
                    <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                      {cat.cantidad} jugador{cat.cantidad !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-rose-500">
                    {formatCurrency(cat.total)}
                  </span>
                </button>

                {/* Expanded players table */}
                {expandedCat === cat.categoria && (
                  <div className="divide-y divide-border/30">
                    {cat.jugadores.map((moroso) => (
                      <div key={moroso.jugador.id} className="px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{moroso.jugador.nombre}</span>
                          <span className="text-sm font-bold text-rose-500">
                            {formatCurrency(moroso.totalAdeudado)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {moroso.cuotas.map((c, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-xs bg-rose-500/10 text-rose-600 px-2 py-1 rounded-md"
                            >
                              <DollarSign className="w-3 h-3" />
                              {MESES[c.mes - 1]} {c.anio}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Total general */}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/30 border border-border/50">
              <span className="font-bold text-sm">Total Adeudado</span>
              <span className="font-bold text-lg text-rose-500">
                {formatCurrency(morososData.reduce((s, c) => s + c.total, 0))}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MorososModal;
