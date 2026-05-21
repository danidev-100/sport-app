import { useState, useCallback, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Pencil, Trash2, User, Filter } from 'lucide-react';

const categorias = ['C7', 'C11', 'C13', 'C15', 'C17', 'C20', 'PRIMERA', 'SENIOR', 'VETERANO'];

const JugadorFormDialog = ({ open, onOpenChange, onSubmit, initialData, loading }) => {
  const [formData, setFormData] = useState(
    initialData || { nombre: '', categoria: 'SENIOR', edad: '', telefono: '', email: '' }
  );

  useEffect(() => {
    if (open) {
      setFormData(initialData || { nombre: '', categoria: 'SENIOR', edad: '', telefono: '', email: '' });
    }
  }, [open, initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert('Ingresá un email válido');
      return;
    }
    onSubmit({ ...formData, edad: parseInt(formData.edad) || 0 });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Jugador' : 'Nuevo Jugador'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Nombre</label>
            <Input
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Nombre completo"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Categoría</label>
              <Select value={formData.categoria} onValueChange={(value) => handleChange('categoria', value)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Edad</label>
              <Input value={formData.edad} onChange={(e) => handleChange('edad', e.target.value)} type="number" placeholder="Edad" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
            <Input value={formData.telefono} onChange={(e) => handleChange('telefono', e.target.value)} placeholder="+54 9 11 1234 5678" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <Input value={formData.email} onChange={(e) => handleChange('email', e.target.value)} type="email" placeholder="jugador@email.com" />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {initialData ? 'Actualizar Jugador' : 'Crear Jugador'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Jugadores = () => {
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filtro, setFiltro] = useState({ busqueda: '', categoria: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJugador, setEditingJugador] = useState(null);

  const fetchJugadores = useCallback(async () => {
    setLoading(true);
    try {
      const cleanFilters = {};
      if (filtro.busqueda) cleanFilters.busqueda = filtro.busqueda;
      if (filtro.categoria && filtro.categoria !== 'all') cleanFilters.categoria = filtro.categoria;
      const params = new URLSearchParams(cleanFilters).toString();
      const res = await apiClient.get(`/jugadores?${params}`);
      setJugadores(res.data.jugadores || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    fetchJugadores();
  }, [fetchJugadores]);

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      if (editingJugador) {
        await apiClient.put(`/jugadores/${editingJugador.id}`, data);
      } else {
        await apiClient.post('/jugadores', data);
      }
      setModalOpen(false);
      setEditingJugador(null);
      fetchJugadores();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (jugador) => {
    if (confirm(`¿Eliminar a ${jugador.nombre}?`)) {
      try {
        await apiClient.delete(`/jugadores/${jugador.id}`);
        fetchJugadores();
      } catch (err) {
        console.error('Error:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold tracking-tight">Jugadores</h1>
          <p className="text-sm text-muted-foreground mt-1">{jugadores.length} jugadores registrados</p>
        </div>
        <Button onClick={() => { setEditingJugador(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={filtro.busqueda}
            onChange={(e) => setFiltro(prev => ({ ...prev, busqueda: e.target.value }))}
            className="pl-10"
          />
        </div>
        <Select
          value={filtro.categoria || undefined}
          onValueChange={(value) => setFiltro(prev => ({
            ...prev,
            categoria: prev.categoria === value ? '' : value === 'all' ? '' : value
          }))}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categorias.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
          <div className="spinner mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Cargando jugadores...</p>
        </div>
      ) : jugadores.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
            <User className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium mb-1">No hay jugadores</p>
          <p className="text-sm text-muted-foreground/60">Agregá tu primer jugador para empezar</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Nombre</TableHead>
                <TableHead className="font-semibold">Categoría</TableHead>
                <TableHead className="font-semibold">Edad</TableHead>
                <TableHead className="hidden md:table-cell font-semibold">Teléfono</TableHead>
                <TableHead className="font-semibold">Estado</TableHead>
                <TableHead className="text-right font-semibold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jugadores.map((j) => (
                <TableRow key={j.id} className="group">
                  <TableCell className="font-medium">{j.nombre}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => setFiltro(prev => ({
                        ...prev,
                        categoria: prev.categoria === j.categoria ? '' : j.categoria
                      }))}
                      className="text-primary hover:text-primary-lighter hover:underline transition-colors text-sm"
                    >
                      {j.categoria || '-'}
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{j.edad}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{j.telefono || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={j.activo ? 'default' : 'destructive'} className="font-medium">
                      {j.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => { setEditingJugador(j); setModalOpen(true); }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(j)}
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

      <JugadorFormDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleSubmit}
        initialData={editingJugador}
        loading={saving}
      />
    </div>
  );
};

export default Jugadores;
