import { screen, waitFor } from '@testing-library/react';
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

  test('disables inputs and button during pending submission and recovers on failure', async () => {
    const showSnackbar = jest.fn();
    let resolveLogin;
    login.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        }),
    );
    renderWithProviders(<Login showSnackbar={showSnackbar} />, { routeEntries: ['/login'] });

    await userEvent.type(screen.getByLabelText('Email'), 'mapper@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret');

    const submitBtn = screen.getByRole('button', { name: 'Login' });
    await userEvent.click(submitBtn);

    await waitFor(() => expect(submitBtn).toBeDisabled());
    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(screen.getByLabelText('Password')).toBeDisabled();

    resolveLogin({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid credentials.' }),
    });

    await waitFor(() => expect(submitBtn).not.toBeDisabled());
    expect(showSnackbar).toHaveBeenCalledWith('error', 'Invalid credentials.');
  });
});
