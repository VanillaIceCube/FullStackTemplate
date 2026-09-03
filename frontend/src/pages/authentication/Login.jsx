import { Box, Button, CircularProgress, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthPageShell from '../../components/AuthPageShell';
import { login } from '../../services/authApiClient';
import { persistAuthSession, readOkJson } from '../../services/authSession';

export default function Login({ showSnackbar }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = sessionStorage.getItem('pendingSnackbar');
    if (!raw) return;

    sessionStorage.removeItem('pendingSnackbar');
    try {
      const payload = JSON.parse(raw);
      showSnackbar(payload?.severity || 'error', payload?.message || 'Please log in again.');
    } catch (_err) {
      showSnackbar('error', 'Please log in again.');
    }
  }, [showSnackbar]);

  const handleLogin = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await login({ email, password });
      const data = await readOkJson(response, 'Login failed.');
      persistAuthSession(data);
      showSnackbar('success', `Welcome ${data.username || email.split('@')[0] || 'there'}!`);
      navigate('/');
    } catch (error) {
      const isNetworkError =
        error instanceof TypeError || error?.message?.toLowerCase().includes('network');
      showSnackbar('error', isNetworkError ? 'Network error.' : error?.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell title="Login">
      <Box
        component="form"
        autoComplete="on"
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        onSubmit={(event) => {
          event.preventDefault();
          handleLogin();
        }}
      >
        <TextField
          fullWidth
          disabled={isSubmitting}
          sx={{ background: 'white' }}
          label="Email"
          type="email"
          name="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          fullWidth
          disabled={isSubmitting}
          sx={{ background: 'white' }}
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button
          fullWidth
          disabled={isSubmitting}
          sx={{ backgroundColor: 'var(--secondary-color)' }}
          type="submit"
          variant="contained"
        >
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Login'}
        </Button>
        <Typography variant="caption" sx={{ textAlign: 'center', color: 'var(--secondary-color)' }}>
          <Box
            component="button"
            type="button"
            disabled={isSubmitting}
            className="auth-link"
            onClick={() => !isSubmitting && navigate('/forgot-password')}
          >
            Forgot Password?
          </Box>
          {' · '}
          <Box
            component="button"
            type="button"
            disabled={isSubmitting}
            className="auth-link"
            onClick={() => !isSubmitting && navigate('/register')}
          >
            Create Account
          </Box>
        </Typography>
      </Box>
    </AuthPageShell>
  );
}
