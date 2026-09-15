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

  test('creates an account, disables inputs during submission, and stores the session', async () => {
    const showSnackbar = jest.fn();
    let resolveRegister;
    register.mockReturnValue(
      new Promise((resolve) => {
        resolveRegister = resolve;
      }),
    );

    renderWithProviders(<Register showSnackbar={showSnackbar} />, {
      routeEntries: ['/register'],
    });

    await userEvent.type(screen.getByLabelText('Email'), 'mapper@example.com');
    await userEvent.type(screen.getByLabelText('Username (optional)'), 'mapper');
    await userEvent.type(screen.getByLabelText('Password'), 'secret');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(screen.getByRole('button', { name: 'Registering...' })).toBeDisabled();
    expect(screen.getByLabelText('Email')).toBeDisabled();

    resolveRegister({
      ok: true,
      json: async () => ({
        access: 'access-token',
        refresh: 'refresh-token',
        username: 'mapper',
        email: 'mapper@example.com',
      }),
    });

    await waitFor(() => expect(sessionStorage.getItem('accessToken')).toBe('access-token'));
    expect(register).toHaveBeenCalledWith({
      email: 'mapper@example.com',
      username: 'mapper',
      password: 'secret',
    });
  });

  test('shows error on API failure and re-enables inputs', async () => {
    const showSnackbar = jest.fn();
    register.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Email already exists.' }),
    });

    renderWithProviders(<Register showSnackbar={showSnackbar} />, {
      routeEntries: ['/register'],
    });

    await userEvent.type(screen.getByLabelText('Email'), 'existing@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() =>
      expect(showSnackbar).toHaveBeenCalledWith('error', 'Email already exists.'),
    );
    expect(screen.getByLabelText('Email')).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Register' })).not.toBeDisabled();
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
});
