export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatMonth = (month) => {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return months[month - 1] || '';
};

export const getPosicionLabel = (posicion) => {
  const labels = {
    PORTERO: 'Portero',
    DEFENSA: 'Defensa',
    CENTROCAMPISTA: 'Centrocampista',
    DELANTERO: 'Delantero'
  };
  return labels[posicion] || posicion;
};

export const getEstadoCuota = (cuota) => {
  if (cuota.pagos?.length > 0) {
    const totalPagado = cuota.pagos.reduce((sum, p) => sum + parseFloat(p.monto), 0);
    if (totalPagado >= parseFloat(cuota.monto)) return 'pagada';
    return 'parcial';
  }
  return 'pendiente';
};