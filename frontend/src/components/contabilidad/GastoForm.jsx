import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const GastoForm = ({ open, onOpenChange, onSubmit, initialData, loading }) => {
  const [formData, setFormData] = useState(
    initialData || {
      descripcion: '',
      monto: '',
      fecha: new Date().toISOString().split('T')[0],
      partidoId: '',
    }
  );

  useEffect(() => {
    if (open) {
      setFormData(
        initialData
          ? {
              descripcion: initialData.descripcion || '',
              monto: initialData.monto?.toString() || '',
              fecha: initialData.fecha
                ? new Date(initialData.fecha).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0],
              partidoId: initialData.partidoId || '',
            }
          : {
              descripcion: '',
              monto: '',
              fecha: new Date().toISOString().split('T')[0],
              partidoId: '',
            }
      );
    }
  }, [open, initialData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      descripcion: formData.descripcion,
      monto: parseFloat(formData.monto),
    };
    if (formData.fecha) payload.fecha = formData.fecha;
    if (formData.partidoId) payload.partidoId = formData.partidoId;
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Gasto' : 'Nuevo Gasto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Descripción
            </label>
            <Input
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Ej: Servicio de luz"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Monto
            </label>
            <Input
              value={formData.monto}
              onChange={(e) => handleChange('monto', e.target.value)}
              type="number"
              step="0.01"
              min="0.01"
              placeholder="15000.00"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Fecha
            </label>
            <Input
              value={formData.fecha}
              onChange={(e) => handleChange('fecha', e.target.value)}
              type="date"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {initialData ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GastoForm;
