import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetPassword } from '../../services/authApiClient';
import { renderWithProviders } from '../../test-support/utils';
import ResetPassword from './ResetPassword';

vi.mock('../../services/authApiClient', () => ({
  resetPassword: vi.fn(),
}));

describe('ResetPassword', () => {
  test('submits a valid reset link and matching passwords', async () => {
    const showSnackbar = vi.fn();
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
    const showSnackbar = vi.fn();
    renderWithProviders(<ResetPassword showSnackbar={showSnackbar} />, {
      routeEntries: ['/reset-password'],
    });

    await userEvent.type(screen.getByLabelText('New Password'), 'new-secret');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'new-secret');
    await userEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(resetPassword).not.toHaveBeenCalled();
    expect(showSnackbar).toHaveBeenCalledWith('error', 'Invalid or expired reset link.');
  });

  test('disables controls and button during submission', async () => {
    const showSnackbar = vi.fn();
    let resolveReset;
    resetPassword.mockReturnValue(
      new Promise((resolve) => {
        resolveReset = resolve;
      }),
    );

    renderWithProviders(<ResetPassword showSnackbar={showSnackbar} />, {
      routeEntries: ['/reset-password?uid=user-id&token=reset-token'],
    });

    await userEvent.type(screen.getByLabelText('New Password'), 'new-secret');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'new-secret');

    const submitBtn = screen.getByRole('button', { name: 'Reset Password' });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Resetting...' })).toBeDisabled();
    });

    resolveReset({
      ok: true,
      json: async () => ({ message: 'Password reset successful.' }),
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Reset Password' })).not.toBeDisabled();
    });
  });
});
