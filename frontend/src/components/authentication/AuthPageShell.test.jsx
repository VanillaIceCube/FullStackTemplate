import { render, screen } from '@testing-library/react';
import AuthPageShell from './AuthPageShell';

describe('AuthPageShell', () => {
  it('renders title and child content inside the layout shell', () => {
    render(
      <AuthPageShell title="Test Title">
        <div data-testid="child-element">Child Content</div>
      </AuthPageShell>,
    );

    expect(screen.getByText('FullStackTemplate')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Test Title' })).toBeInTheDocument();
    expect(screen.getByTestId('child-element')).toBeInTheDocument();
  });
});
