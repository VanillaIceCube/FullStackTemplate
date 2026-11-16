vi.mock('@mui/material', async () => await vi.importActual('@mui/material'));
import { Route, Routes } from 'react-router';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppHeader from './AppHeader';
import { renderWithProviders } from '../test-helpers/utils';
import {
  clearAllNotifications,
  clearNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationApiClient';
import { logout } from '../services/requestClient';

vi.mock('../services/notificationApiClient', () => ({
  clearAllNotifications: vi.fn(),
  clearNotification: vi.fn(),
  fetchNotifications: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}));

vi.mock('../services/requestClient', () => ({
  logout: vi.fn(),
}));

const response = (body, ok = true) => ({
  ok,
  json: vi.fn().mockResolvedValue(body),
});

describe('AppHeader', () => {
  test.each(['0', '1'])('shows connected apps only for enabled MCP (%s)', async (enabled) => {
    vi.stubEnv('VITE_MCP_ENABLED', enabled);
    const user = userEvent.setup();
    renderWithProviders(<AppHeader title="Full Stack Template" setDrawerOpen={setDrawerOpen} />);
    await user.click(screen.getByLabelText('user profile'));
    if (enabled === '1') {
      await user.click(screen.getByText('Connected Apps'));
      await waitFor(() => expect(screen.queryByText('Logout')).not.toBeInTheDocument());
    } else {
      expect(screen.queryByText('Connected Apps')).not.toBeInTheDocument();
    }
    vi.unstubAllEnvs();
  });

  const setDrawerOpen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    fetchNotifications.mockResolvedValue(response([]));
    clearAllNotifications.mockResolvedValue(response({ deleted: 1 }));
    clearNotification.mockResolvedValue(response(null));
    markAllNotificationsRead.mockResolvedValue(response({ updated: 1 }));
    markNotificationRead.mockResolvedValue(
      response({
        id: 1,
        title: 'Template ready',
        message: 'Your shell is ready.',
        is_read: true,
        target_path: '/',
      }),
    );
  });

  test.each(['/login', '/register', '/forgot-password', '/reset-password'])(
    'does not render on the public route %s',
    (route) => {
      renderWithProviders(<AppHeader title="Full Stack Template" setDrawerOpen={setDrawerOpen} />, {
        routeEntries: [route],
      });

      expect(screen.queryByText('Full Stack Template')).not.toBeInTheDocument();
    },
  );

  test('renders the title and global controls for authenticated pages', async () => {
    sessionStorage.setItem('accessToken', 'access');
    renderWithProviders(<AppHeader title="Full Stack Template" setDrawerOpen={setDrawerOpen} />);

    expect(screen.getByText('Full Stack Template')).toBeInTheDocument();
    expect(screen.getByLabelText('notifications')).toBeInTheDocument();
    expect(screen.getByLabelText('user profile')).toBeInTheDocument();
    expect(screen.getByLabelText('menu')).toBeInTheDocument();
    await waitFor(() => expect(fetchNotifications).toHaveBeenCalledWith('access'));
  });

  test('opens the navigation drawer', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppHeader title="Full Stack Template" setDrawerOpen={setDrawerOpen} />);

    await user.click(screen.getByLabelText('menu'));

    expect(setDrawerOpen).toHaveBeenCalled();
  });

  test('shows profile details and logs out', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem('username', 'template-user');
    sessionStorage.setItem('email', 'template@example.com');
    renderWithProviders(<AppHeader title="Full Stack Template" setDrawerOpen={setDrawerOpen} />);

    await user.click(screen.getByLabelText('user profile'));
    expect(screen.getByText('template-user')).toBeInTheDocument();
    expect(screen.getByText('template@example.com')).toBeInTheDocument();
    await user.click(screen.getByText('Logout'));

    expect(logout).toHaveBeenCalled();
  });

  test('supports profile menu keyboard navigation, dismissal, and logout', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppHeader title="Full Stack Template" setDrawerOpen={setDrawerOpen} />);

    await user.click(screen.getByLabelText('user profile'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: 'Logout' })).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(logout).not.toHaveBeenCalled();

    await user.click(screen.getByLabelText('user profile'));
    await user.keyboard('{End}{Enter}');
    expect(logout).toHaveBeenCalledTimes(1);
  });

  test('renders generic notifications without workspace context', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem('accessToken', 'access');
    fetchNotifications.mockResolvedValue(
      response([
        {
          id: 1,
          title: 'Template ready',
          message: 'Your shell is ready.',
          is_read: false,
          target_path: '/',
        },
      ]),
    );
    renderWithProviders(<AppHeader title="Full Stack Template" setDrawerOpen={setDrawerOpen} />);

    await waitFor(() => expect(fetchNotifications).toHaveBeenCalled());
    await user.click(screen.getByLabelText('notifications'));

    expect(screen.getByText('Template ready')).toBeInTheDocument();
    expect(screen.getByText('Your shell is ready.')).toBeInTheDocument();
    await user.click(screen.getByText('Mark all read'));
    expect(markAllNotificationsRead).toHaveBeenCalledWith('access');
  });

  test('handles notification loading error and retry', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem('accessToken', 'access');
    fetchNotifications.mockResolvedValueOnce(response(null, false));

    renderWithProviders(<AppHeader title="Full Stack Template" setDrawerOpen={setDrawerOpen} />);

    await user.click(screen.getByLabelText('notifications'));
    expect(await screen.findByText('Notifications are unavailable right now.')).toBeInTheDocument();

    fetchNotifications.mockResolvedValueOnce(
      response([
        {
          id: 1,
          title: 'Template ready',
          message: 'Your shell is ready.',
          is_read: false,
        },
      ]),
    );

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Template ready')).toBeInTheDocument();
  });

  test('handles individual notification clear and action errors', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem('accessToken', 'access');
    fetchNotifications.mockResolvedValue(
      response([
        {
          id: 1,
          title: 'Notification 1',
          message: 'Message 1',
          is_read: false,
        },
      ]),
    );
    clearNotification.mockResolvedValueOnce(response(null, false));

    renderWithProviders(<AppHeader title="Full Stack Template" setDrawerOpen={setDrawerOpen} />);

    await user.click(screen.getByLabelText('notifications'));
    expect(await screen.findByText('Notification 1')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Clear notification'));
    expect(await screen.findByText('Could not clear that notification.')).toBeInTheDocument();

    clearNotification.mockResolvedValueOnce(response({ deleted: 1 }, true));
    await user.click(screen.getByLabelText('Clear notification'));
    await waitFor(() => expect(screen.queryByText('Notification 1')).not.toBeInTheDocument());
  });

  test('does not navigate to target_path when markNotificationRead fails or returns malformed response', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem('accessToken', 'access');
    fetchNotifications.mockResolvedValue(
      response([
        {
          id: 1,
          title: 'Notification with path',
          message: 'Target path test',
          is_read: false,
          target_path: '/target-route',
        },
      ]),
    );

    // Case 1: markNotificationRead request fails (ok: false)
    markNotificationRead.mockResolvedValueOnce(response(null, false));

    renderWithProviders(<AppHeader title="Full Stack Template" setDrawerOpen={setDrawerOpen} />, {
      routeEntries: ['/'],
    });

    await user.click(screen.getByLabelText('notifications'));
    expect(await screen.findByText('Notification with path')).toBeInTheDocument();

    await user.click(screen.getByText('Notification with path'));
    expect(await screen.findByText('Could not update that notification.')).toBeInTheDocument();

    // Case 2: markNotificationRead returns non-OK or malformed JSON
    markNotificationRead.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockRejectedValueOnce(new Error('Invalid JSON')),
    });

    await user.click(screen.getByText('Notification with path'));
    expect(await screen.findByText('Could not update that notification.')).toBeInTheDocument();
  });
  test('keeps item and bulk actions disabled until mark-read JSON finishes', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem('accessToken', 'access');
    const notification = { id: 1, title: 'Slow notification', message: 'Wait', is_read: false };
    fetchNotifications.mockResolvedValue(response([notification]));
    let resolveJson;
    markNotificationRead.mockResolvedValue({
      ok: true,
      json: () =>
        new Promise((resolve) => {
          resolveJson = resolve;
        }),
    });
    renderWithProviders(<AppHeader title="Full Stack Template" setDrawerOpen={setDrawerOpen} />);
    await user.click(screen.getByLabelText('notifications'));
    await user.click(await screen.findByText('Slow notification'));
    expect(screen.getByLabelText('Clear notification')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Mark all read' })).toBeDisabled();
    resolveJson({ ...notification, is_read: true });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Clear all' })).toBeEnabled());
  });
});

