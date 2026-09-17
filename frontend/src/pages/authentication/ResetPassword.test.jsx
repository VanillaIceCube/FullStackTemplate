import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetPassword } from '../../services/authApiClient';
import { renderWithProviders } from '../../test-support/utils';
import ResetPassword from './ResetPassword';

jest.mock('../../services/authApiClient', () => ({
  resetPassword: jest.fn(),
}));

describe('ResetPassword', () => {
  test('submits a valid reset link and matching passwords', async () => {
    const showSnackbar = jest.fn();
    resetPassword.mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Password reset successful.' }),
    });
    renderWithProviders(<ResetPassword showSnackbar={showSnackbar} />, {
      routeEntries: ['/reset-password?uid=user-id&token=reset-token'],
    });

    await userEvent.type(screen.getByLabelText('New Password'), 'new-secret');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'new-secret');
    await userEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() =>
      expect(resetPassword).toHaveBeenCalledWith({
        uid: 'user-id',
        token: 'reset-token',
        password: 'new-secret',
      }),
    );
  });

  test('rejects a reset page without link credentials', async () => {
    const showSnackbar = jest.fn();
    renderWithProviders(<ResetPassword showSnackbar={showSnackbar} />, {
      routeEntries: ['/reset-password'],
    });

    await userEvent.type(screen.getByLabelText('New Password'), 'new-secret');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'new-secret');
    await userEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(resetPassword).not.toHaveBeenCalled();
    expect(showSnackbar).toHaveBeenCalledWith('error', 'Invalid or expired reset link.');
  });

  test('disables inputs during pending reset request and recovers on failure', async () => {
    const showSnackbar = jest.fn();
    let resolveReset;
    resetPassword.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveReset = resolve;
        }),
    );
    renderWithProviders(<ResetPassword showSnackbar={showSnackbar} />, {
      routeEntries: ['/reset-password?uid=user-id&token=reset-token'],
    });

    await userEvent.type(screen.getByLabelText('New Password'), 'new-secret-123');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'new-secret-123');

    const submitBtn = screen.getByRole('button', { name: 'Reset Password' });
    await userEvent.click(submitBtn);

    await waitFor(() => expect(submitBtn).toBeDisabled());

    resolveReset({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Link expired.' }),
    });

    await waitFor(() => expect(submitBtn).not.toBeDisabled());
    expect(showSnackbar).toHaveBeenCalledWith('error', 'Link expired.');
  });
});
