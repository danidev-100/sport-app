import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

const UserForm = ({ onSubmit, initialData, loading }) => {
  const [formData, setFormData] = useState(initialData || { email: '', password: '', nombre: '', rol: 'EDITOR' });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Email</label>
        <Input value={formData.email} onChange={(e) => handleChange('email', e.target.value)} type="email" />
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Contraseña</label>
        <Input value={formData.password} onChange={(e) => handleChange('password', e.target.value)} type="password" />
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Nombre</label>
        <Input value={formData.nombre} onChange={(e) => handleChange('nombre', e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Rol</label>
        <Select value={formData.rol} onValueChange={(value) => handleChange('rol', value)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">Administrador</SelectItem>
            <SelectItem value="EDITOR">Editor</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={loading}>
          {initialData ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const { user: currentUser } = useAuth();

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      if (editingUser) {
        await apiClient.put(`/users/${editingUser.id}`, data);
      } else {
        await apiClient.post('/users', data);
      }
      setModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Error saving user:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (user.id === currentUser.id) {
      alert('No puedes eliminarte a ti mismo');
      return;
    }
    if (window.confirm(`¿Eliminar al usuario ${user.nombre}?`)) {
      try {
        await apiClient.delete(`/users/${user.id}`);
        fetchUsers();
      } catch (err) {
        console.error('Error deleting user:', err);
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">{users.length} usuarios registrados</p>
        </div>
        <Button onClick={() => { setEditingUser(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Usuario
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Cargando...</div>
      ) : users.length === 0 ? (
        <Card><CardContent className="p-12 text-center">No hay usuarios</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Nombre</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Rol</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Creado</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((row) => (
                  <tr key={row.id} className="border-b">
                    <td className="p-4">{row.nombre}</td>
                    <td className="p-4 text-muted-foreground">{row.email}</td>
                    <td className="p-4">
                      <Badge variant={row.rol === 'ADMIN' ? 'default' : 'secondary'}>
                        {row.rol === 'ADMIN' ? 'Admin' : 'Editor'}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">{new Date(row.createdAt).toLocaleDateString('es-AR')}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setEditingUser(row); setModalOpen(true); }}>
                          Editar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(row)}>
                          Eliminar
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
            <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
          </DialogHeader>
          <UserForm onSubmit={handleSubmit} initialData={editingUser} loading={saving} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;