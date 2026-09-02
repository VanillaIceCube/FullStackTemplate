import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { register } from '../../services/authApiClient';
import { renderWithProviders } from '../../test-support/utils';
import Register from './Register';

jest.mock('../../services/authApiClient', () => ({
  register: jest.fn(),
}));

describe('Register', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test('creates an account and stores the session', async () => {
    const showSnackbar = jest.fn();
    register.mockResolvedValue({
      ok: true,
      json: async () => ({
        access: 'access-token',
        refresh: 'refresh-token',
        username: 'mapper',
        email: 'mapper@example.com',
      }),
    });
    renderWithProviders(<Register showSnackbar={showSnackbar} />, {
      routeEntries: ['/register'],
    });

    await userEvent.type(screen.getByLabelText('Email'), 'mapper@example.com');
    await userEvent.type(screen.getByLabelText('Username (optional)'), 'mapper');
    await userEvent.type(screen.getByLabelText('Password'), 'secret');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => expect(sessionStorage.getItem('accessToken')).toBe('access-token'));
    expect(register).toHaveBeenCalledWith({
      email: 'mapper@example.com',
      username: 'mapper',
      password: 'secret',
    });
  });

  test('rejects mismatched passwords locally', async () => {
    const showSnackbar = jest.fn();
    renderWithProviders(<Register showSnackbar={showSnackbar} />, {
      routeEntries: ['/register'],
    });

    await userEvent.type(screen.getByLabelText('Password'), 'one');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'two');
    await userEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(register).not.toHaveBeenCalled();
    expect(showSnackbar).toHaveBeenCalledWith('error', 'Passwords do not match.');
  });

  test('disables form inputs and button while submitting', async () => {
    const showSnackbar = jest.fn();
    let resolveRegister;
    register.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRegister = resolve;
        }),
    );

    renderWithProviders(<Register showSnackbar={showSnackbar} />, {
      routeEntries: ['/register'],
    });

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Register' });

    await userEvent.type(emailInput, 'mapper@example.com');
    await userEvent.type(passwordInput, 'secret');
    await userEvent.type(confirmPasswordInput, 'secret');
    await userEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(emailInput).toBeDisabled();

    resolveRegister({
      ok: true,
      json: async () => ({
        access: 'a',
        refresh: 'r',
        username: 'm',
        email: 'mapper@example.com',
      }),
    });

    await waitFor(() => expect(submitButton).not.toBeDisabled());
  });
});
