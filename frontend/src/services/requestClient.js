import { navigate } from './navigationService';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ??
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000');

function shouldRedirectToLogin(path) {
  // Auth endpoints may legitimately return 401 (bad credentials) and should be handled by the UI.
  return (
    !path.startsWith('/auth/login') &&
    !path.startsWith('/auth/register') &&
    !path.startsWith('/auth/forgot-password') &&
    !path.startsWith('/auth/reset-password')
  );
}

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

export function redirectToLogin() {
  const didNavigate = navigate('/login', { replace: true });

  if (didNavigate || typeof window === 'undefined') return;

  const publicUrl = process.env.PUBLIC_URL || '';
  const normalizedBase = publicUrl.replace(/\/+$/, '');
  const loginPath = normalizedBase ? `${normalizedBase}/login` : '/login';
  const loginUrl = `${window.location?.origin ?? ''}${loginPath.startsWith('/') ? '' : '/'}${loginPath}`;
  if (window.location?.replace) {
    window.location.replace(loginUrl);
  } else {
    window.location.href = loginUrl;
  }
}

export function logout() {
  clearAuthSession();
  try {
    sessionStorage.setItem(
      'pendingSnackbar',
      JSON.stringify({
        severity: 'success',
        message: 'Logout Successful :)',
      }),
    );
  } catch (_err) {
    // ignore
  }
  redirectToLogin();
}

function handleUnauthorized() {
  clearAuthSession();

  if (typeof window === 'undefined') return;

  const currentPath = window.location?.pathname?.replace(/\/+$/, '') ?? '';
  if (
    currentPath.endsWith('/login') ||
    currentPath.endsWith('/register') ||
    currentPath.endsWith('/forgot-password') ||
    currentPath.endsWith('/reset-password')
  ) {
    return;
  }

  // Let the login screen explain why the user got redirected.
  try {
    sessionStorage.setItem(
      'pendingSnackbar',
      JSON.stringify({
        severity: 'error',
        message: 'Your session expired. Please log in again.',
      }),
    );
  } catch (_err) {
    // ignore
  }

  redirectToLogin();
}

let refreshRequest = null;

async function refreshAccessToken() {
  if (refreshRequest) return refreshRequest;

  const refreshToken = sessionStorage.getItem('refreshToken');
  if (!refreshToken) return { status: 'invalid' };

  refreshRequest = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (response.status === 400 || response.status === 401) return { status: 'invalid' };
      if (!response.ok) return { status: 'transient' };

      const data = await response.json();
      if (!data?.access) return { status: 'transient' };
      sessionStorage.setItem('accessToken', data.access);
      if (data.refresh) sessionStorage.setItem('refreshToken', data.refresh);
      return { status: 'refreshed', accessToken: data.access };
    } catch (_err) {
      return { status: 'transient' };
    } finally {
      refreshRequest = null;
    }
  })();

  return refreshRequest;
}

export function normalizeHeaders(headers) {
  if (!headers) return {};
  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    const result = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...headers };
}

function hasAuthorizationHeader(headers) {
  return Object.keys(headers).some((key) => key.toLowerCase() === 'authorization');
}

function getStoredAccessToken() {
  try {
    return sessionStorage.getItem('accessToken') || null;
  } catch (_err) {
    return null;
  }
}

function withAccessToken(options, accessToken) {
  const headers = normalizeHeaders(options.headers);
  headers.Authorization = `Bearer ${accessToken}`;
  return {
    ...options,
    headers,
  };
}

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const headers = normalizeHeaders(options.headers);

  const storedToken = getStoredAccessToken();
  if (storedToken && !hasAuthorizationHeader(headers) && shouldRedirectToLogin(path)) {
    headers.Authorization = `Bearer ${storedToken}`;
  }

  const mergedOptions = { ...options };
  if (Object.keys(headers).length > 0) {
    mergedOptions.headers = headers;
  } else {
    delete mergedOptions.headers;
  }

  const response = await fetch(url, mergedOptions);

  if (response?.status === 401 && shouldRedirectToLogin(path)) {
    const refreshResult = await refreshAccessToken();
    if (refreshResult.status === 'refreshed') {
      return fetch(url, withAccessToken(mergedOptions, refreshResult.accessToken));
    }
    if (refreshResult.status === 'invalid') handleUnauthorized();
  }

  return response;
}
