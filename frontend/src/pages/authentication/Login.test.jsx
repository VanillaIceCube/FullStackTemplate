import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { login } from '../../services/authApiClient';
import { renderWithProviders } from '../../test-support/utils';
import Login from './Login';

jest.mock('../../services/authApiClient', () => ({
  login: jest.fn(),
}));

describe('Login', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  test('logs in and stores the returned session', async () => {
    const showSnackbar = jest.fn();
    login.mockResolvedValue({
      ok: true,
      json: async () => ({
        access: 'access-token',
        refresh: 'refresh-token',
        username: 'mapper',
        email: 'mapper@example.com',
      }),
    });
    renderWithProviders(<Login showSnackbar={showSnackbar} />, { routeEntries: ['/login'] });

    await userEvent.type(screen.getByLabelText('Email'), 'mapper@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => expect(sessionStorage.getItem('accessToken')).toBe('access-token'));
    expect(login).toHaveBeenCalledWith({ email: 'mapper@example.com', password: 'secret' });
    expect(showSnackbar).toHaveBeenCalledWith('success', 'Welcome mapper!');
  });

  test('disables button during submission and prevents duplicate submits', async () => {
    const showSnackbar = jest.fn();
    let resolveLogin;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    login.mockReturnValue(loginPromise);

    renderWithProviders(<Login showSnackbar={showSnackbar} />, { routeEntries: ['/login'] });

    await userEvent.type(screen.getByLabelText('Email'), 'mapper@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret');

    const submitButton = screen.getByRole('button', { name: 'Login' });
    await userEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(login).toHaveBeenCalledTimes(1);

    fireEvent.submit(submitButton);
    expect(login).toHaveBeenCalledTimes(1);

    resolveLogin({
      ok: true,
      json: async () => ({
        access: 'access-token',
        refresh: 'refresh-token',
        username: 'mapper',
        email: 'mapper@example.com',
      }),
    });

    await waitFor(() => expect(submitButton).not.toBeDisabled());
  });

  test('shows a pending session-expired message', () => {
    const showSnackbar = jest.fn();
    sessionStorage.setItem(
      'pendingSnackbar',
      JSON.stringify({ severity: 'error', message: 'Please sign in again.' }),
    );

    renderWithProviders(<Login showSnackbar={showSnackbar} />, { routeEntries: ['/login'] });

    expect(showSnackbar).toHaveBeenCalledWith('error', 'Please sign in again.');
    expect(sessionStorage.getItem('pendingSnackbar')).toBeNull();
  });
});
