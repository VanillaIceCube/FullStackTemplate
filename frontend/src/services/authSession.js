import { getResponseErrorMessage, readOkJson } from './httpUtils';

export { getResponseErrorMessage, readOkJson };

export function clearAuthSession() {
  try {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('email');
  } catch (_err) {
    // Ignore non-browser / blocked storage environments.
  }
}

export function persistAuthSession(data) {
  if (!data?.access || !data?.refresh) {
    throw new Error('Auth response missing tokens.');
  }

  try {
    sessionStorage.setItem('accessToken', data.access);
    sessionStorage.setItem('refreshToken', data.refresh);

    // Profile info (app bar menu). Avoid storing "undefined".
    if (typeof data?.username === 'string' && data.username) {
      sessionStorage.setItem('username', data.username);
    }
    if (typeof data?.email === 'string' && data.email) {
      sessionStorage.setItem('email', data.email);
    }
  } catch (_err) {
    throw new Error('Unable to access browser session storage.');
  }
}
