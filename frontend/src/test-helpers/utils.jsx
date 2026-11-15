import { CssBaseline } from '@mui/material';
import fullStackTheme from '../theme';
import { render } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router';

// Shared test setup: disable MUI ripples (act warnings).
const testTheme = createTheme(fullStackTheme, {
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
  },
});

export function renderWithProviders(ui, { routeEntries = ['/'], ...renderOptions } = {}) {
  return render(
    <ThemeProvider theme={testTheme}>
      <CssBaseline />
      <MemoryRouter initialEntries={routeEntries}>{ui}</MemoryRouter>
    </ThemeProvider>,
    renderOptions,
  );
}
