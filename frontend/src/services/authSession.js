async function safeReadJson(response) {
  try {
    return await response.json();
  } catch (_err) {
    return null;
  }
}

export async function getResponseErrorMessage(response, fallbackMessage) {
  const data = await safeReadJson(response);
  if (!data) return fallbackMessage;

  if (typeof data.error === 'string' && data.error) return data.error;
  if (typeof data.detail === 'string' && data.detail) return data.detail;

  if (typeof data === 'object') {
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (typeof val === 'string' && val) return val;
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string' && val[0]) {
        return val[0];
      }
    }
  }

  return fallbackMessage;
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
