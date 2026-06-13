import apiClient from './apiClient';

export const getIngresos = (params) => apiClient.get('/ingresos', { params });
export const getIngreso = (id) => apiClient.get(`/ingresos/${id}`);
export const createIngreso = (data) => apiClient.post('/ingresos', data);
export const updateIngreso = (id, data) => apiClient.put(`/ingresos/${id}`, data);
export const deleteIngreso = (id) => apiClient.delete(`/ingresos/${id}`);

export const getGastos = (params) => apiClient.get('/gastos', { params });
export const getGasto = (id) => apiClient.get(`/gastos/${id}`);
export const createGasto = (data) => apiClient.post('/gastos', data);
export const updateGasto = (id, data) => apiClient.put(`/gastos/${id}`, data);
export const deleteGasto = (id) => apiClient.delete(`/gastos/${id}`);

export const getBalance = () => apiClient.get('/contabilidad/balance');
export const getBalancePorFecha = () => apiClient.get('/contabilidad/balance-por-fecha');

export const getPartidos = () => apiClient.get('/partidos');
export const getPartido = (id) => apiClient.get(`/partidos/${id}`);
export const createPartido = (data) => apiClient.post('/partidos', data);
export const updatePartido = (id, data) => apiClient.put(`/partidos/${id}`, data);
export const deletePartido = (id) => apiClient.delete(`/partidos/${id}`);

export const getFechas = () => apiClient.get('/fechas');
export const createFecha = (data) => apiClient.post('/fechas', data);
export const deleteFecha = (id) => apiClient.delete(`/fechas/${id}`);
