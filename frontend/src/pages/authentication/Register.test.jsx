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

  test('disables inputs during pending registration and recovers on error', async () => {
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

    await userEvent.type(screen.getByLabelText('Email'), 'mapper@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret-pass-123');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'secret-pass-123');

    const submitBtn = screen.getByRole('button', { name: 'Register' });
    await userEvent.click(submitBtn);

    await waitFor(() => expect(submitBtn).toBeDisabled());
    expect(screen.getByLabelText('Email')).toBeDisabled();

    resolveRegister({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Email already exists.' }),
    });

    await waitFor(() => expect(submitBtn).not.toBeDisabled());
    expect(showSnackbar).toHaveBeenCalledWith('error', 'Email already exists.');
  });
});
