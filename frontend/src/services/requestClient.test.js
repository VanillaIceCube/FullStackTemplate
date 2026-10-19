describe('requestClient', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_API_BASE_URL', undefined);
    vi.stubEnv('PROD', false);
    vi.stubEnv('DEV', true);
    vi.stubEnv('BASE_URL', '/');
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, status: 200 }));
    sessionStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test('an unset production API base uses same-origin URLs', async () => {
    vi.stubEnv('PROD', true);
    vi.stubEnv('DEV', false);
    const { apiFetch } = await import('./requestClient');
    await apiFetch('/api/example/');
    expect(global.fetch).toHaveBeenCalledWith('/api/example/', {});
  });

  test('the fallback login redirect preserves the Vite deployment base', async () => {
    vi.stubEnv('BASE_URL', '/sample/');
    const replace = vi.fn();
    vi.stubGlobal('window', { location: { origin: 'https://app.example.com', replace } });
    const { clearNavigate } = await import('./navigationService');
    clearNavigate();
    const { redirectToLogin } = await import('./requestClient');
    redirectToLogin();
    expect(replace).toHaveBeenCalledWith('https://app.example.com/sample/login');
  });

  test('when VITE_API_BASE_URL is set, it prefixes the base URL', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com');
    const { apiFetch } = await import('./requestClient');

    await apiFetch('/path', { method: 'GET' });

    expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/path', { method: 'GET' });
  });

  test('when VITE_API_BASE_URL is blank, it uses same-origin relative URLs', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    const { apiFetch } = await import('./requestClient');

    await apiFetch('/api/example/', { method: 'GET' });

    expect(global.fetch).toHaveBeenCalledWith('/api/example/', { method: 'GET' });
  });

  test('when VITE_API_BASE_URL is not set, it uses the default base URL', async () => {
    vi.stubEnv('VITE_API_BASE_URL', undefined);
    const { apiFetch } = await import('./requestClient');

    await apiFetch('/path', { method: 'GET' });

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/path', { method: 'GET' });
  });

  test('when options are provided, it passes them through unchanged', async () => {
    const options = {
      method: 'POST',
      headers: { 'X-Test': 'ok' },
      body: JSON.stringify({ ok: true }),
    };
    vi.stubEnv('VITE_API_BASE_URL', undefined);
    const { apiFetch } = await import('./requestClient');

    await apiFetch('/path', options);

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/path', options);
  });

  test('when a non-auth endpoint and refresh token are invalid, it clears tokens and redirects to /login', async () => {
    vi.stubEnv('VITE_API_BASE_URL', undefined);
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 401 }));

    sessionStorage.setItem('accessToken', 'ACCESS');
    sessionStorage.setItem('refreshToken', 'REFRESH');
    window.history.replaceState({}, '', '/dashboard');

    const { setNavigate } = await import('./navigationService');
    const mockNavigate = vi.fn();
    setNavigate(mockNavigate);

    const { apiFetch } = await import('./requestClient');

    await apiFetch('/api/example/', { method: 'GET' });

    expect(sessionStorage.getItem('accessToken')).toBeNull();
    expect(sessionStorage.getItem('refreshToken')).toBeNull();
    expect(JSON.parse(sessionStorage.getItem('pendingSnackbar'))).toEqual({
      severity: 'error',
      message: 'Your session expired. Please log in again.',
    });
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  test('when an access token expires, it refreshes once and retries without logging out', async () => {
    vi.stubEnv('VITE_API_BASE_URL', undefined);
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access: 'NEW_ACCESS' }),
      })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    sessionStorage.setItem('accessToken', 'ACCESS');
    sessionStorage.setItem('refreshToken', 'REFRESH');

    const { setNavigate } = await import('./navigationService');
    const mockNavigate = vi.fn();
    setNavigate(mockNavigate);
    const { apiFetch } = await import('./requestClient');

    const response = await apiFetch('/api/example/', {
      headers: { Authorization: 'Bearer ACCESS' },
    });

    expect(response.ok).toBe(true);
    expect(sessionStorage.getItem('accessToken')).toBe('NEW_ACCESS');
    expect(sessionStorage.getItem('refreshToken')).toBe('REFRESH');
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenLastCalledWith('http://localhost:8000/api/example/', {
      headers: { Authorization: 'Bearer NEW_ACCESS' },
    });
  });

  test('when refresh has a transient failure, it preserves the session and returns the original response', async () => {
    vi.stubEnv('VITE_API_BASE_URL', undefined);
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({ ok: false, status: 503 });
    sessionStorage.setItem('accessToken', 'ACCESS');
    sessionStorage.setItem('refreshToken', 'REFRESH');
    const { setNavigate } = await import('./navigationService');
    const mockNavigate = vi.fn();
    setNavigate(mockNavigate);
    const { apiFetch } = await import('./requestClient');

    const response = await apiFetch('/api/example/');

    expect(response.status).toBe(401);
    expect(sessionStorage.getItem('accessToken')).toBe('ACCESS');
    expect(sessionStorage.getItem('refreshToken')).toBe('REFRESH');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('when /auth/login/ returns 401, it does not redirect or clear tokens', async () => {
    vi.stubEnv('VITE_API_BASE_URL', undefined);
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 401 }));

    sessionStorage.setItem('accessToken', 'ACCESS');
    sessionStorage.setItem('refreshToken', 'REFRESH');
    window.history.replaceState({}, '', '/login');

    const { setNavigate } = await import('./navigationService');
    const mockNavigate = vi.fn();
    setNavigate(mockNavigate);

    const { apiFetch } = await import('./requestClient');

    await apiFetch('/auth/login/', { method: 'POST' });

    expect(sessionStorage.getItem('accessToken')).toBe('ACCESS');
    expect(sessionStorage.getItem('refreshToken')).toBe('REFRESH');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('when /auth/forgot-password/ returns 401, it does not redirect or clear tokens', async () => {
    vi.stubEnv('VITE_API_BASE_URL', undefined);
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 401 }));

    sessionStorage.setItem('accessToken', 'ACCESS');
    sessionStorage.setItem('refreshToken', 'REFRESH');

    const { setNavigate } = await import('./navigationService');
    const mockNavigate = vi.fn();
    setNavigate(mockNavigate);

    const { apiFetch } = await import('./requestClient');

    await apiFetch('/auth/forgot-password/', { method: 'POST' });

    expect(sessionStorage.getItem('accessToken')).toBe('ACCESS');
    expect(sessionStorage.getItem('refreshToken')).toBe('REFRESH');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('when logout() is called, it clears tokens/profile and redirects to /login', async () => {
    vi.stubEnv('VITE_API_BASE_URL', undefined);

    sessionStorage.setItem('accessToken', 'ACCESS');
    sessionStorage.setItem('refreshToken', 'REFRESH');
    sessionStorage.setItem('username', 'judea');
    sessionStorage.setItem('email', 'judea@example.com');
    window.history.replaceState({}, '', '/dashboard');

    const { setNavigate } = await import('./navigationService');
    const mockNavigate = vi.fn();
    setNavigate(mockNavigate);

    const { logout } = await import('./requestClient');

    logout();

    expect(sessionStorage.getItem('accessToken')).toBeNull();
    expect(sessionStorage.getItem('refreshToken')).toBeNull();
    expect(sessionStorage.getItem('username')).toBeNull();
    expect(sessionStorage.getItem('email')).toBeNull();
    expect(JSON.parse(sessionStorage.getItem('pendingSnackbar'))).toEqual({
      severity: 'success',
      message: 'Logout Successful :)',
    });
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  test('when logout() is called before navigate is registered, it still redirects', async () => {
    vi.stubEnv('VITE_API_BASE_URL', undefined);
    sessionStorage.setItem('accessToken', 'ACCESS');
    sessionStorage.setItem('refreshToken', 'REFRESH');

    const replaceSpy = vi.fn();
    vi.stubGlobal('window', { location: { origin: 'http://localhost', replace: replaceSpy } });

    const { clearNavigate } = await import('./navigationService');
    clearNavigate();
    const { logout } = await import('./requestClient');

    expect(() => logout()).not.toThrow();
    expect(sessionStorage.getItem('accessToken')).toBeNull();
    expect(sessionStorage.getItem('refreshToken')).toBeNull();
    expect(replaceSpy).toHaveBeenCalled();
  });
});
