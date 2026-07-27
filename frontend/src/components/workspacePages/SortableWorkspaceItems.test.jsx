import { screen } from '@testing-library/react';

import SortableWorkspaceItems, {
  DRAG_HANDLE_TOUCH_STYLE,
  WORKSPACE_ITEM_ROW_MIN_HEIGHT,
  WORKSPACE_ITEM_FOOTPRINT_HEIGHT,
  WORKSPACE_ITEM_VERTICAL_GAP,
} from './SortableWorkspaceItems';
import { renderWithProviders } from '../../test-support/utils';

const items = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Beta' },
];

describe('SortableWorkspaceItems', () => {
  test('when items are empty, it shows the empty message', () => {
    renderWithProviders(
      <SortableWorkspaceItems
        items={[]}
        emptyMessage="No rows found."
        isReordering={false}
        onDragEnd={vi.fn()}
        renderItem={(item) => <div>{item.name}</div>}
        testIdPrefix="row"
      />,
    );

    expect(screen.getByText('No rows found.')).toBeInTheDocument();
    const emptyState = screen.getByTestId('row-empty-state');
    expect(emptyState.style.minHeight).toBe('52px');
    expect(emptyState.style.borderBottom).toBe('2px solid var(--secondary-color)');
  });

  test('when not reordering, it renders the rows in a stable vertical collection', () => {
    renderWithProviders(
      <SortableWorkspaceItems
        items={items}
        emptyMessage="No rows found."
        isReordering={false}
        onDragEnd={vi.fn()}
        renderItem={(item) => <div data-testid={`row-${item.id}`}>{item.name}</div>}
        testIdPrefix="row"
      />,
    );

    expect(screen.getByTestId('row-collection')).toHaveStyle(`gap: ${WORKSPACE_ITEM_VERTICAL_GAP}`);
    expect(screen.getByTestId('row-1')).toHaveTextContent('Alpha');
    expect(screen.getByTestId('row-2')).toHaveTextContent('Beta');
  });

  test('when reordering, it wraps rows with sortable drag props', () => {
    renderWithProviders(
      <SortableWorkspaceItems
        items={items}
        emptyMessage="No rows found."
        isReordering
        onDragEnd={vi.fn()}
        renderItem={(item, handleProps) => (
          <button
            type="button"
            data-testid={`drag-${item.id}`}
            style={DRAG_HANDLE_TOUCH_STYLE}
            {...handleProps}
          >
            {item.name}
          </button>
        )}
        testIdPrefix="row"
      />,
    );

    expect(screen.getByTestId('row-reorder-collection')).toHaveStyle(
      `gap: ${WORKSPACE_ITEM_VERTICAL_GAP}`,
    );
    expect(screen.getByTestId('row-sortable-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('drag-1').style.touchAction).toBe('none');
    expect(WORKSPACE_ITEM_ROW_MIN_HEIGHT).toBe(42);
    expect(WORKSPACE_ITEM_FOOTPRINT_HEIGHT).toBe(52);
  });
});
