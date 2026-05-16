import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const FechaForm = ({ open, onOpenChange, onSubmit, initialData, loading }) => {
  const [titulo, setTitulo] = useState('');

  useEffect(() => {
    if (open) {
      setTitulo(initialData?.titulo || '');
    }
  }, [open, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    onSubmit({ titulo: titulo.trim() });
    setTitulo('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Partido' : 'Nuevo Partido'}</DialogTitle>
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
              autoFocus
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !titulo.trim()}>
              {initialData ? 'Guardar' : 'Crear Partido'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FechaForm;
