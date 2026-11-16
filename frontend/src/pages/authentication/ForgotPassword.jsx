import { Box, Button, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router';
import AuthPageShell from '../../components/AuthPageShell';
import { forgotPassword } from '../../services/authApiClient';
import { readOkJson } from '../../services/authSession';

export default function ForgotPassword({ showSnackbar }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await forgotPassword({ email });
      const data = await readOkJson(response, 'Password reset request failed.');
      showSnackbar(
        'success',
        data?.message || 'If that account exists, we sent a password reset link.',
      );
      navigate('/login');
    } catch (error) {
      const isNetworkError =
        error instanceof TypeError || error?.message?.toLowerCase().includes('network');
      showSnackbar(
        'error',
        isNetworkError ? 'Network error.' : error?.message || 'Password reset request failed.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell title="Reset your password">
      <Box
        component="form"
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <TextField
          fullWidth
          disabled={isSubmitting}
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Button fullWidth disabled={isSubmitting} type="submit" variant="contained">
          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
        </Button>
        <Typography variant="caption" sx={{ textAlign: 'center', color: 'var(--secondary-color)' }}>
          <Box component={RouterLink} className="auth-link" to="/login">
            Back to Login
          </Box>
        </Typography>
      </Box>
    </AuthPageShell>
  );
}
