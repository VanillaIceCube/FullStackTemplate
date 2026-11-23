import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';

export function AuthLink({ to, children }) {
  return (
    <Box component={RouterLink} className="auth-link" to={to}>
      {children}
    </Box>
  );
}

export default function AuthForm({ title, onSubmit, isSubmitting, submitLabel, footer, children }) {
  return (
    <Stack
      spacing={2}
      sx={{
        alignItems: 'center',
        maxWidth: 'sm',
        p: { xs: 3, sm: 5.5 },
        mx: 'auto',
        justifyContent: 'center',
        minHeight: '85vh',
      }}
    >
      <Typography variant="h3" sx={{ mt: 2, fontWeight: 'bold', color: 'white' }}>
        FullStackTemplate
      </Typography>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 3, sm: 4 },
          pb: 2,
          width: '100%',
        }}
      >
        <Typography component="h1" variant="h5" sx={{ mb: 2, color: 'var(--secondary-color)' }}>
          {title}
        </Typography>
        <Box
          component="form"
          aria-label={title}
          autoComplete="on"
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          {children}
          <Button fullWidth type="submit" disabled={isSubmitting} variant="contained">
            {submitLabel}
          </Button>
          <Typography
            variant="caption"
            sx={{ textAlign: 'center', color: 'var(--secondary-color)' }}
          >
            {footer}
          </Typography>
        </Box>
      </Paper>
    </Stack>
  );
}
