import { useState, useCallback, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Search, Plus, Pencil, Trash2, User } from 'lucide-react';

const categorias = ['C7', 'C11', 'C13', 'C15', 'C17', 'C20', 'PRIMERA', 'SENIOR', 'VETERANO'];

const JugadorForm = ({ onSubmit, initialData, loading }) => {
  const [formData, setFormData] = useState(initialData || { nombre: '', categoria: 'SENIOR', edad: '', telefono: '', email: '' });

  const handleChange = (field, value) => {
    if (value === '' || value === undefined) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, edad: parseInt(formData.edad) || 0 });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Nombre</label>
        <Input value={formData.nombre} onChange={(e) => handleChange('nombre', e.target.value)} placeholder="Nombre completo" />
      </div>
      
      <div>
        <label className="text-sm font-medium mb-2 block">Categoría</label>
        <Select value={formData.categoria} onValueChange={(value) => handleChange('categoria', value)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {categorias.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Edad</label>
        <Input value={formData.edad} onChange={(e) => handleChange('edad', e.target.value)} type="number" placeholder="18" />
      </div>
      
      <div>
        <label className="text-sm font-medium mb-2 block">Teléfono</label>
        <Input value={formData.telefono} onChange={(e) => handleChange('telefono', e.target.value)} placeholder="+54 9 11 1234 5678" />
      </div>
      
      <div>
        <label className="text-sm font-medium mb-2 block">Email</label>
        <Input value={formData.email} onChange={(e) => handleChange('email', e.target.value)} type="email" placeholder="jugador@email.com" />
      </div>
      
      <Button type="submit" disabled={loading} className="w-full mt-4">
        {initialData ? 'Actualizar' : 'Crear Jugador'}
      </Button>
    </form>
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
      const res = await apiClient.get(`/jugadores?${params.toString()}`);
      setJugadores(res.data.jugadores || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    // Fetch jugadores on mount and whenever the filtro changes
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jugadores</h1>
          <p className="text-muted-foreground">{jugadores.length} jugadores</p>
        </div>
        <Button onClick={() => { setEditingJugador(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo
        </Button>
      </div>

      <div className="flex gap-3">
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
          onValueChange={(value) => setFiltro(prev => prev.categoria === value ? {busqueda: prev.busqueda, categoria: ''} : {...prev, categoria: value === 'all' ? '' : value})}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categorias.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Cargando...</div>
      ) : jugadores.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No hay jugadores</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Nombre</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Categoría</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Edad</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Teléfono</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Estado</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {jugadores.map((j) => (
                  <tr key={j.id} className="border-b">
                    <td className="p-4">{j.nombre}</td>
                    <td className="p-4 text-primary">
                      <button
                        onClick={() => setFiltro(prev => ({ ...prev, categoria: prev.categoria === j.categoria ? '' : j.categoria }))}
                        className="underline text-primary/90 hover:text-primary"
                      >
                        {j.categoria || '-'}
                      </button>
                    </td>
                    <td className="p-4 text-muted-foreground">{j.edad}</td>
                    <td className="p-4 text-muted-foreground">{j.telefono || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-xs ${j.activo ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                        {j.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setEditingJugador(j); setModalOpen(true); }}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(j)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingJugador ? 'Editar Jugador' : 'Nuevo Jugador'}</DialogTitle>
          </DialogHeader>
          <JugadorForm onSubmit={handleSubmit} initialData={editingJugador} loading={saving} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Jugadores;
