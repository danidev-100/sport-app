import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const FechaForm = ({ open, onOpenChange, onSubmit, loading }) => {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fecha || !descripcion || !monto) return;
    onSubmit({ fecha, descripcion, monto: parseFloat(monto) });
    setDescripcion('');
    setMonto('');
    setFecha(new Date().toISOString().split('T')[0]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Fecha</DialogTitle>
          <DialogDescription>
            Creá un nuevo movimiento para esta fecha
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Fecha
            </label>
            <Input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Descripción
            </label>
            <Input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Entradas partido vs River"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Monto
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="15000.00"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              Crear Fecha
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FechaForm;
