async function safeReadJson(response) {
  try {
    return await response.json();
  } catch (_err) {
    return null;
  }
}

function formatFieldError(key, val) {
  let msg = val;
  if (Array.isArray(val)) {
    msg = val[0];
  }
  if (typeof msg === 'object' && msg !== null) {
    msg = extractErrorMessage(msg, '');
  }
  if (typeof msg !== 'string' || !msg.trim()) {
    return null;
  }
  msg = msg.trim();
  if (key === 'error' || key === 'detail' || key === 'non_field_errors' || !key) {
    return msg;
  }
  const fieldName = key.charAt(0).toUpperCase() + key.slice(1);
  return `${fieldName}: ${msg}`;
}

export function extractErrorMessage(data, fallbackMessage) {
  if (!data) return fallbackMessage;

  if (typeof data === 'string') {
    return data.trim() || fallbackMessage;
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      const msg = extractErrorMessage(item, '');
      if (msg) return msg;
    }
    return fallbackMessage;
  }

  if (typeof data === 'object') {
    const priorityKeys = ['error', 'detail', 'non_field_errors'];
    for (const key of priorityKeys) {
      if (data[key] !== undefined && data[key] !== null) {
        const formatted = formatFieldError(key, data[key]);
        if (formatted) return formatted;
      }
    }

    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined && val !== null) {
        const formatted = formatFieldError(key, val);
        if (formatted) return formatted;
      }
    }
  }

  return fallbackMessage;
}

export async function getResponseErrorMessage(response, fallbackMessage) {
  const data = await safeReadJson(response);
  return extractErrorMessage(data, fallbackMessage);
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
