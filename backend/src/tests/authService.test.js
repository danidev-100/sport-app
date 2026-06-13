import { describe, it, expect } from 'vitest';
import { register, login, getCurrentUser } from '../services/authService';

describe('authService', () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'password123';
  const testName = 'Test User';

  it('should register a new user', async () => {
    const result = await register(testEmail, testPassword, testName, 'EDITOR');
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe(testEmail);
    expect(result.token).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('should reject duplicate email', async () => {
    await expect(register(testEmail, testPassword, testName))
      .rejects.toThrow('El email ya está registrado');
  });

  it('should login with valid credentials', async () => {
    const result = await login(testEmail, testPassword);
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe(testEmail);
    expect(result.token).toBeDefined();
  });

  it('should reject invalid password', async () => {
    await expect(login(testEmail, 'wrongpassword'))
      .rejects.toThrow('Credenciales inválidas');
  });

  it('should get current user by id', async () => {
    const { user } = await login(testEmail, testPassword);
    const currentUser = await getCurrentUser(user.id);
    expect(currentUser.email).toBe(testEmail);
  });
});
