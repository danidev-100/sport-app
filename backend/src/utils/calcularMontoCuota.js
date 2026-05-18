/**
 * Calcula el monto de cuota según la categoría del jugador.
 *
 * C7 - C13 (C7, C11, C13): $20.000
 * C15, C17, C20, SENIOR, VETERANO: $25.000
 */
const MONTOS_CUOTA = {
  C7: 20000,
  C11: 20000,
  C13: 20000,
  C15: 25000,
  C17: 25000,
  C20: 25000,
  PRIMERA: 25000,
  SENIOR: 25000,
  VETERANO: 25000,
};

const calcularMontoCuota = (categoria) => {
  if (!categoria) return 25000; // default para categoría desconocida
  return MONTOS_CUOTA[categoria.toUpperCase()] ?? 25000;
};

module.exports = { calcularMontoCuota, MONTOS_CUOTA };
