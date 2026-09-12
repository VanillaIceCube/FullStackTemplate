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

  test('disables inputs and button during submission', async () => {
    let resolveResetPassword;
    const requestPromise = new Promise((resolve) => {
      resolveResetPassword = resolve;
    });
    resetPassword.mockReturnValue(requestPromise);

    renderWithProviders(<ResetPassword showSnackbar={jest.fn()} />, {
      routeEntries: ['/reset-password?uid=user-id&token=reset-token'],
    });

    await userEvent.type(screen.getByLabelText('New Password'), 'new-secret');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'new-secret');
    await userEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(screen.getByLabelText('New Password')).toBeDisabled();
    expect(screen.getByLabelText('Confirm Password')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeDisabled();

    resolveResetPassword({
      ok: true,
      json: async () => ({ message: 'Password reset successful.' }),
    });

    await waitFor(() => expect(screen.getByLabelText('New Password')).not.toBeDisabled());
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
});
