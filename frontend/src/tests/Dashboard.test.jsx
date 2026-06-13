import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Dashboard from '../pages/Dashboard';
import apiClient from '../api/apiClient';

vi.mock('../api/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

// Mock sonner toasts
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock API responses
    apiClient.get.mockImplementation((url) => {
      if (url === '/dashboard/metricas') {
        return Promise.resolve({
          data: { totalJugadores: 10, jugadoresActivos: 8, totalIngresos: 50000, totalMorosos: 2 },
        });
      }
      if (url.includes('/dashboard/cuotas-grafico')) {
        return Promise.resolve({
          data: { meses: [], pagadas: [], pendientes: [] },
        });
      }
      if (url === '/jugadores/recientes?limit=5') {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error('not found'));
    });
  });

  it('should render dashboard with metrics', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Resumen')).toBeInTheDocument();
    expect(screen.getByText('Jugadores')).toBeInTheDocument();
  });
});
