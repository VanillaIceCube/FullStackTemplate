import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetPassword } from '../../services/authApiClient';
import { renderWithProviders } from '../../test-support/utils';
import ResetPassword from './ResetPassword';

jest.mock('../../services/authApiClient', () => ({
  resetPassword: jest.fn(),
}));

describe('ResetPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  test('disables button during submission and prevents duplicate submits', async () => {
    const showSnackbar = jest.fn();
    let resolveResetPassword;
    const promise = new Promise((resolve) => {
      resolveResetPassword = resolve;
    });
    resetPassword.mockReturnValue(promise);

    renderWithProviders(<ResetPassword showSnackbar={showSnackbar} />, {
      routeEntries: ['/reset-password?uid=user-id&token=reset-token'],
    });

    await userEvent.type(screen.getByLabelText('New Password'), 'new-secret');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'new-secret');

    const submitButton = screen.getByRole('button', { name: 'Reset Password' });
    await userEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(resetPassword).toHaveBeenCalledTimes(1);

    fireEvent.submit(submitButton);
    expect(resetPassword).toHaveBeenCalledTimes(1);

    resolveResetPassword({
      ok: true,
      json: async () => ({ message: 'Password reset successful.' }),
    });

    await waitFor(() => expect(submitButton).not.toBeDisabled());
  });

  test('disables button when reset link parameters are missing', () => {
    const showSnackbar = jest.fn();
    renderWithProviders(<ResetPassword showSnackbar={showSnackbar} />, {
      routeEntries: ['/reset-password'],
    });

    const submitButton = screen.getByRole('button', { name: 'Reset Password' });
    expect(submitButton).toBeDisabled();
  });
});
