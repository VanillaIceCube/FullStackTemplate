import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import WorkspaceCollectionsPage from './WorkspaceCollectionsPage';
import { collectionFixtures, workspaceFixtures } from '../../test-support/fixtures';
import { collectRowStartPixels } from '../../test-support/layout';
import {
  createDeferred,
  renderWithProviders,
  waitForLoadingToFinish,
} from '../../test-support/utils';
import {
  createCollection,
  deleteCollection,
  fetchCollections as fetchCollectionsApi,
  fetchWorkspace as fetchWorkspaceApi,
  updateCollection,
} from '../../services/workspaceApiClient';

const mockNavigate = vi.fn();
const mockUseParams = vi.fn();

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

vi.mock('../../services/workspaceApiClient', () => ({
  createCollection: vi.fn(),
  deleteCollection: vi.fn(),
  fetchCollections: vi.fn(),
  fetchWorkspace: vi.fn(),
  reorderCollections: vi.fn(),
  updateCollection: vi.fn(),
}));

async function renderLists() {
  const setAppBarHeader = vi.fn();
  const view = renderWithProviders(<WorkspaceCollectionsPage setAppBarHeader={setAppBarHeader} />);

  await waitFor(() => {
    expect(fetchCollectionsApi).toHaveBeenCalledWith('1', 'token');
  });
  await waitForLoadingToFinish();

  return { ...view, setAppBarHeader };
}

function setMobilePullViewport() {
  Object.defineProperty(window, 'innerWidth', { value: 390, configurable: true });
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  Object.defineProperty(window.navigator, 'maxTouchPoints', { value: 1, configurable: true });
}

