import { useForm } from 'react-hook-form';
import Input from '../common/Input';
import Button from '../common/Button';

const metodosPago = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'OTRO'];

const PagoForm = ({ onSubmit, loading, cuota }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      cuotaId: cuota?.id || '',
      monto: cuota?.monto || '',
      metodoPago: 'EFECTIVO',
      observacion: ''
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input type="hidden" {...register('cuotaId')} />
      
      {cuota && (
        <div className="mb-4 p-4 rounded-xl" style={{ background: '#1a1a1a' }}>
          <p className="text-sm text-gray-400">Jugador: <span className="text-white">{cuota.jugador?.nombre}</span></p>
          <p className="text-sm text-gray-400">Monto total: <span className="text-white">${cuota.monto}</span></p>
          {cuota.pagos?.length > 0 && (
            <p className="text-sm text-yellow-500 mt-2">
              Ya pagado: ${cuota.pagos.reduce((s, p) => s + parseFloat(p.monto), 0)}
            </p>
          )}
        </div>
      )}

      <Input
        label="Monto"
        name="monto"
        type="number"
        step="0.01"
        register={register}
        required
        error={errors.monto?.message}
      />

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">Método de Pago</label>
        <select {...register('metodoPago')} className="dark-select">
          {metodosPago.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">Observación</label>
        <textarea
          {...register('observacion')}
          className="dark-input"
          rows="3"
          placeholder="Observación opcional..."
        />
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button type="submit" loading={loading} className="btn-green">
          Registrar Pago
        </Button>
      </div>
    </form>
  );
};

export default PagoForm;