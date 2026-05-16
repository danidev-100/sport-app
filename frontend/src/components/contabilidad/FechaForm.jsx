import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const FechaForm = ({ open, onOpenChange, onSubmit, initialData, loading }) => {
  const [titulo, setTitulo] = useState('');
  const [fecha, setFecha] = useState('');

  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitulo(initialData.titulo || '');
        setFecha(
          initialData.fecha
            ? new Date(initialData.fecha).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]
        );
      } else {
        setTitulo('');
        setFecha(new Date().toISOString().split('T')[0]);
      }
    }
  }, [open, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!titulo) return;
    onSubmit({ titulo, fecha });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Fecha' : 'Nueva Fecha'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Título
            </label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Partido vs River Plate"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Fecha del evento
            </label>
            <Input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {initialData ? 'Guardar' : 'Crear Fecha'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FechaForm;
