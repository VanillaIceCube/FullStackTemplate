import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationsPopover from './NotificationsPopover';
import { renderWithProviders } from '../test-support/utils';
import {
  clearAllNotifications,
  clearNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationApiClient';

jest.mock('../services/notificationApiClient', () => ({
  clearAllNotifications: jest.fn(),
  clearNotification: jest.fn(),
  fetchNotifications: jest.fn(),
  markAllNotificationsRead: jest.fn(),
  markNotificationRead: jest.fn(),
}));

const response = (body, ok = true) => ({
  ok,
  json: jest.fn().mockResolvedValue(body),
});

describe('NotificationsPopover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    fetchNotifications.mockResolvedValue(response([]));
    clearAllNotifications.mockResolvedValue(response({ deleted: 1 }));
    clearNotification.mockResolvedValue(response(null));
    markAllNotificationsRead.mockResolvedValue(response({ updated: 1 }));
    markNotificationRead.mockResolvedValue(
      response({
        id: 1,
        title: 'Notification 1',
        message: 'Message 1',
        is_read: true,
        target_path: '/',
      }),
    );
  });

  test('does not fetch notifications when no access token is present', () => {
    renderWithProviders(<NotificationsPopover />);
    expect(fetchNotifications).not.toHaveBeenCalled();
    expect(screen.getByLabelText('notifications')).toBeInTheDocument();
  });

  test('fetches notifications on mount when access token exists', async () => {
    sessionStorage.setItem('accessToken', 'test-token');
    renderWithProviders(<NotificationsPopover />);

    await waitFor(() => {
      expect(fetchNotifications).toHaveBeenCalledWith('test-token');
    });
  });

  test('shows empty state when notifications array is empty', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem('accessToken', 'test-token');
    fetchNotifications.mockResolvedValue(response([]));

    renderWithProviders(<NotificationsPopover />);
    await waitFor(() => expect(fetchNotifications).toHaveBeenCalled());

    await user.click(screen.getByLabelText('notifications'));
    expect(screen.getByText('No notifications yet.')).toBeInTheDocument();
  });

  test('handles error state during fetch', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem('accessToken', 'test-token');
    fetchNotifications.mockRejectedValue(new Error('Network error'));

    renderWithProviders(<NotificationsPopover />);
    await waitFor(() => expect(fetchNotifications).toHaveBeenCalled());

    await user.click(screen.getByLabelText('notifications'));
    expect(screen.getByText('Notifications are unavailable right now.')).toBeInTheDocument();
  });

  test('marks individual notification read and navigates when clicked', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem('accessToken', 'test-token');
    fetchNotifications.mockResolvedValue(
      response([
        {
          id: 1,
          title: 'Unread Notice',
          message: 'Details here',
          is_read: false,
          target_path: '/',
        },
      ]),
    );

    renderWithProviders(<NotificationsPopover />);
    await waitFor(() => expect(fetchNotifications).toHaveBeenCalled());

    await user.click(screen.getByLabelText('notifications'));
    expect(screen.getByText('Unread Notice')).toBeInTheDocument();

    await user.click(screen.getByText('Unread Notice'));
    expect(markNotificationRead).toHaveBeenCalledWith(1, 'test-token');
  });

  test('clears single notification when clear icon is clicked', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem('accessToken', 'test-token');
    fetchNotifications.mockResolvedValue(
      response([
        {
          id: 10,
          title: 'Item to clear',
          message: 'Body text',
          is_read: true,
        },
      ]),
    );

    renderWithProviders(<NotificationsPopover />);
    await waitFor(() => expect(fetchNotifications).toHaveBeenCalled());

    await user.click(screen.getByLabelText('notifications'));
    expect(screen.getByText('Item to clear')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Clear notification'));
    expect(clearNotification).toHaveBeenCalledWith(10, 'test-token');
  });

  test('handles mark all read action', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem('accessToken', 'test-token');
    fetchNotifications.mockResolvedValue(
      response([
        { id: 1, title: 'Item 1', message: 'Msg 1', is_read: false },
        { id: 2, title: 'Item 2', message: 'Msg 2', is_read: false },
      ]),
    );

    renderWithProviders(<NotificationsPopover />);
    await waitFor(() => expect(fetchNotifications).toHaveBeenCalled());

    await user.click(screen.getByLabelText('notifications'));
    expect(screen.getByText('Mark all read')).toBeInTheDocument();

    await user.click(screen.getByText('Mark all read'));
    expect(markAllNotificationsRead).toHaveBeenCalledWith('test-token');
  });

  test('handles clear all action when all items are read', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem('accessToken', 'test-token');
    fetchNotifications.mockResolvedValue(
      response([
        { id: 1, title: 'Item 1', message: 'Msg 1', is_read: true },
        { id: 2, title: 'Item 2', message: 'Msg 2', is_read: true },
      ]),
    );

    renderWithProviders(<NotificationsPopover />);
    await waitFor(() => expect(fetchNotifications).toHaveBeenCalled());

    await user.click(screen.getByLabelText('notifications'));
    expect(screen.getByText('Clear all')).toBeInTheDocument();

    await user.click(screen.getByText('Clear all'));
    expect(clearAllNotifications).toHaveBeenCalledWith('test-token');
  });
});
