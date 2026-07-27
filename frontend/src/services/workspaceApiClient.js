import { apiFetch } from './requestClient';

const authHeader = (token) => (token ? { Authorization: `Bearer ${token}` } : {});
const jsonHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...authHeader(token),
});

export const login = ({ email, username, password }) => {
  const payload = { password };
  if (email) {
    payload.email = email;
  } else if (username) {
    payload.username = username;
  }

  return apiFetch('/auth/login/', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
};

export const register = ({ email, username, password }) => {
  const payload = {
    email: email?.trim(),
    password,
  };
  const trimmedUsername = username?.trim();
  if (trimmedUsername) {
    payload.username = trimmedUsername;
  }

  return apiFetch('/auth/register/', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
};

export const forgotPassword = ({ email }) =>
  apiFetch('/auth/forgot-password/', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ email: email?.trim() }),
  });

export const resetPassword = ({ uid, token, password }) =>
  apiFetch('/auth/reset-password/', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ uid, token, password }),
  });

export const fetchWorkspaces = (token) =>
  apiFetch('/api/workspaces/', {
    headers: authHeader(token),
  });

export const fetchWorkspace = (workspaceId, token) =>
  apiFetch(`/api/workspaces/${workspaceId}/`, {
    headers: authHeader(token),
  });

export const createWorkspace = (payload, token) =>
  apiFetch('/api/workspaces/', {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload),
  });

export const updateWorkspace = (workspaceId, payload, token) =>
  apiFetch(`/api/workspaces/${workspaceId}/`, {
    method: 'PATCH',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload),
  });

export const deleteWorkspace = (workspaceId, token) =>
  apiFetch(`/api/workspaces/${workspaceId}/`, {
    method: 'DELETE',
    headers: jsonHeaders(token),
  });

export const addWorkspaceCollaborator = (workspaceId, payload, token) =>
  apiFetch(`/api/workspaces/${workspaceId}/collaborators/`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload),
  });

export const removeWorkspaceCollaborator = (workspaceId, userId, token) =>
  apiFetch(`/api/workspaces/${workspaceId}/collaborators/${userId}/`, {
    method: 'DELETE',
    headers: jsonHeaders(token),
  });

export const fetchCollections = (workspaceId, token) =>
  apiFetch(`/api/collections/?workspace=${workspaceId}`, {
    headers: authHeader(token),
  });

export const fetchCollection = (collectionId, token) =>
  apiFetch(`/api/collections/${collectionId}/`, {
    headers: authHeader(token),
  });

export const createCollection = (workspaceId, payload, token) =>
  apiFetch(`/api/collections/?workspace=${workspaceId}`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload),
  });

export const updateCollection = (collectionId, payload, token) =>
  apiFetch(`/api/collections/${collectionId}/`, {
    method: 'PATCH',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload),
  });

export const deleteCollection = (collectionId, token) =>
  apiFetch(`/api/collections/${collectionId}/`, {
    method: 'DELETE',
    headers: jsonHeaders(token),
  });

export const reorderCollections = (workspaceId, orderedIds, token) =>
  apiFetch('/api/collections/reorder/', {
    method: 'PATCH',
    headers: jsonHeaders(token),
    body: JSON.stringify({ workspace: workspaceId, ordered_ids: orderedIds }),
  });

export const fetchItems = (collectionId, token) =>
  apiFetch(`/api/items/?collection=${collectionId}`, {
    headers: authHeader(token),
  });

export const createItem = (collectionId, payload, token) =>
  apiFetch(`/api/items/?collection=${collectionId}`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload),
  });

export const updateItem = (itemId, payload, token) =>
  apiFetch(`/api/items/${itemId}/`, {
    method: 'PATCH',
    headers: jsonHeaders(token),
    body: JSON.stringify(payload),
  });

export const deleteItem = (itemId, token) =>
  apiFetch(`/api/items/${itemId}/`, {
    method: 'DELETE',
    headers: jsonHeaders(token),
  });

export const reorderItems = (collectionId, orderedIds, token) =>
  apiFetch('/api/items/reorder/', {
    method: 'PATCH',
    headers: jsonHeaders(token),
    body: JSON.stringify({ collection: collectionId, ordered_ids: orderedIds }),
  });

export const fetchNotifications = (token) =>
  apiFetch('/api/notifications/', {
    headers: authHeader(token),
  });

export const markNotificationRead = (notificationId, token) =>
  apiFetch(`/api/notifications/${notificationId}/`, {
    method: 'PATCH',
    headers: jsonHeaders(token),
    body: JSON.stringify({ is_read: true }),
  });

export const clearNotification = (notificationId, token) =>
  apiFetch(`/api/notifications/${notificationId}/`, {
    method: 'DELETE',
    headers: jsonHeaders(token),
  });

export const clearAllNotifications = (token) =>
  apiFetch('/api/notifications/clear-all/', {
    method: 'DELETE',
    headers: jsonHeaders(token),
  });

export const markAllNotificationsRead = (token) =>
  apiFetch('/api/notifications/mark-all-read/', {
    method: 'PATCH',
    headers: jsonHeaders(token),
  });
