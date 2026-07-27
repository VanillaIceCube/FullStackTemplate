import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AppHeader from './AppHeader';
import { renderWithProviders } from '../test-support/utils';
import { goBackToParent } from '../utils/Navigation';
import { setNavigate } from '../services/navigationService';
import {
  clearAllNotifications,
  clearNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/workspaceApiClient';

const mockNavigate = vi.fn();
const mockUseLocation = vi.fn();

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useLocation: () => mockUseLocation(),
  useNavigate: () => mockNavigate,
}));

vi.mock('../utils/Navigation', () => ({
  goBackToParent: vi.fn(),
}));

vi.mock('../services/workspaceApiClient', () => ({
  clearAllNotifications: vi.fn(),
  clearNotification: vi.fn(),
  fetchNotifications: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}));

describe('AppHeader', () => {
  const setDrawerOpen = vi.fn();
  const jsonResponse = (body, ok = true) => ({
    ok,
    json: vi.fn().mockResolvedValue(body),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    setNavigate(mockNavigate);
    mockUseLocation.mockReturnValue({ pathname: '/' });
    fetchNotifications.mockResolvedValue(jsonResponse([]));
    clearAllNotifications.mockResolvedValue({ ok: true });
    clearNotification.mockResolvedValue({ ok: true });
    markNotificationRead.mockResolvedValue(
      jsonResponse({
        id: 1,
        title: 'New item in Shared Workspace',
        message: 'collaborator created "Plan".',
        is_read: true,
        workspace_name: 'Shared Workspace',
      }),
    );
    markAllNotificationsRead.mockResolvedValue(jsonResponse({ updated: 1 }));
  });

  test('when the route is /login, it does not render the app bar', () => {
    mockUseLocation.mockReturnValue({ pathname: '/login' });

    renderWithProviders(<AppHeader appBarHeader="Header" setDrawerOpen={setDrawerOpen} />);

    expect(screen.queryByText('Header')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('menu')).not.toBeInTheDocument();
  });

  test('when the route is /register, it does not render the app bar', () => {
    mockUseLocation.mockReturnValue({ pathname: '/register' });

    renderWithProviders(<AppHeader appBarHeader="Header" setDrawerOpen={setDrawerOpen} />);

    expect(screen.queryByText('Header')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('menu')).not.toBeInTheDocument();
  });

  test('when the route is /forgot-password, it does not render the app bar', () => {
    mockUseLocation.mockReturnValue({ pathname: '/forgot-password' });

    renderWithProviders(<AppHeader appBarHeader="Header" setDrawerOpen={setDrawerOpen} />);

    expect(screen.queryByText('Header')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('menu')).not.toBeInTheDocument();
  });

  test('when the route is /reset-password, it does not render the app bar', () => {
    mockUseLocation.mockReturnValue({ pathname: '/reset-password' });

    renderWithProviders(<AppHeader appBarHeader="Header" setDrawerOpen={setDrawerOpen} />);

    expect(screen.queryByText('Header')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('menu')).not.toBeInTheDocument();
  });

  test('when the path includes /collection, it shows the back button', () => {
    mockUseLocation.mockReturnValue({ pathname: '/workspaces/1/collection/2' });

    renderWithProviders(<AppHeader appBarHeader="Workspace" setDrawerOpen={setDrawerOpen} />);

    expect(screen.getByLabelText('back button')).toBeInTheDocument();
  });

  test('when the path does not include /collection, it does not show the back button', () => {
    mockUseLocation.mockReturnValue({ pathname: '/workspaces/1' });

    renderWithProviders(<AppHeader appBarHeader="Workspace" setDrawerOpen={setDrawerOpen} />);

    expect(screen.queryByLabelText('back button')).not.toBeInTheDocument();
  });

  test('when the back button is clicked, it calls goBackToParent', async () => {
    mockUseLocation.mockReturnValue({ pathname: '/workspaces/1/collection/2' });

    renderWithProviders(<AppHeader appBarHeader="Workspace" setDrawerOpen={setDrawerOpen} />);

    await userEvent.click(screen.getByLabelText('back button'));

    expect(goBackToParent).toHaveBeenCalledWith('/workspaces/1/collection/2', mockNavigate);
  });

  test('when the menu icon is clicked, it toggles setDrawerOpen', async () => {
    renderWithProviders(<AppHeader appBarHeader="Workspace" setDrawerOpen={setDrawerOpen} />);

    await userEvent.click(screen.getByLabelText('menu'));

    expect(setDrawerOpen).toHaveBeenCalled();
    const [updater] = setDrawerOpen.mock.calls[0];
    expect(typeof updater).toBe('function');
  });

  test('when the user profile icon is clicked, it opens the profile menu', async () => {
    sessionStorage.setItem('username', 'judea');
    sessionStorage.setItem('email', 'judea@example.com');

    renderWithProviders(<AppHeader appBarHeader="Workspace" setDrawerOpen={setDrawerOpen} />);

    await userEvent.click(screen.getByLabelText('user profile'));

    expect(screen.getByTestId('menu')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByText('judea')).toBeInTheDocument();
    expect(screen.getByText('judea@example.com')).toBeInTheDocument();
  });

  test('when notifications are unread, it shows a badge and notification panel', async () => {
    sessionStorage.setItem('accessToken', 'ACCESS');
    fetchNotifications.mockResolvedValue(
      jsonResponse([
        {
          id: 1,
          title: 'New item in Shared Workspace',
          message: 'collaborator created "Plan" in Ideas.',
          is_read: false,
          workspace_name: 'Shared Workspace',
          collection_name: 'Ideas',
        },
      ]),
    );

    renderWithProviders(<AppHeader appBarHeader="Workspace" setDrawerOpen={setDrawerOpen} />);

    expect(await screen.findByText('1')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('notifications'));

    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('collaborator created "Plan".')).toBeInTheDocument();
    expect(screen.getByText('Shared Workspace · Ideas')).toBeInTheDocument();
    expect(screen.queryByText('collaborator created "Plan" in Ideas.')).toBeNull();
    expect(screen.queryByText('New item in Shared Workspace')).toBeNull();
    expect(screen.getByRole('button', { name: /clear notification/i })).toBeInTheDocument();
  });

  test('when there are no notifications, it shows the empty state', async () => {
    sessionStorage.setItem('accessToken', 'ACCESS');

    renderWithProviders(<AppHeader appBarHeader="Workspace" setDrawerOpen={setDrawerOpen} />);

    await waitFor(() => expect(fetchNotifications).toHaveBeenCalledWith('ACCESS'));
    await userEvent.click(screen.getByLabelText('notifications'));

    expect(screen.getByText('No notifications yet.')).toBeInTheDocument();
  });

  test('when a notification is cleared, it removes the notification from the panel', async () => {
    sessionStorage.setItem('accessToken', 'ACCESS');
    fetchNotifications.mockResolvedValue(
      jsonResponse([
        {
          id: 1,
          title: 'New item in Shared Workspace',
          message: 'collaborator created "Plan".',
          is_read: false,
          workspace_name: 'Shared Workspace',
        },
      ]),
    );

    renderWithProviders(<AppHeader appBarHeader="Workspace" setDrawerOpen={setDrawerOpen} />);

    await screen.findByText('1');
    await userEvent.click(screen.getByLabelText('notifications'));

    await userEvent.click(screen.getByRole('button', { name: /clear notification/i }));

    expect(clearNotification).toHaveBeenCalledWith(1, 'ACCESS');
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /clear notification/i })).toBeNull(),
    );
  });

  test('when a notification row is clicked, it marks read and navigates to the target path', async () => {
    sessionStorage.setItem('accessToken', 'ACCESS');
    fetchNotifications.mockResolvedValue(
      jsonResponse([
        {
          id: 1,
          title: 'New item in Shared Workspace',
          message: 'collaborator added "Plan".',
          is_read: false,
          workspace_name: 'Shared Workspace',
          collection_name: 'Ideas',
          target_path: '/workspace/12/collection/34',
        },
      ]),
    );
    markNotificationRead.mockResolvedValue(
      jsonResponse({
        id: 1,
        title: 'New item in Shared Workspace',
        message: 'collaborator added "Plan".',
        is_read: true,
        workspace_name: 'Shared Workspace',
        collection_name: 'Ideas',
        target_path: '/workspace/12/collection/34',
      }),
    );

    renderWithProviders(<AppHeader appBarHeader="Workspace" setDrawerOpen={setDrawerOpen} />);

    await screen.findByText('1');
    await userEvent.click(screen.getByLabelText('notifications'));
    await userEvent.click(screen.getByText('collaborator added "Plan".'));

    expect(markNotificationRead).toHaveBeenCalledWith(1, 'ACCESS');
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/workspace/12/collection/34'));
  });

  test('when mark all read is clicked, it updates all notifications', async () => {
    sessionStorage.setItem('accessToken', 'ACCESS');
    fetchNotifications.mockResolvedValue(
      jsonResponse([
        {
          id: 1,
          title: 'New item in Shared Workspace',
          message: 'collaborator created "Plan".',
          is_read: false,
          workspace_name: 'Shared Workspace',
        },
        {
          id: 2,
          title: 'New collection in Shared Workspace',
          message: 'owner created "Ideas".',
          is_read: false,
          workspace_name: 'Shared Workspace',
        },
      ]),
    );

    renderWithProviders(<AppHeader appBarHeader="Workspace" setDrawerOpen={setDrawerOpen} />);

    expect(await screen.findByText('2')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('notifications'));
    await userEvent.click(screen.getByRole('button', { name: /mark all read/i }));

    expect(markAllNotificationsRead).toHaveBeenCalledWith('ACCESS');
    expect(await screen.findByRole('button', { name: /clear all/i })).toBeInTheDocument();
  });

  test('when all notifications are read, Clear all removes them from the panel', async () => {
    sessionStorage.setItem('accessToken', 'ACCESS');
    fetchNotifications.mockResolvedValue(
      jsonResponse([
        {
          id: 1,
          title: 'New item in Shared Workspace',
          message: 'collaborator created "Plan".',
          is_read: true,
          workspace_name: 'Shared Workspace',
        },
      ]),
    );

    renderWithProviders(<AppHeader appBarHeader="Workspace" setDrawerOpen={setDrawerOpen} />);

    await userEvent.click(screen.getByLabelText('notifications'));
    await userEvent.click(await screen.findByRole('button', { name: /clear all/i }));

    expect(clearAllNotifications).toHaveBeenCalledWith('ACCESS');
    expect(await screen.findByText('No notifications yet.')).toBeInTheDocument();
  });

  test('when no profile info exists, it falls back to username + username@gmail.com', async () => {
    renderWithProviders(<AppHeader appBarHeader="Workspace" setDrawerOpen={setDrawerOpen} />);

    await userEvent.click(screen.getByLabelText('user profile'));

    expect(screen.getByText('username')).toBeInTheDocument();
    expect(screen.getByText('username@gmail.com')).toBeInTheDocument();
  });

  test('when sessionStorage reads throw, it still renders fallback profile values', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    renderWithProviders(<AppHeader appBarHeader="Workspace" setDrawerOpen={setDrawerOpen} />);

    await userEvent.click(screen.getByLabelText('user profile'));

    expect(screen.getByText('username')).toBeInTheDocument();
    expect(screen.getByText('username@gmail.com')).toBeInTheDocument();

    getItem.mockRestore();
  });

  test('when Logout is clicked, it clears tokens and redirects to /login', async () => {
    sessionStorage.setItem('accessToken', 'ACCESS');
    sessionStorage.setItem('refreshToken', 'REFRESH');
    sessionStorage.setItem('username', 'judea');
    sessionStorage.setItem('email', 'judea@example.com');
    window.history.replaceState({}, '', '/');

    renderWithProviders(<AppHeader appBarHeader="Workspace" setDrawerOpen={setDrawerOpen} />);

    await userEvent.click(screen.getByLabelText('user profile'));
    await userEvent.click(screen.getByRole('menuitem', { name: /logout/i }));

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
});
