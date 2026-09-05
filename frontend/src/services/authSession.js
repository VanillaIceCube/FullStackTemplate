async function safeReadJson(response) {
  try {
    return await response.json();
  } catch (_err) {
    return null;
  }
}

export async function getResponseErrorMessage(response, fallbackMessage) {
  const data = await safeReadJson(response);
  return data?.error || data?.detail || fallbackMessage;
}

export async function readOkJson(response, fallbackMessage) {
  if (!response?.ok) {
    const message = await getResponseErrorMessage(response, `HTTP ${response?.status ?? 'error'}`);
    throw new Error(message);
  }

  const data = await safeReadJson(response);
  if (!data) {
    throw new Error(fallbackMessage);
  }
  return data;
}

export function persistAuthSession(data) {
  if (!data?.access || !data?.refresh) {
    throw new Error('Auth response missing tokens.');
  }

  try {
    sessionStorage.setItem('accessToken', data.access);
    sessionStorage.setItem('refreshToken', data.refresh);

    // Profile info (app bar menu). Remove stale keys if missing in payload.
    if (typeof data?.username === 'string' && data.username.trim()) {
      sessionStorage.setItem('username', data.username.trim());
    } else {
      sessionStorage.removeItem('username');
    }

    if (typeof data?.email === 'string' && data.email.trim()) {
      sessionStorage.setItem('email', data.email.trim());
    } else {
      sessionStorage.removeItem('email');
    }
  } catch (_err) {
    throw new Error('Unable to access browser session storage.');
  }
}
