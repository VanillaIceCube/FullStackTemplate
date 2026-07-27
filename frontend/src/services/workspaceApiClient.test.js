import {
  login,
  register,
  forgotPassword,
  resetPassword,
  fetchWorkspaces,
  fetchWorkspace,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  fetchCollections,
  fetchCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  reorderCollections,
  fetchItems,
  createItem,
  updateItem,
  deleteItem,
  reorderItems,
  fetchNotifications,
  markNotificationRead,
  clearNotification,
  clearAllNotifications,
  markAllNotificationsRead,
} from './workspaceApiClient';
import { apiFetch } from './requestClient';

vi.mock('./requestClient', () => ({
  apiFetch: vi.fn(() => Promise.resolve({ ok: true })),
}));

describe('workspaceApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('when login uses email, it posts the email payload', () => {
    login({ email: 'user@example.com', password: 'secret' });

    expect(apiFetch).toHaveBeenCalledWith('/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    });
    const [, options] = apiFetch.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({ email: 'user@example.com', password: 'secret' });
  });

  test('when login uses username, it posts the username payload', () => {
    login({ username: 'user1', password: 'secret' });

    expect(apiFetch).toHaveBeenCalledWith('/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    });
    const [, options] = apiFetch.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({ username: 'user1', password: 'secret' });
  });

  test('when login includes email and username, it prefers email', () => {
    login({ email: 'user@example.com', username: 'user1', password: 'secret' });

    const [, options] = apiFetch.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({ email: 'user@example.com', password: 'secret' });
  });

  test('when register trims inputs, it posts trimmed values', () => {
    register({ email: ' user@example.com ', username: ' user1 ', password: 'secret' });

    expect(apiFetch).toHaveBeenCalledWith('/auth/register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    });
    const [, options] = apiFetch.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({
      email: 'user@example.com',
      username: 'user1',
      password: 'secret',
    });
  });

  test('when register has blank username, it omits the username', () => {
    register({ email: 'user@example.com', username: '   ', password: 'secret' });

    expect(apiFetch).toHaveBeenCalledWith('/auth/register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    });
    const [, options] = apiFetch.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({ email: 'user@example.com', password: 'secret' });
  });

  test('when forgotPassword is called, it posts trimmed email', () => {
    forgotPassword({ email: ' user@example.com ' });

    expect(apiFetch).toHaveBeenCalledWith('/auth/forgot-password/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com' }),
    });
  });

  test('when resetPassword is called, it posts uid/token/password', () => {
    resetPassword({ uid: 'abc', token: 'tok', password: 'secret' });

    expect(apiFetch).toHaveBeenCalledWith('/auth/reset-password/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: 'abc', token: 'tok', password: 'secret' }),
    });
  });

  test('when fetching workspaces with a token, it sends the auth header', () => {
    fetchWorkspaces('token');

    expect(apiFetch).toHaveBeenCalledWith('/api/workspaces/', {
      headers: { Authorization: 'Bearer token' },
    });
  });

  test('when fetching workspaces without a token, it omits the auth header', () => {
    fetchWorkspaces();

    expect(apiFetch).toHaveBeenCalledWith('/api/workspaces/', {
      headers: {},
    });
  });

  test('when fetching a workspace, it calls the workspace endpoint', () => {
    fetchWorkspace(3, 'token');

    expect(apiFetch).toHaveBeenCalledWith('/api/workspaces/3/', {
      headers: { Authorization: 'Bearer token' },
    });
  });

  test('when creating a workspace, it posts JSON with auth', () => {
    createWorkspace({ name: 'Alpha' }, 'token');

    expect(apiFetch).toHaveBeenCalledWith('/api/workspaces/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ name: 'Alpha' }),
    });
  });

  test('when updating a workspace, it patches JSON with auth', () => {
    updateWorkspace(3, { name: 'Beta' }, 'token');

    expect(apiFetch).toHaveBeenCalledWith('/api/workspaces/3/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ name: 'Beta' }),
    });
  });

  test('when deleting a workspace, it deletes with auth', () => {
    deleteWorkspace(3, 'token');

    expect(apiFetch).toHaveBeenCalledWith('/api/workspaces/3/', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
    });
  });

  test('when fetching collections, it calls the workspace query endpoint', () => {
    fetchCollections(9, 'token');

    expect(apiFetch).toHaveBeenCalledWith('/api/collections/?workspace=9', {
      headers: { Authorization: 'Bearer token' },
    });
  });

  test('when fetching a collection, it calls the collection endpoint', () => {
    fetchCollection(5, 'token');

    expect(apiFetch).toHaveBeenCalledWith('/api/collections/5/', {
      headers: { Authorization: 'Bearer token' },
    });
  });

  test('when creating a collection, it posts JSON with auth', () => {
    createCollection(9, { name: 'List' }, 'token');

    expect(apiFetch).toHaveBeenCalledWith('/api/collections/?workspace=9', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ name: 'List' }),
    });
  });

  test('when updating a collection, it patches JSON with auth', () => {
    updateCollection(5, { name: 'Updated' }, 'token');

    expect(apiFetch).toHaveBeenCalledWith('/api/collections/5/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ name: 'Updated' }),
    });
  });

  test('when deleting a collection, it deletes with auth', () => {
    deleteCollection(5, 'token');

    expect(apiFetch).toHaveBeenCalledWith('/api/collections/5/', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
    });
  });

  test('when reordering collections, it patches the reorder endpoint', () => {
    reorderCollections(9, [11, 10], 'token');

    expect(apiFetch).toHaveBeenCalledWith('/api/collections/reorder/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ workspace: 9, ordered_ids: [11, 10] }),
    });
  });

  test('when fetching items, it calls the collection query endpoint', () => {
    fetchItems(7, 'token');

    expect(apiFetch).toHaveBeenCalledWith('/api/items/?collection=7', {
      headers: { Authorization: 'Bearer token' },
    });
  });

  test('when creating a item, it posts JSON with auth', () => {
    createItem(7, { item: 'Hello' }, 'token');

    expect(apiFetch).toHaveBeenCalledWith('/api/items/?collection=7', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ item: 'Hello' }),
    });
  });

  test('when updating a item, it patches JSON with auth', () => {
    updateItem(2, { item: 'Updated' }, 'token');

    expect(apiFetch).toHaveBeenCalledWith('/api/items/2/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ item: 'Updated' }),
    });
  });

  test('when deleting a item, it deletes with auth', () => {
    deleteItem(2, 'token');

    expect(apiFetch).toHaveBeenCalledWith('/api/items/2/', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
    });
  });

  test('when reordering items, it patches the reorder endpoint', () => {
    reorderItems(7, [102, 101], 'token');

    expect(apiFetch).toHaveBeenCalledWith('/api/items/reorder/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ collection: 7, ordered_ids: [102, 101] }),
    });
  });

  test('when fetching notifications, it calls the notifications endpoint', () => {
    fetchNotifications('token');

    expect(apiFetch).toHaveBeenCalledWith('/api/notifications/', {
      headers: { Authorization: 'Bearer token' },
    });
  });

  test('when marking a notification read, it patches the notification', () => {
    markNotificationRead(4, 'token');

    expect(apiFetch).toHaveBeenCalledWith('/api/notifications/4/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ is_read: true }),
    });
  });

  test('when clearing a notification, it deletes the notification', () => {
    clearNotification(4, 'token');

    expect(apiFetch).toHaveBeenCalledWith('/api/notifications/4/', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
    });
  });

  test('when clearing all notifications, it deletes the collection action', () => {
    clearAllNotifications('token');

    expect(apiFetch).toHaveBeenCalledWith('/api/notifications/clear-all/', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
    });
  });

  test('when marking all notifications read, it patches the collection action', () => {
    markAllNotificationsRead('token');

    expect(apiFetch).toHaveBeenCalledWith('/api/notifications/mark-all-read/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
    });
  });
});
