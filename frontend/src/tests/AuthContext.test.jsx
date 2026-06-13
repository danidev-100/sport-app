import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

// Mock apiClient
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

// Test component that uses auth
const TestComponent = () => {
  const { user, login, logout, isAdmin } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? user.nombre : 'no-user'}</span>
      <span data-testid="isAdmin">{isAdmin ? 'admin' : 'not-admin'}</span>
      <button onClick={() => login('test@test.com', 'pass')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should start with no user', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });

  it('should set user on login', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: {
        token: 'test-token',
        refreshToken: 'test-refresh',
        user: { id: '1', nombre: 'Test', email: 'test@test.com', rol: 'ADMIN' },
      },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    await userEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test');
      expect(screen.getByTestId('isAdmin')).toHaveTextContent('admin');
    });

    expect(localStorage.getItem('token')).toBe('test-token');
  });
});
