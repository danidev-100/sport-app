import { useForm } from 'react-hook-form';
import Input from '../common/Input';
import Button from '../common/Button';

const posiciones = ['PORTERO', 'DEFENSA', 'CENTROCAMPISTA', 'DELANTERO'];

const JugadorForm = ({ onSubmit, initialData = null, loading = false }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {
      nombre: '',
      posicion: 'DEFENSA',
      edad: '',
      telefono: '',
      email: '',
      fotoUrl: ''
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Nombre"
        name="nombre"
        register={register}
        required
        error={errors.nombre?.message}
        placeholder="Nombre completo"
      />
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Posición <span className="text-green-500">*</span>
        </label>
        <select
          {...register('posicion', { required: 'La posición es requerida' })}
          className="dark-select"
        >
          {posiciones.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        {errors.posicion && <p className="mt-2 text-sm text-red-400">{errors.posicion.message}</p>}
      </div>

      <Input
        label="Edad"
        name="edad"
        type="number"
        register={register}
        required
        error={errors.edad?.message}
        placeholder="18"
      />

      <Input
        label="Teléfono"
        name="telefono"
        register={register}
        placeholder="+54 11 1234 5678"
      />

      <Input
        label="Email"
        name="email"
        type="email"
        register={register}
        placeholder="jugador@email.com"
      />

      <Input
        label="Foto URL"
        name="fotoUrl"
        register={register}
        placeholder="https://..."
      />

      <div className="flex justify-end gap-3 mt-6">
        <Button type="submit" loading={loading} className="btn-green">
          {initialData ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
};

export default JugadorForm;