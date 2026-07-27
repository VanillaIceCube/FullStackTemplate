import { screen } from '@testing-library/react';
import HomePage from './HomePage';
import { renderWithProviders } from '../test-support/utils';

describe('HomePage', () => {
  test('renders the protected component showcase', () => {
    renderWithProviders(<HomePage />);

    expect(
      screen.getByRole('heading', { name: 'Full-stack component library' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Forms' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open workspace example' })).toHaveAttribute(
      'href',
      '/workspaces',
    );
  });
});
