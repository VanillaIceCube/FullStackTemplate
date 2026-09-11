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

  test('disables submit button during submission and resets on error', async () => {
    const showSnackbar = jest.fn();
    let resolveForgot;
    forgotPassword.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveForgot = resolve;
        }),
    );

    renderWithProviders(<ForgotPassword showSnackbar={showSnackbar} />, {
      routeEntries: ['/forgot-password'],
    });

    await userEvent.type(screen.getByLabelText('Email'), 'mapper@example.com');

    const submitBtn = screen.getByRole('button', { name: 'Send Reset Link' });
    await userEvent.click(submitBtn);

    expect(forgotPassword).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled();
    expect(screen.getByLabelText('Email')).toBeDisabled();

    resolveForgot({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid email address.' }),
    });

    await waitFor(() =>
      expect(showSnackbar).toHaveBeenCalledWith('error', 'Invalid email address.'),
    );
    expect(screen.getByRole('button', { name: 'Send Reset Link' })).not.toBeDisabled();
    expect(screen.getByLabelText('Email')).not.toBeDisabled();
  });
});
