// CollectionItemsPage loads one collection's items and adds item-specific completion behavior to workspace UI.
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { Box, Button, Checkbox, IconButton, Typography } from '@mui/material';
import Add from '@mui/icons-material/Add';
import DragIndicator from '@mui/icons-material/DragIndicator';
import MoreVert from '@mui/icons-material/MoreVert';
import { useLocation, useParams } from 'react-router-dom';
import InlineTextEditor from '../../components/workspacePages/InlineTextEditor';
import WorkspacePageShell from '../../components/workspacePages/WorkspacePageShell';
import WorkspaceRowActionMenu from '../../components/workspacePages/WorkspaceRowActionMenu';
import SortableWorkspaceItems, {
  WORKSPACE_ITEM_ROW_MIN_HEIGHT,
  DRAG_HANDLE_TOUCH_STYLE,
} from '../../components/workspacePages/SortableWorkspaceItems';
import {
  createItem,
  deleteItem,
  fetchItems as fetchItemsApi,
  fetchCollection as fetchCollectionApi,
  fetchWorkspace as fetchWorkspaceApi,
  reorderItems,
  updateItem,
} from '../../services/workspaceApiClient';
import { rememberLastWorkspace } from '../../services/lastWorkspace';
import { usePullToRefresh } from '../../hooks/useMobileGestures';

const ITEM_STATUS_NOT_STARTED = 'Not Started';
const ITEM_STATUS_COMPLETE = 'Complete';
const isItemComplete = (item) => item.status === ITEM_STATUS_COMPLETE;
const formatDocumentTitle = (workspaceName, collectionName) =>
  workspaceName && collectionName
    ? `FullStackTemplate - ${workspaceName} - ${collectionName}`
    : 'FullStackTemplate';

const rowSx = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: 'var(--secondary-background-color)',
  color: 'var(--secondary-color)',
  borderRadius: 1,
  width: '100%',
  minHeight: WORKSPACE_ITEM_ROW_MIN_HEIGHT,
  boxSizing: 'border-box',
};

const pageActionButtonSx = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'left',
  background: 'var(--secondary-background-color)',
  color: 'var(--secondary-color)',
};

