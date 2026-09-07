import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { forgotPassword } from '../../services/authApiClient';
import { renderWithProviders } from '../../test-support/utils';
import ForgotPassword from './ForgotPassword';

jest.mock('../../services/authApiClient', () => ({
  forgotPassword: jest.fn(),
}));

describe('ForgotPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  test('disables button during submission and prevents duplicate submits', async () => {
    const showSnackbar = jest.fn();
    let resolveForgotPassword;
    const promise = new Promise((resolve) => {
      resolveForgotPassword = resolve;
    });
    forgotPassword.mockReturnValue(promise);

    renderWithProviders(<ForgotPassword showSnackbar={showSnackbar} />, {
      routeEntries: ['/forgot-password'],
    });

    await userEvent.type(screen.getByLabelText('Email'), 'mapper@example.com');

    const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });
    await userEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(forgotPassword).toHaveBeenCalledTimes(1);

    fireEvent.submit(submitButton);
    expect(forgotPassword).toHaveBeenCalledTimes(1);

    resolveForgotPassword({
      ok: true,
      json: async () => ({ message: 'Password reset link has been sent!' }),
    });

    await waitFor(() => expect(submitButton).not.toBeDisabled());
  });
});
