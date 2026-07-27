import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';

import CollectionItemsPage from './CollectionItemsPage';
import { itemFixtures, workspaceFixtures } from '../../test-support/fixtures';
import { collectRowStartPixels } from '../../test-support/layout';
import {
  createDeferred,
  renderWithProviders,
  waitForLoadingToFinish,
} from '../../test-support/utils';
import {
  createItem,
  deleteItem,
  fetchItems as fetchItemsApi,
  fetchCollection as fetchCollectionApi,
  fetchWorkspace as fetchWorkspaceApi,
  updateItem,
} from '../../services/workspaceApiClient';

const mockUseParams = vi.fn();

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useParams: () => mockUseParams(),
}));

vi.mock('../../services/workspaceApiClient', () => ({
  createItem: vi.fn(),
  deleteItem: vi.fn(),
  fetchItems: vi.fn(),
  fetchCollection: vi.fn(),
  fetchWorkspace: vi.fn(),
  reorderItems: vi.fn(),
  updateItem: vi.fn(),
}));

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

async function renderNotes(routeEntries = ['/workspace/1/collection/5']) {
  const setAppBarHeader = vi.fn();
  const view = renderWithProviders(
    <>
      <CollectionItemsPage setAppBarHeader={setAppBarHeader} />
      <LocationDisplay />
    </>,
    { routeEntries },
  );

  await waitFor(() => {
    expect(fetchItemsApi).toHaveBeenCalledWith('5', 'token');
  });
  await waitForLoadingToFinish();

  return { ...view, setAppBarHeader };
}

function setMobilePullViewport() {
  Object.defineProperty(window, 'innerWidth', { value: 390, configurable: true });
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  Object.defineProperty(window.navigator, 'maxTouchPoints', { value: 1, configurable: true });
}

