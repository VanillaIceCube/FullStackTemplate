import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { forgotPassword } from '../../services/authApiClient';
import { renderWithProviders } from '../../test-support/utils';
import ForgotPassword from './ForgotPassword';

jest.mock('../../services/authApiClient', () => ({
  forgotPassword: jest.fn(),
}));

describe('ForgotPassword', () => {
  test('requests a password reset', async () => {
    const showSnackbar = jest.fn();
    forgotPassword.mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Password reset link has been sent!' }),
    });
    renderWithProviders(<ForgotPassword showSnackbar={showSnackbar} />, {
      routeEntries: ['/forgot-password'],
    });

    await userEvent.type(screen.getByLabelText('Email'), 'mapper@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() =>
      expect(showSnackbar).toHaveBeenCalledWith('success', 'Password reset link has been sent!'),
    );
    expect(forgotPassword).toHaveBeenCalledWith({ email: 'mapper@example.com' });
  });

  test('disables controls and button during submission', async () => {
    const showSnackbar = jest.fn();
    let resolveForgot;
    forgotPassword.mockReturnValue(
      new Promise((resolve) => {
        resolveForgot = resolve;
      }),
    );

    renderWithProviders(<ForgotPassword showSnackbar={showSnackbar} />, {
      routeEntries: ['/forgot-password'],
    });

    await userEvent.type(screen.getByLabelText('Email'), 'mapper@example.com');
    const submitBtn = screen.getByRole('button', { name: 'Send Reset Link' });
    userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled();
    });

    resolveForgot({
      ok: true,
      json: async () => ({ message: 'Password reset link has been sent!' }),
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Send Reset Link' })).not.toBeDisabled();
    });
  });
});
