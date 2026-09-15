import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { forgotPassword } from '../../services/authApiClient';
import { renderWithProviders } from '../../test-support/utils';
import ForgotPassword from './ForgotPassword';

jest.mock('../../services/authApiClient', () => ({
  forgotPassword: jest.fn(),
}));

describe('ForgotPassword', () => {
  test('requests a password reset and disables inputs during request', async () => {
    const showSnackbar = jest.fn();
    let resolveForgotPassword;
    forgotPassword.mockReturnValue(
      new Promise((resolve) => {
        resolveForgotPassword = resolve;
      }),
    );

    renderWithProviders(<ForgotPassword showSnackbar={showSnackbar} />, {
      routeEntries: ['/forgot-password'],
    });

    await userEvent.type(screen.getByLabelText('Email'), 'mapper@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    expect(screen.getByRole('button', { name: 'Sending Link...' })).toBeDisabled();
    expect(screen.getByLabelText('Email')).toBeDisabled();

    resolveForgotPassword({
      ok: true,
      json: async () => ({ message: 'Password reset link has been sent!' }),
    });

    await waitFor(() =>
      expect(showSnackbar).toHaveBeenCalledWith('success', 'Password reset link has been sent!'),
    );
    expect(forgotPassword).toHaveBeenCalledWith({ email: 'mapper@example.com' });
  });

  test('handles network failure gracefully', async () => {
    const showSnackbar = jest.fn();
    forgotPassword.mockRejectedValue(new TypeError('Failed to fetch'));

    renderWithProviders(<ForgotPassword showSnackbar={showSnackbar} />, {
      routeEntries: ['/forgot-password'],
    });

    await userEvent.type(screen.getByLabelText('Email'), 'mapper@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() => expect(showSnackbar).toHaveBeenCalledWith('error', 'Network error.'));
    expect(screen.getByLabelText('Email')).not.toBeDisabled();
  });
});