describe('CollectionItemsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.setItem('accessToken', 'token');
    mockUseParams.mockReturnValue({ workspaceId: '1', collectionId: '5' });
    fetchItemsApi.mockResolvedValue({
      ok: true,
      json: async () => itemFixtures,
    });
    fetchCollectionApi.mockResolvedValue({
      ok: true,
      json: async () => ({ name: 'List 5' }),
    });
    fetchWorkspaceApi.mockResolvedValue({
      ok: true,
      json: async () => workspaceFixtures[0],
    });
  });

  test('when the page loads, it shows a loading state', async () => {
    const deferred = createDeferred();
    fetchItemsApi.mockReturnValueOnce(deferred.promise);

    renderWithProviders(<CollectionItemsPage setAppBarHeader={vi.fn()} />, {
      routeEntries: ['/workspace/1/collection/5'],
    });

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^items$/i })).not.toBeInTheDocument();

    deferred.resolve({ ok: true, json: async () => [] });
    expect(await screen.findByText(/no items found/i)).toBeInTheDocument();
  });

  test('when the collection fetch succeeds, it shows the collection name as the page title', async () => {
    await renderNotes();

    expect(screen.getByRole('heading', { name: 'List 5' })).toBeInTheDocument();
  });

  test('when the fetch succeeds, it renders the collection items', async () => {
    await renderNotes();

    expect(await screen.findByText('test_item_01')).toBeInTheDocument();
    expect(screen.getByText('test_item_02')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /mark test_item_01 complete/i })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /mark test_item_02 complete/i })).toBeChecked();
  });

  test('when the fetch fails, it shows an error message', async () => {
    fetchItemsApi.mockResolvedValueOnce({ ok: false, status: 500, json: async () => [] });

    await renderNotes();

    expect(await screen.findByText('Error: Error: HTTP 500')).toBeInTheDocument();
  });

  test('when the add flow is opened, it shows the input', async () => {
    await renderNotes();

    await userEvent.click(screen.getByRole('button', { name: /add new/i }));

    expect(screen.getByPlaceholderText(/new item/i)).toBeInTheDocument();
  });

  test('when a valid add is submitted, it creates and renders the new item', async () => {
    createItem.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 103, item: 'test_item_03' }),
    });

    await renderNotes();

    await userEvent.click(screen.getByRole('button', { name: /add new/i }));

    const input = screen.getByPlaceholderText(/new item/i);
    await userEvent.type(input, 'test_item_03{enter}');

    await waitFor(() => {
      expect(createItem).toHaveBeenCalledWith(
        '5',
        { item: 'test_item_03', collection: '5', description: '' },
        'token',
      );
    });
    expect(await screen.findByText('test_item_03')).toBeInTheDocument();
  });

  test('when rename is opened, it shows the edit input prefilled', async () => {
    await renderNotes();

    await userEvent.click(
      await screen.findByRole('button', { name: /item actions for test_item_01/i }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: /rename/i }));

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('test_item_01');
  });

  test('when row actions are opened, edit, reorder, and delete actions include icons', async () => {
    await renderNotes();

    await userEvent.click(
      await screen.findByRole('button', { name: /item actions for test_item_01/i }),
    );

    expect(screen.getByRole('menuitem', { name: /rename/i })).toContainElement(
      screen.getByTestId('EditIcon'),
    );
    expect(screen.getByRole('menuitem', { name: /reorder/i })).toContainElement(
      screen.getByTestId('ReorderIcon'),
    );
    expect(screen.getByRole('menuitem', { name: /remove/i })).toContainElement(
      screen.getByTestId('DeleteIcon'),
    );
  });

  test('when a valid edit is submitted, it updates the item', async () => {
    updateItem.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 101, item: 'test_item_01 Updated', status: 'Not Started' }),
    });

    await renderNotes();

    await userEvent.click(
      await screen.findByRole('button', { name: /item actions for test_item_01/i }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: /rename/i }));

    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, 'test_item_01 Updated{enter}');

    await waitFor(() => {
      expect(updateItem).toHaveBeenCalledWith(101, { item: 'test_item_01 Updated' }, 'token');
    });
    expect(await screen.findByText('test_item_01 Updated')).toBeInTheDocument();
  });

  test('when a checkbox is toggled, it updates the status immediately', async () => {
    updateItem.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 101, item: 'test_item_01', status: 'Complete' }),
    });

    await renderNotes();

    const checkbox = screen.getByRole('checkbox', { name: /mark test_item_01 complete/i });
    await userEvent.click(checkbox);

    expect(checkbox).toBeChecked();
    await waitFor(() => {
      expect(updateItem).toHaveBeenCalledWith(101, { status: 'Complete' }, 'token');
    });
    expect(screen.getByText('test_item_01')).toHaveStyle('text-decoration: line-through');
  });

  test('when delete is confirmed, it removes the item', async () => {
    deleteItem.mockResolvedValueOnce({ ok: true });

    await renderNotes();

    await userEvent.click(
      await screen.findByRole('button', { name: /item actions for test_item_01/i }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: /remove/i }));

    await waitFor(() => {
      expect(deleteItem).toHaveBeenCalledWith(101, 'token');
    });
    await waitFor(() => {
      expect(screen.queryByText('test_item_01')).not.toBeInTheDocument();
    });
  });

  test('when an item is clicked, it keeps the current route', async () => {
    await renderNotes();

    const locationBefore = screen.getByTestId('location').textContent;
    await userEvent.click(await screen.findByText('test_item_01'));

    expect(screen.getByTestId('location')).toHaveTextContent(locationBefore);
  });

  test('when reorder mode is opened, it shows drag handles and hides item actions and add', async () => {
    await renderNotes();

    expect(screen.queryByRole('button', { name: /items page actions/i })).not.toBeInTheDocument();
    expect(screen.getByTestId('item-collection')).toHaveStyle('gap: 8px');
    const normalRowStartPixels = collectRowStartPixels(screen.getByTestId('item-collection'), [
      'item-row-101',
      'item-row-102',
    ]);

    await userEvent.click(
      await screen.findByRole('button', { name: /item actions for test_item_01/i }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: /^reorder$/i }));

    expect(screen.getByRole('heading', { name: /reorder items/i })).toBeInTheDocument();
    expect(screen.getByTestId('item-reorder-collection')).toHaveStyle('gap: 8px');
    const reorderRowStartPixels = collectRowStartPixels(
      screen.getByTestId('item-reorder-collection'),
      ['item-reorder-row-101', 'item-reorder-row-102'],
    );
    expect([
      reorderRowStartPixels['item-reorder-row-101'],
      reorderRowStartPixels['item-reorder-row-102'],
    ]).toEqual([normalRowStartPixels['item-row-101'], normalRowStartPixels['item-row-102']]);
    expect(screen.getByTestId('item-drag-handle-101')).toBeInTheDocument();
    expect(screen.getByTestId('item-drag-handle-101').style.touchAction).toBe('none');
    expect(screen.getByTestId('item-drag-handle-102')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /item actions for test_item_01/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add new/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /done reordering/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /mark test_item_01 complete/i })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /mark test_item_02 complete/i })).toBeChecked();
    expect(screen.getByText('test_item_02')).toHaveStyle('text-decoration: line-through');
    expect(screen.getByTestId('item-reorder-row-102')).toHaveStyle('opacity: 0.72');

    await userEvent.click(screen.getByRole('button', { name: /done reordering/i }));

    expect(screen.getByRole('heading', { name: 'List 5' })).toBeInTheDocument();
  });

  test('when the workspace fetch succeeds, it sets the app bar header to the parent workspace', async () => {
    const setAppBarHeader = vi.fn();

    renderWithProviders(<CollectionItemsPage setAppBarHeader={setAppBarHeader} />, {
      routeEntries: ['/workspace/1/collection/5'],
    });

    await waitFor(() => {
      expect(fetchWorkspaceApi).toHaveBeenCalledWith('1', 'token');
    });
    await waitFor(() => {
      expect(setAppBarHeader).toHaveBeenCalledWith('test_workspace_01');
    });
    await waitFor(() => {
      expect(document.title).toBe('FullStackTemplate - test_workspace_01 - List 5');
    });
  });

  test('when navigation provides a workspace name, it sets the app bar header before the fallback request returns', async () => {
    const deferred = createDeferred();
    fetchWorkspaceApi.mockReturnValueOnce(deferred.promise);
    const setAppBarHeader = vi.fn();

    renderWithProviders(<CollectionItemsPage setAppBarHeader={setAppBarHeader} />, {
      routeEntries: [
        {
          pathname: '/workspace/1/collection/5',
          state: { workspaceName: 'Project workspace', collectionName: 'Inbox' },
        },
      ],
    });

    expect(setAppBarHeader).toHaveBeenCalledWith('Project workspace');
    expect(document.title).toBe('FullStackTemplate - Project workspace - Inbox');
    await waitForLoadingToFinish();
  });

  test('when the collection fetch fails, it shows an error and does not show the old hardcoded title', async () => {
    const deferred = createDeferred();
    fetchItemsApi.mockReturnValueOnce(deferred.promise);
    fetchCollectionApi.mockResolvedValueOnce({ ok: false, status: 500, json: async () => [] });

    const setAppBarHeader = vi.fn();

    renderWithProviders(<CollectionItemsPage setAppBarHeader={setAppBarHeader} />, {
      routeEntries: ['/workspace/1/collection/5'],
    });

    expect(await screen.findByText('Error: Error: HTTP 500')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^items$/i })).not.toBeInTheDocument();

    await act(async () => {
      deferred.resolve({ ok: true, json: async () => itemFixtures });
    });
    await waitForLoadingToFinish();
  });

  test('when add is opened and Escape is pressed, it closes the add input', async () => {
    await renderNotes();

    await userEvent.click(screen.getByRole('button', { name: /add new/i }));

    const input = screen.getByPlaceholderText(/new item/i);
    await userEvent.type(input, 'test_item_03{Escape}');

    expect(screen.queryByPlaceholderText(/new item/i)).not.toBeInTheDocument();
  });

  test('when rename is opened and Escape is pressed, it closes the edit input', async () => {
    await renderNotes();

    await userEvent.click(
      await screen.findByRole('button', { name: /item actions for test_item_01/i }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: /rename/i }));

    const input = screen.getByRole('textbox');
    await userEvent.type(input, '{Escape}');

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  test('when create fails, it shows an error message', async () => {
    createItem.mockResolvedValueOnce({ ok: false, status: 500, json: async () => [] });

    await renderNotes();

    await userEvent.click(screen.getByRole('button', { name: /add new/i }));

    const input = screen.getByPlaceholderText(/new item/i);
    await userEvent.type(input, 'test_item_03{enter}');

    expect(await screen.findByText('Error: Error: HTTP 500')).toBeInTheDocument();
  });

  test('when update fails, it shows an error message', async () => {
    updateItem.mockResolvedValueOnce({ ok: false, status: 500, json: async () => [] });

    await renderNotes();

    await userEvent.click(
      await screen.findByRole('button', { name: /item actions for test_item_01/i }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: /rename/i }));

    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, 'test_item_01 Updated{enter}');

    expect(await screen.findByText('Error: Error: HTTP 500')).toBeInTheDocument();
  });

  test('when delete fails, it shows an error message', async () => {
    deleteItem.mockResolvedValueOnce({ ok: false, status: 500, json: async () => [] });

    await renderNotes();

    await userEvent.click(
      await screen.findByRole('button', { name: /item actions for test_item_01/i }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: /remove/i }));

    expect(await screen.findByText('Error: Error: HTTP 500')).toBeInTheDocument();
  });

  test('when the last item is gone, the empty row keeps Add New at one complete item-item height', async () => {
    fetchItemsApi.mockResolvedValueOnce({ ok: true, json: async () => [] });

    await renderNotes();

    expect(await screen.findByText(/no items found/i)).toBeInTheDocument();
    const emptyState = screen.getByTestId('item-empty-state');
    expect(emptyState.style.minHeight).toBe('52px');
    expect(emptyState.style.borderBottom).toBe('2px solid var(--secondary-color)');
    expect(screen.getByRole('button', { name: /add new/i })).toBeInTheDocument();
  });

  test('when a mobile user pulls down from the top, it refreshes the items', async () => {
    setMobilePullViewport();
    await renderNotes();

    const collection = screen.getByTestId('item-collection');
    fireEvent.touchStart(collection, { touches: [{ clientX: 120, clientY: 20 }] });
    fireEvent.touchMove(collection, { touches: [{ clientX: 122, clientY: 112 }] });

    expect(await screen.findByRole('status', { name: /release to refresh/i })).toBeInTheDocument();

    fireEvent.touchEnd(collection, { changedTouches: [{ clientX: 122, clientY: 112 }] });

    await waitFor(() => {
      expect(fetchItemsApi).toHaveBeenCalledTimes(2);
    });
  });

  test('when a mobile refresh is pending, it keeps existing items visible', async () => {
    setMobilePullViewport();
    await renderNotes();

    const deferred = createDeferred();
    fetchItemsApi.mockReturnValueOnce(deferred.promise);

    const collection = screen.getByTestId('item-collection');
    fireEvent.touchStart(collection, { touches: [{ clientX: 120, clientY: 20 }] });
    fireEvent.touchMove(collection, { touches: [{ clientX: 122, clientY: 112 }] });
    fireEvent.touchEnd(collection, { changedTouches: [{ clientX: 122, clientY: 112 }] });

    await waitFor(() => {
      expect(fetchItemsApi).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByText('test_item_01')).toBeInTheDocument();
    expect(screen.getByText('test_item_02')).toBeInTheDocument();
    expect(screen.queryByText(/^loading/i)).not.toBeInTheDocument();

    deferred.resolve({
      ok: true,
      json: async () => [{ id: 103, item: 'test_item_03', status: 'Not Started' }],
    });

    expect(await screen.findByText('test_item_03')).toBeInTheDocument();
  });

  test('when a mobile refresh fails, it keeps existing items visible with the error', async () => {
    setMobilePullViewport();
    await renderNotes();

    fetchItemsApi.mockResolvedValueOnce({ ok: false, status: 500, json: async () => [] });

    const collection = screen.getByTestId('item-collection');
    fireEvent.touchStart(collection, { touches: [{ clientX: 120, clientY: 20 }] });
    fireEvent.touchMove(collection, { touches: [{ clientX: 122, clientY: 112 }] });
    fireEvent.touchEnd(collection, { changedTouches: [{ clientX: 122, clientY: 112 }] });

    expect(await screen.findByText('Error: Error: HTTP 500')).toBeInTheDocument();
    expect(screen.getByText('test_item_01')).toBeInTheDocument();
    expect(screen.getByText('test_item_02')).toBeInTheDocument();
  });

  test('when a mobile user pulls down from page whitespace, it refreshes the items', async () => {
    setMobilePullViewport();
    await renderNotes();

    fireEvent.touchStart(document.body, { touches: [{ clientX: 20, clientY: 20 }] });
    fireEvent.touchMove(document.body, { touches: [{ clientX: 22, clientY: 112 }] });
    fireEvent.touchEnd(document.body, { changedTouches: [{ clientX: 22, clientY: 112 }] });

    await waitFor(() => {
      expect(fetchItemsApi).toHaveBeenCalledTimes(2);
    });
  });

  test('when editing a item, pull down does not refresh', async () => {
    setMobilePullViewport();
    await renderNotes();

    await userEvent.click(
      await screen.findByRole('button', { name: /item actions for test_item_01/i }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: /rename/i }));

    const input = screen.getByRole('textbox');
    fireEvent.touchStart(input, { touches: [{ clientX: 120, clientY: 20 }] });
    fireEvent.touchMove(input, { touches: [{ clientX: 120, clientY: 120 }] });
    fireEvent.touchEnd(input, { changedTouches: [{ clientX: 120, clientY: 120 }] });

    await waitFor(() => {
      expect(fetchItemsApi).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
