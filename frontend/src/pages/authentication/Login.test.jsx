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

  test('disables submit button and input fields while submitting', async () => {
    const showSnackbar = jest.fn();
    let resolveLogin;
    login.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        }),
    );

    renderWithProviders(<Login showSnackbar={showSnackbar} />, { routeEntries: ['/login'] });

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'secret');
    await userEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();

    resolveLogin({
      ok: true,
      json: async () => ({
        access: 'a',
        refresh: 'r',
        username: 'test',
        email: 'test@example.com',
      }),
    });

    await waitFor(() => expect(submitButton).not.toBeDisabled());
  });
});
