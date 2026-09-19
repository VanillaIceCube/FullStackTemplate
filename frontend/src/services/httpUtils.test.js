import { getResponseErrorMessage, readOkJson } from './httpUtils';

describe('httpUtils', () => {
  describe('getResponseErrorMessage', () => {
    test('extracts error field from json response', async () => {
      const response = {
        json: jest.fn().mockResolvedValue({ error: 'Email already exists.' }),
      };

      await expect(getResponseErrorMessage(response, 'fallback')).resolves.toBe(
        'Email already exists.',
      );
    });

    test('extracts detail field if error field is absent', async () => {
      const response = {
        json: jest.fn().mockResolvedValue({ detail: 'Invalid token.' }),
      };

      await expect(getResponseErrorMessage(response, 'fallback')).resolves.toBe('Invalid token.');
    });

    test('returns fallback if json parsing fails or returns empty response', async () => {
      const response = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      };

      await expect(getResponseErrorMessage(response, 'fallback')).resolves.toBe('fallback');
    });
  });

  describe('readOkJson', () => {
    test('throws server error message if response is not ok', async () => {
      const response = {
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ error: 'Email already exists.' }),
      };

      await expect(readOkJson(response, 'fallback')).rejects.toThrow('Email already exists.');
    });

    test('throws HTTP status error message if response is not ok and has no json body', async () => {
      const response = {
        ok: false,
        status: 403,
        json: jest.fn().mockRejectedValue(new Error('Non-JSON')),
      };

      await expect(readOkJson(response, 'fallback')).rejects.toThrow('HTTP 403');
    });

    test('returns json payload for successful response', async () => {
      const response = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, user: 'mapper' }),
      };

      await expect(readOkJson(response, 'fallback')).resolves.toEqual({
        success: true,
        user: 'mapper',
      });
    });

    test('throws fallback message if json response is empty or null', async () => {
      const response = {
        ok: true,
        json: jest.fn().mockResolvedValue(null),
      };

      await expect(readOkJson(response, 'fallbackMessage')).rejects.toThrow('fallbackMessage');
    });

    test('throws fallback message if json reading throws an error', async () => {
      const response = {
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('SyntaxError')),
      };

      await expect(readOkJson(response, 'fallbackMessage')).rejects.toThrow('fallbackMessage');
    });
  });
});
