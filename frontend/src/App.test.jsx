import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  test('redirects signed-out users to login', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  test('shows the protected component library to signed-in users', async () => {
    sessionStorage.setItem('accessToken', 'token');
    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'Full-stack component library' }),
    ).toBeInTheDocument();
    expect(screen.getByText('fullstacktemplate')).toBeInTheDocument();
  });
});