export default function CollectionItemsPage({
  active = true,
  onPageReady = () => {},
  setAppBarHeader,
}) {
  const { workspaceId, collectionId } = useParams();
  const location = useLocation();
  const token = sessionStorage.getItem('accessToken');
  const [workspaceName, setWorkspaceName] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReordering, setIsReordering] = useState(false);
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [editingItemId, setEditingItemId] = useState(null);
  const [editItem, setEditItem] = useState('');
  const actionMenuOpen = Boolean(actionMenuAnchorEl);

  // Preserve the AppBar's existing workspace-only behavior; its title is unrelated to the browser tab.
  useLayoutEffect(() => {
    if (!active) return;
    setAppBarHeader(location.state?.workspaceName || workspaceName || '');
  }, [active, workspaceId, workspaceName, location.state?.workspaceName, setAppBarHeader]);

  useEffect(() => {
    if (!active) return;
    document.title = formatDocumentTitle(
      location.state?.workspaceName || workspaceName,
      location.state?.collectionName || collectionName,
    );
  }, [
    active,
    workspaceName,
    collectionName,
    location.state?.workspaceName,
    location.state?.collectionName,
  ]);

  useEffect(() => {
    if (!loading) {
      onPageReady();
    }
  }, [loading, onPageReady]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchItemsApi(collectionId, token);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  }, [token, collectionId]);

  const fetchCollectionName = useCallback(async () => {
    setCollectionName('');

    if (!collectionId) return;
    try {
      const response = await fetchCollectionApi(collectionId, token);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const collectionData = await response.json();
      setCollectionName(collectionData?.name ?? '');
    } catch (err) {
      setCollectionName('');
      setError(err.toString());
    }
  }, [collectionId, token]);

  const fetchWorkspaceName = useCallback(
    async (isActive = () => true) => {
      if (!workspaceId) return;

      try {
        const response = await fetchWorkspaceApi(workspaceId, token);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const workspaceData = await response.json();
        if (isActive()) {
          setWorkspaceName(workspaceData?.name ?? '');
          if (active) {
            setAppBarHeader(workspaceData?.name ?? '');
          }
        }
      } catch (err) {
        if (isActive()) {
          setWorkspaceName('');
          if (active) {
            setAppBarHeader('');
          }
        }
        setError(err.toString());
      }
    },
    [active, workspaceId, token, setAppBarHeader],
  );

  useEffect(() => {
    let active = true;
    if (collectionId) {
      rememberLastWorkspace(workspaceId);
      fetchTasks();
      fetchCollectionName();
      fetchWorkspaceName(() => active);
    }
    return () => {
      active = false;
    };
  }, [workspaceId, collectionId, fetchTasks, fetchCollectionName, fetchWorkspaceName]);

  const closeActionMenu = () => {
    setActionMenuAnchorEl(null);
    setSelectedItem(null);
  };

  const closeEdit = () => {
    setEditingItemId(null);
    setEditItem('');
  };

  const startReordering = () => {
    closeEdit();
    setIsAdding(false);
    closeActionMenu();
    setIsReordering(true);
  };

  const openActionMenu = (event, item) => {
    setActionMenuAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const onAdd = async () => {
    if (!newItem.trim()) return;
    setError(null);

    try {
      const response = await createItem(
        collectionId,
        { item: newItem, collection: collectionId, description: '' },
        token,
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const created = await response.json();
      setItems((prev) => [...prev, created]);
      setIsAdding(false);
      setNewItem('');
    } catch (err) {
      setError(err.toString());
    }
  };

  const startEditing = () => {
    setEditingItemId(selectedItem.id);
    setEditItem(selectedItem.item);
    closeActionMenu();
  };

  const onEdit = async () => {
    if (!editItem.trim()) return;
    setError(null);

    try {
      const response = await updateItem(editingItemId, { item: editItem }, token);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const updated = await response.json();
      setItems((prev) =>
        prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
      );
      closeEdit();
    } catch (err) {
      setError(err.toString());
    }
  };

  const onToggleStatus = async (event, taskToToggle) => {
    event.stopPropagation();
    const status = event.target.checked ? ITEM_STATUS_COMPLETE : ITEM_STATUS_NOT_STARTED;
    setError(null);
    setItems((prev) =>
      prev.map((item) => (item.id === taskToToggle.id ? { ...item, status } : item)),
    );

    try {
      const response = await updateItem(taskToToggle.id, { status }, token);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const updated = await response.json();
      setItems((prev) =>
        prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
      );
    } catch (err) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === taskToToggle.id ? { ...item, status: taskToToggle.status } : item,
        ),
      );
      setError(err.toString());
    }
  };

  const pullToRefreshDisabled =
    loading || isReordering || isAdding || Boolean(editingItemId) || actionMenuOpen;
  const { isRefreshing, pullDistance, refreshReady } = usePullToRefresh({
    enabled: !pullToRefreshDisabled,
    onRefresh: fetchTasks,
  });
  const pullContentOffset = isRefreshing ? 0 : Math.min(pullDistance / 2.5, 36);

  const onDelete = async (id) => {
    setError(null);

    try {
      const response = await deleteItem(id, token);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.toString());
    } finally {
      closeActionMenu();
    }
  };

  const onDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const previousItems = items;
    const reorderedItems = arrayMove(items, oldIndex, newIndex);
    setItems(reorderedItems);
    setError(null);

    try {
      const response = await reorderItems(
        collectionId,
        reorderedItems.map((item) => item.id),
        token,
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const updatedTasks = await response.json();
      setItems(updatedTasks);
    } catch (err) {
      setItems(previousItems);
      setError(err.toString());
    }
  };

  const renderItemRow = (item, handleProps = null) => {
    if (editingItemId === item.id) {
      return (
        <InlineTextEditor
          value={editItem}
          onChange={setEditItem}
          onSubmit={onEdit}
          onCancel={closeEdit}
        />
      );
    }

    const complete = isItemComplete(item);
    const taskRowSx = { ...rowSx, px: 1, py: 0.5, opacity: complete ? 0.72 : 1 };

    return (
      <Box
        data-testid={`${isReordering ? 'item-reorder-row' : 'item-row'}-${item.id}`}
        sx={taskRowSx}
      >
        <Checkbox
          checked={complete}
          onClick={(event) => event.stopPropagation()}
          onChange={isReordering ? undefined : (event) => onToggleStatus(event, item)}
          inputProps={{ 'aria-label': `Mark ${item.item} complete` }}
          sx={{
            color: 'var(--secondary-color)',
            p: 0.5,
            mr: 1,
            pointerEvents: isReordering ? 'none' : 'auto',
            '&.Mui-checked': { color: 'var(--secondary-color)' },
          }}
        />
        <Typography
          variant="body1"
          fontWeight="bold"
          sx={{
            flexGrow: 1,
            fontSize: '1.1rem',
            textAlign: 'left',
            textDecoration: complete ? 'line-through' : 'none',
          }}
        >
          {item.item}
        </Typography>
        {isReordering ? (
          <IconButton
            size="small"
            aria-label={`Drag ${item.item}`}
            data-testid={`item-drag-handle-${item.id}`}
            sx={{ color: 'var(--secondary-color)', cursor: 'grab' }}
            style={DRAG_HANDLE_TOUCH_STYLE}
            {...handleProps}
          >
            <DragIndicator />
          </IconButton>
        ) : (
          <IconButton
            size="small"
            aria-label={`Item actions for ${item.item}`}
            onClick={(event) => {
              event.stopPropagation();
              openActionMenu(event, item);
            }}
            sx={{ color: 'var(--secondary-color)' }}
          >
            <MoreVert />
          </IconButton>
        )}
      </Box>
    );
  };

  return (
    <>
      <WorkspacePageShell
        title={isReordering ? 'Reorder Items' : collectionName}
        loading={loading}
        error={error}
        hasContent={items.length > 0}
        pullDistance={pullDistance}
        refreshReady={refreshReady}
        isRefreshing={isRefreshing}
        pullContentOffset={pullContentOffset}
      >
        <SortableWorkspaceItems
          items={items}
          emptyMessage="No items found."
          isReordering={isReordering}
          onDragEnd={onDragEnd}
          renderItem={renderItemRow}
          testIdPrefix="item"
        />
        {isReordering ? (
          <Button variant="text" sx={pageActionButtonSx} onClick={() => setIsReordering(false)}>
            <Typography
              variant="body1"
              align="center"
              fontWeight="bold"
              sx={{ fontSize: '1.1rem' }}
            >
              Done Reordering
            </Typography>
          </Button>
        ) : !isAdding ? (
          <Button
            variant="text"
            sx={pageActionButtonSx}
            startIcon={<Add />}
            onClick={() => setIsAdding(true)}
          >
            <Typography
              variant="body1"
              align="center"
              fontWeight="bold"
              sx={{ fontSize: '1.1rem' }}
            >
              Add New
            </Typography>
          </Button>
        ) : (
          <InlineTextEditor
            placeholder="New Item..."
            value={newItem}
            onChange={setNewItem}
            onSubmit={onAdd}
            onCancel={() => setIsAdding(false)}
          />
        )}
      </WorkspacePageShell>

      <WorkspaceRowActionMenu
        anchorEl={actionMenuAnchorEl}
        open={actionMenuOpen}
        onClose={closeActionMenu}
        onRename={startEditing}
        onReorder={startReordering}
        onRemove={() => onDelete(selectedItem.id)}
        reorderDisabled={items.length < 2}
      />
    </>
  );
}
