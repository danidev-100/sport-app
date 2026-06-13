import { describe, it, expect } from 'vitest';
import { getAll } from '../services/cuotaService';

describe('cuotaService', () => {
  it('should return cuotas with pagination', async () => {
    const result = await getAll({}, 0, 5);
    expect(result).toHaveProperty('cuotas');
    expect(result).toHaveProperty('total');
    expect(Array.isArray(result.cuotas)).toBe(true);
    expect(result.cuotas.length).toBeLessThanOrEqual(5);
  });

  it('should filter by year', async () => {
    const result = await getAll({ anio: 2026 }, 0, 10);
    result.cuotas.forEach(c => {
      expect(c.anio).toBe(2026);
    });
  });
});
