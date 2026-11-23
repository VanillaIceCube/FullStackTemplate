vi.mock('@mui/material', async () => await vi.importActual('@mui/material'));
import { Route, Routes } from 'react-router';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationsMenu from './NotificationsMenu';
import { renderWithProviders } from '../../test-helpers/utils';
import {
  clearAllNotifications,
  clearNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notificationApiClient';

vi.mock('../../services/notificationApiClient', () => ({
  clearAllNotifications: vi.fn(),
  clearNotification: vi.fn(),
  fetchNotifications: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}));

const response = (body, ok = true) => ({
  ok,
  json: vi.fn().mockResolvedValue(body),
});

describe('NotificationsMenu', () => {
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
    renderWithProviders(<NotificationsMenu />);

    await waitFor(() => expect(fetchNotifications).toHaveBeenCalled());
    await user.click(screen.getByLabelText('notifications'));

    expect(screen.getByText('Template ready')).toBeInTheDocument();
    expect(screen.getByText('Your shell is ready.')).toBeInTheDocument();
    await user.click(screen.getByText('Mark all read'));
    expect(markAllNotificationsRead).toHaveBeenCalledWith();
  });

  test('handles notification loading error and retry', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem('accessToken', 'access');
    fetchNotifications.mockResolvedValueOnce(response(null, false));

    renderWithProviders(<NotificationsMenu />);

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

    renderWithProviders(<NotificationsMenu />);

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

    renderWithProviders(<NotificationsMenu />, {
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
    renderWithProviders(<NotificationsMenu />);
    await user.click(screen.getByLabelText('notifications'));
    await user.click(await screen.findByText('Slow notification'));
    expect(screen.getByLabelText('Clear notification')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Mark all read' })).toBeDisabled();
    resolveJson({ ...notification, is_read: true });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Clear all' })).toBeEnabled());
  });
});

describe('NotificationsMenu response and navigation', () => {
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
  ])('keeps the menu usable for malformed notification JSON: %j', async (body) => {
    fetchNotifications
      .mockResolvedValueOnce({ ok: true, json: async () => body })
      .mockResolvedValue({ ok: true, json: async () => [notification] });
    const user = userEvent.setup();
    renderWithProviders(<NotificationsMenu />);
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
          <Route path="/" element={<NotificationsMenu />} />
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
});