describe('AppHeader response and navigation integration', () => {
  const notification = {
    id: 1,
    title: 'Notification title',
    message: 'Notification message',
    is_read: false,
    target_path: '/notification-target',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem('accessToken', 'access');
  });
  test.each([
    null,
    {},
    'unexpected',
    1,
    ...['title', 'message'].flatMap((field) =>
      [{ text: 'bad' }, ['bad'], 42, true].map((value) => [{ ...notification, [field]: value }]),
    ),
  ])('keeps the header usable for malformed notification JSON: %j', async (body) => {
    fetchNotifications
      .mockResolvedValueOnce({ ok: true, json: async () => body })
      .mockResolvedValue({ ok: true, json: async () => [notification] });
    const user = userEvent.setup();
    renderWithProviders(<AppHeader title="Application" setDrawerOpen={vi.fn()} />);
    await user.click(screen.getByLabelText('notifications'));
    expect(await screen.findByText('Notifications are unavailable right now.')).toBeVisible();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: /Retry/i }));
    expect(await screen.findByText(notification.message)).toBeVisible();
    expect(screen.queryByText('Notifications are unavailable right now.')).not.toBeInTheDocument();
  });

  test.each([
    ['title', {}],
    ['message', []],
    ['target_path', {}],
    ['is_read', 'true'],
    ['board_name', {}],
    ['list_name', {}],
  ])(
    'keeps the cached row and prevents navigation after malformed %s in mark-read',
    async (field, value) => {
      fetchNotifications.mockResolvedValue({ ok: true, json: async () => [notification] });
      markNotificationRead
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...notification, is_read: true, [field]: value }),
        })
        .mockResolvedValue({ ok: true, json: async () => ({ ...notification, is_read: true }) });
      const user = userEvent.setup();
      renderWithProviders(
        <Routes>
          <Route path="/" element={<AppHeader title="Application" setDrawerOpen={vi.fn()} />} />
          <Route path="/notification-target" element={<h1>Notification destination</h1>} />
        </Routes>,
      );
      await user.click(screen.getByLabelText('notifications'));
      await user.click(await screen.findByText(notification.message));
      expect(await screen.findByText('Could not update that notification.')).toBeVisible();
      expect(screen.getByText(notification.message)).toBeVisible();
      expect(
        screen.queryByRole('heading', { name: 'Notification destination' }),
      ).not.toBeInTheDocument();
      expect(screen.getByLabelText('Clear notification')).toBeEnabled();
      await user.click(screen.getByText(notification.message));
      expect(
        await screen.findByRole('heading', { name: 'Notification destination' }),
      ).toBeVisible();
      expect(markNotificationRead).toHaveBeenCalledTimes(2);
    },
  );

  test.each(['click', 'keyboard'])(
    'Connected Apps supports %s navigation through its real link',
    async (activation) => {
      vi.stubEnv('VITE_MCP_ENABLED', '1');
      fetchNotifications.mockResolvedValue({ ok: true, json: async () => [] });
      const user = userEvent.setup();
      renderWithProviders(
        <Routes>
          <Route path="/" element={<AppHeader title="Application" setDrawerOpen={vi.fn()} />} />
          <Route path="/connections" element={<h1>Connected Apps destination</h1>} />
        </Routes>,
      );
      await user.click(screen.getByLabelText('user profile'));
      const link = screen.getByRole('menuitem', { name: 'Connected Apps' });
      expect(link).toHaveAttribute('href', '/connections');
      if (activation === 'keyboard') {
        await screen.findByRole('menu');
        await user.keyboard('{ArrowDown}');
        expect(link).toHaveFocus();
        await user.keyboard('{Enter}');
      } else await user.click(link);
      expect(
        await screen.findByRole('heading', { name: 'Connected Apps destination' }),
      ).toBeVisible();
    },
  );
  afterEach(() => vi.unstubAllEnvs());
});
