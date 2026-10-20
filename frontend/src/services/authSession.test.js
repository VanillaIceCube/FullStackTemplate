import { describe, beforeEach, test, expect, vi } from 'vitest';
import { getResponseErrorMessage, readOkJson, persistAuthSession } from './authSession';

describe('authSession', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('getResponseErrorMessage', () => {
    test('when response json includes error, it returns error', async () => {
      const response = {
        json: vi.fn().mockResolvedValue({ error: 'Specific error message' }),
      };

      const result = await getResponseErrorMessage(response, 'Fallback');
      expect(result).toBe('Specific error message');
    });

    test('when response json includes detail, it returns detail', async () => {
      const response = {
        json: vi.fn().mockResolvedValue({ detail: 'Detail error message' }),
      };

      const result = await getResponseErrorMessage(response, 'Fallback');
      expect(result).toBe('Detail error message');
    });

    test('when response json cannot be read, it returns fallback', async () => {
      const response = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      };

      const result = await getResponseErrorMessage(response, 'Fallback');
      expect(result).toBe('Fallback');
    });
  });

  describe('readOkJson', () => {
    test('when response is not ok, it throws the best server message', async () => {
      const response = {
        ok: false,
        json: vi.fn().mockResolvedValue({ detail: 'Invalid credentials' }),
      };

      await expect(readOkJson(response, 'Login failed.')).rejects.toThrow('Invalid credentials');
    });

    test('when response is not ok and body has no message, it throws HTTP <status>', async () => {
      const response = {
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({}),
      };

      await expect(readOkJson(response, 'Login failed.')).rejects.toThrow('HTTP 500');
    });

    test('when response is ok, it returns parsed json', async () => {
      const response = {
        ok: true,
        json: vi.fn().mockResolvedValue({ access: 'A', refresh: 'R' }),
      };

      const data = await readOkJson(response, 'Login failed.');
      expect(data).toEqual({ access: 'A', refresh: 'R' });
    });

    test('when response is ok but json is null, it throws fallbackMessage', async () => {
      const response = {
        ok: true,
        json: vi.fn().mockResolvedValue(null),
      };

      await expect(readOkJson(response, 'Login failed.')).rejects.toThrow('Login failed.');
    });

    test('when response is ok but json throws, it throws fallbackMessage', async () => {
      const response = {
        ok: true,
        json: vi.fn().mockRejectedValue(new Error('Corrupt JSON')),
      };

      await expect(readOkJson(response, 'Login failed.')).rejects.toThrow('Login failed.');
    });
  });

  describe('persistAuthSession', () => {
    test('when tokens are missing, it throws', () => {
      expect(() => persistAuthSession({})).toThrow('Auth response missing tokens.');
      expect(() => persistAuthSession({ access: 'A' })).toThrow('Auth response missing tokens.');
    });

    test('when tokens are present, it stores them', () => {
      persistAuthSession({ access: 'A', refresh: 'R' });

      expect(sessionStorage.getItem('accessToken')).toBe('A');
      expect(sessionStorage.getItem('refreshToken')).toBe('R');
    });

    test('when profile fields are present, it stores them', () => {
      persistAuthSession({
        access: 'A',
        refresh: 'R',
        username: 'u',
        email: 'e@example.com',
      });

      expect(sessionStorage.getItem('username')).toBe('u');
      expect(sessionStorage.getItem('email')).toBe('e@example.com');
    });

    test('when username/email are missing, it does not store "undefined"', () => {
      persistAuthSession({ access: 'A', refresh: 'R', username: undefined, email: undefined });

      expect(sessionStorage.getItem('username')).toBeNull();
      expect(sessionStorage.getItem('email')).toBeNull();
    });

    test('when profile fields are missing or empty, it removes existing stale profile keys', () => {
      sessionStorage.setItem('username', 'staleUser');
      sessionStorage.setItem('email', 'stale@example.com');

      persistAuthSession({ access: 'A', refresh: 'R', username: '', email: '   ' });

      expect(sessionStorage.getItem('username')).toBeNull();
      expect(sessionStorage.getItem('email')).toBeNull();
    });

    test('when sessionStorage throws, it surfaces a storage error', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceeded');
      });

      expect(() => persistAuthSession({ access: 'A', refresh: 'R' })).toThrow(
        'Unable to access browser session storage.',
      );
    });
  });
});