describe('WorkspaceCollectionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.setItem('accessToken', 'token');
    mockUseParams.mockReturnValue({ workspaceId: '1' });
    fetchCollectionsApi.mockResolvedValue({
      ok: true,
      json: async () => collectionFixtures,
    });
    fetchWorkspaceApi.mockResolvedValue({
      ok: true,
      json: async () => workspaceFixtures[0],
    });
  });

  test('when the page loads, it shows a loading state', async () => {
    const deferred = createDeferred();
    fetchCollectionsApi.mockReturnValueOnce(deferred.promise);

    renderWithProviders(<WorkspaceCollectionsPage setAppBarHeader={vi.fn()} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /collections/i })).not.toBeInTheDocument();

    deferred.resolve({ ok: true, json: async () => [] });
    expect(await screen.findByText(/no collections found/i)).toBeInTheDocument();
  });

  test('when the workspace fetch succeeds, it shows the workspace name as the page title', async () => {
    await renderLists();

    expect(fetchWorkspaceApi).toHaveBeenCalledWith('1', 'token');
    expect(screen.getByRole('heading', { name: 'test_workspace_01' })).toBeInTheDocument();
  });

  test('when the fetch succeeds, it renders the collection items', async () => {
    await renderLists();

    expect(await screen.findByText('test_collection_01')).toBeInTheDocument();
    expect(screen.getByText('test_collection_02')).toBeInTheDocument();
  });

  test('when the fetch fails, it shows an error message', async () => {
    fetchCollectionsApi.mockResolvedValueOnce({ ok: false, status: 500, json: async () => [] });

    await renderLists();

    expect(await screen.findByText('Error: Error: HTTP 500')).toBeInTheDocument();
  });

  test('when the workspaceId is missing, it does not fetch the collections', async () => {
    mockUseParams.mockReturnValue({ workspaceId: undefined });

    renderWithProviders(<WorkspaceCollectionsPage setAppBarHeader={vi.fn()} />);

    await waitFor(() => {
      expect(fetchCollectionsApi).not.toHaveBeenCalled();
    });
  });

  test('when the fetch succeeds with empty data, it shows the empty state message', async () => {
    fetchCollectionsApi.mockResolvedValueOnce({ ok: true, json: async () => [] });

    await renderLists();

    expect(await screen.findByText(/no collections found/i)).toBeInTheDocument();
  });

  test('when the add flow is opened, it shows the input', async () => {
    await renderLists();

    await userEvent.click(screen.getByRole('button', { name: /add new/i }));

    expect(screen.getByPlaceholderText(/new collection name/i)).toBeInTheDocument();
  });

  test('when a valid add is submitted, it creates and renders the new item', async () => {
    createCollection.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 12, name: 'test_collection_03' }),
    });

    await renderLists();

    await userEvent.click(screen.getByRole('button', { name: /add new/i }));

    const input = screen.getByPlaceholderText(/new collection name/i);
    await userEvent.type(input, 'test_collection_03{enter}');

    await waitFor(() => {
      expect(createCollection).toHaveBeenCalledWith(
        '1',
        { name: 'test_collection_03', workspace: '1', description: '' },
        'token',
      );
    });
    expect(await screen.findByText('test_collection_03')).toBeInTheDocument();
  });

  test('when create fails, it shows an error message', async () => {
    createCollection.mockResolvedValueOnce({ ok: false, status: 500, json: async () => [] });

    await renderLists();

    await userEvent.click(screen.getByRole('button', { name: /add new/i }));

    const input = screen.getByPlaceholderText(/new collection name/i);
    await userEvent.type(input, 'test_collection_03{enter}');

    expect(await screen.findByText('Error: Error: HTTP 500')).toBeInTheDocument();
  });

  test('when add is opened and Escape is pressed, it closes the add input', async () => {
    await renderLists();

    await userEvent.click(screen.getByRole('button', { name: /add new/i }));

    const input = screen.getByPlaceholderText(/new collection name/i);
    await userEvent.type(input, 'test_collection_03{Escape}');

    expect(screen.queryByPlaceholderText(/new collection name/i)).not.toBeInTheDocument();
  });

  test('when rename is opened, it shows the edit input prefilled', async () => {
    await renderLists();

    await userEvent.click(
      await screen.findByRole('button', { name: /collection actions for test_collection_01/i }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: /rename/i }));

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('test_collection_01');
  });

  test('when row actions are opened, edit, reorder, and delete actions include icons', async () => {
    await renderLists();

    await userEvent.click(
      await screen.findByRole('button', { name: /collection actions for test_collection_01/i }),
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
    updateCollection.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 10, name: 'test_collection_01 Updated' }),
    });

    await renderLists();

    await userEvent.click(
      await screen.findByRole('button', { name: /collection actions for test_collection_01/i }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: /rename/i }));

    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, 'test_collection_01 Updated{enter}');

    await waitFor(() => {
      expect(updateCollection).toHaveBeenCalledWith(
        10,
        { name: 'test_collection_01 Updated' },
        'token',
      );
    });
    expect(await screen.findByText('test_collection_01 Updated')).toBeInTheDocument();
  });

  test('when update fails, it shows an error message', async () => {
    updateCollection.mockResolvedValueOnce({ ok: false, status: 500, json: async () => [] });

    await renderLists();

    await userEvent.click(
      await screen.findByRole('button', { name: /collection actions for test_collection_01/i }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: /rename/i }));

    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, 'test_collection_01 Updated{enter}');

    expect(await screen.findByText('Error: Error: HTTP 500')).toBeInTheDocument();
  });

  test('when rename is opened and Escape is pressed, it closes the edit input', async () => {
    await renderLists();

    await userEvent.click(
      await screen.findByRole('button', { name: /collection actions for test_collection_01/i }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: /rename/i }));

    const input = screen.getByRole('textbox');
    await userEvent.type(input, '{Escape}');

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  test('when delete is confirmed, it removes the item', async () => {
    deleteCollection.mockResolvedValueOnce({ ok: true });

    await renderLists();

    await userEvent.click(
      await screen.findByRole('button', { name: /collection actions for test_collection_01/i }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: /remove/i }));

    await waitFor(() => {
      expect(deleteCollection).toHaveBeenCalledWith(10, 'token');
    });
    await waitFor(() => {
      expect(screen.queryByText('test_collection_01')).not.toBeInTheDocument();
    });
  });

  test('when delete fails, it shows an error message', async () => {
    deleteCollection.mockResolvedValueOnce({ ok: false, status: 500, json: async () => [] });

    await renderLists();

    await userEvent.click(
      await screen.findByRole('button', { name: /collection actions for test_collection_01/i }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: /remove/i }));

    expect(await screen.findByText('Error: Error: HTTP 500')).toBeInTheDocument();
  });

  test('when reorder mode is opened, it shows drag handles and hides row actions and add', async () => {
    await renderLists();

    expect(
      screen.queryByRole('button', { name: /collection page actions/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('collection-collection')).toHaveStyle('gap: 8px');
    const normalRowStartPixels = collectRowStartPixels(
      screen.getByTestId('collection-collection'),
      ['collection-row-10', 'collection-row-11'],
    );

    await userEvent.click(
      await screen.findByRole('button', { name: /collection actions for test_collection_01/i }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: /^reorder$/i }));

    expect(screen.getByRole('heading', { name: /reorder collections/i })).toBeInTheDocument();
    expect(screen.getByTestId('collection-reorder-collection')).toHaveStyle('gap: 8px');
    const reorderRowStartPixels = collectRowStartPixels(
      screen.getByTestId('collection-reorder-collection'),
      ['collection-reorder-row-10', 'collection-reorder-row-11'],
    );
    expect([
      reorderRowStartPixels['collection-reorder-row-10'],
      reorderRowStartPixels['collection-reorder-row-11'],
    ]).toEqual([
      normalRowStartPixels['collection-row-10'],
      normalRowStartPixels['collection-row-11'],
    ]);
    expect(screen.getByTestId('collection-drag-handle-10')).toBeInTheDocument();
    expect(screen.getByTestId('collection-drag-handle-10').style.touchAction).toBe('none');
    expect(screen.getByTestId('collection-drag-handle-11')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /collection actions for test_collection_01/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add new/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /done reordering/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /done reordering/i }));

    expect(screen.getByRole('heading', { name: 'test_workspace_01' })).toBeInTheDocument();
  });

  test('when an item is clicked, it navigates to the expected route', async () => {
    await renderLists();

    await userEvent.click(await screen.findByText('test_collection_01'));

    expect(mockNavigate).toHaveBeenCalledWith('/workspace/1/collection/10', {
      state: { workspaceName: 'test_workspace_01', collectionName: 'test_collection_01' },
    });
  });

  test('when the workspaceId changes, it refetches the collections', async () => {
    const { rerender } = renderWithProviders(
      <WorkspaceCollectionsPage setAppBarHeader={vi.fn()} />,
    );

    await waitFor(() => {
      expect(fetchCollectionsApi).toHaveBeenCalledWith('1', 'token');
    });

    mockUseParams.mockReturnValue({ workspaceId: '2' });
    fetchCollectionsApi.mockResolvedValueOnce({ ok: true, json: async () => [] });

    rerender(<WorkspaceCollectionsPage setAppBarHeader={vi.fn()} />);

    await waitFor(() => {
      expect(fetchCollectionsApi).toHaveBeenCalledWith('2', 'token');
    });
  });

  test('when a mobile user pulls down from the top, it refreshes the collections', async () => {
    setMobilePullViewport();
    await renderLists();

    const collection = screen.getByTestId('collection-collection');
    fireEvent.touchStart(collection, { touches: [{ clientX: 120, clientY: 20 }] });
    fireEvent.touchMove(collection, { touches: [{ clientX: 124, clientY: 112 }] });

    expect(await screen.findByRole('status', { name: /release to refresh/i })).toBeInTheDocument();

    fireEvent.touchEnd(collection, { changedTouches: [{ clientX: 124, clientY: 112 }] });

    await waitFor(() => {
      expect(fetchCollectionsApi).toHaveBeenCalledTimes(2);
    });
  });

  test('when a mobile refresh is pending, it keeps existing collections visible', async () => {
    setMobilePullViewport();
    await renderLists();

    const deferred = createDeferred();
    fetchCollectionsApi.mockReturnValueOnce(deferred.promise);

    const collection = screen.getByTestId('collection-collection');
    fireEvent.touchStart(collection, { touches: [{ clientX: 120, clientY: 20 }] });
    fireEvent.touchMove(collection, { touches: [{ clientX: 124, clientY: 112 }] });
    fireEvent.touchEnd(collection, { changedTouches: [{ clientX: 124, clientY: 112 }] });

    await waitFor(() => {
      expect(fetchCollectionsApi).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByText('test_collection_01')).toBeInTheDocument();
    expect(screen.getByText('test_collection_02')).toBeInTheDocument();
    expect(screen.queryByText(/^loading/i)).not.toBeInTheDocument();

    deferred.resolve({ ok: true, json: async () => [{ id: 12, name: 'test_collection_03' }] });

    expect(await screen.findByText('test_collection_03')).toBeInTheDocument();
  });

  test('when a mobile refresh fails, it keeps existing collections visible with the error', async () => {
    setMobilePullViewport();
    await renderLists();

    fetchCollectionsApi.mockResolvedValueOnce({ ok: false, status: 500, json: async () => [] });

    const collection = screen.getByTestId('collection-collection');
    fireEvent.touchStart(collection, { touches: [{ clientX: 120, clientY: 20 }] });
    fireEvent.touchMove(collection, { touches: [{ clientX: 124, clientY: 112 }] });
    fireEvent.touchEnd(collection, { changedTouches: [{ clientX: 124, clientY: 112 }] });

    expect(await screen.findByText('Error: Error: HTTP 500')).toBeInTheDocument();
    expect(screen.getByText('test_collection_01')).toBeInTheDocument();
    expect(screen.getByText('test_collection_02')).toBeInTheDocument();
  });

  test('when a mobile user pulls down from a collection row, it refreshes the collections', async () => {
    setMobilePullViewport();
    await renderLists();

    const rowButton = screen.getByTestId('collection-row-button-10');
    fireEvent.touchStart(rowButton, { touches: [{ clientX: 120, clientY: 20 }] });
    fireEvent.touchMove(rowButton, { touches: [{ clientX: 122, clientY: 112 }] });

    expect(await screen.findByRole('status', { name: /release to refresh/i })).toBeInTheDocument();

    fireEvent.touchEnd(rowButton, { changedTouches: [{ clientX: 122, clientY: 112 }] });

    await waitFor(() => {
      expect(fetchCollectionsApi).toHaveBeenCalledTimes(2);
    });
  });

  test('when a mobile user pulls down from page whitespace, it refreshes the collections', async () => {
    setMobilePullViewport();
    await renderLists();

    fireEvent.touchStart(document.body, { touches: [{ clientX: 20, clientY: 20 }] });
    fireEvent.touchMove(document.body, { touches: [{ clientX: 22, clientY: 112 }] });
    fireEvent.touchEnd(document.body, { changedTouches: [{ clientX: 22, clientY: 112 }] });

    await waitFor(() => {
      expect(fetchCollectionsApi).toHaveBeenCalledTimes(2);
    });
  });

  test('when editing a collection, pull down does not refresh', async () => {
    setMobilePullViewport();
    await renderLists();

    await userEvent.click(
      await screen.findByRole('button', { name: /collection actions for test_collection_01/i }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: /rename/i }));

    const input = screen.getByRole('textbox');
    fireEvent.touchStart(input, { touches: [{ clientX: 120, clientY: 20 }] });
    fireEvent.touchMove(input, { touches: [{ clientX: 120, clientY: 120 }] });
    fireEvent.touchEnd(input, { changedTouches: [{ clientX: 120, clientY: 120 }] });

    await waitFor(() => {
      expect(fetchCollectionsApi).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
