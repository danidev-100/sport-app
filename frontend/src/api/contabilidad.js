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
