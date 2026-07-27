// WorkspaceCollectionsPage loads one workspace's collections and plugs workspace-specific CRUD/navigation into workspace UI.
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { Box, Button, IconButton, Typography } from '@mui/material';
import Add from '@mui/icons-material/Add';
import DragIndicator from '@mui/icons-material/DragIndicator';
import MoreVert from '@mui/icons-material/MoreVert';
import { useNavigate, useParams } from 'react-router-dom';
import InlineTextEditor from '../../components/workspacePages/InlineTextEditor';
import WorkspacePageShell from '../../components/workspacePages/WorkspacePageShell';
import WorkspaceRowActionMenu from '../../components/workspacePages/WorkspaceRowActionMenu';
import SortableWorkspaceItems, {
  WORKSPACE_ITEM_ROW_MIN_HEIGHT,
  DRAG_HANDLE_TOUCH_STYLE,
} from '../../components/workspacePages/SortableWorkspaceItems';
import {
  createCollection,
  deleteCollection,
  fetchCollections as fetchCollectionsApi,
  fetchWorkspace as fetchWorkspaceApi,
  reorderCollections,
  updateCollection,
} from '../../services/workspaceApiClient';
import { rememberLastWorkspace } from '../../services/lastWorkspace';
import { usePullToRefresh } from '../../hooks/useMobileGestures';

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

const rowTitleSx = { fontSize: '1.1rem', textAlign: 'left' };

export default function WorkspaceCollectionsPage({
  active = true,
  onPageReady = () => {},
  setAppBarHeader,
}) {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const token = sessionStorage.getItem('accessToken');
  const [workspaceName, setWorkspaceName] = useState('');
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReordering, setIsReordering] = useState(false);
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [editingCollectionId, setEditingCollectionId] = useState(null);
  const [editCollectionName, setEditCollectionName] = useState('');
  const actionMenuOpen = Boolean(actionMenuAnchorEl);

  useLayoutEffect(() => {
    if (!active) return;
    setAppBarHeader('');
  }, [active, setAppBarHeader]);

  useEffect(() => {
    if (!active) return;
    document.title = workspaceName ? `FullStackTemplate - ${workspaceName}` : 'FullStackTemplate';
  }, [active, workspaceName]);

  useEffect(() => {
    if (!loading) {
      onPageReady();
    }
  }, [loading, onPageReady]);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchCollectionsApi(workspaceId, token);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setCollections(data);
      setError(null);
    } catch (err) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  }, [token, workspaceId]);

  const fetchWorkspaceName = useCallback(async () => {
    setWorkspaceName('');

    if (!workspaceId) return;

    try {
      const response = await fetchWorkspaceApi(workspaceId, token);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setWorkspaceName(data?.name ?? '');
    } catch (err) {
      setWorkspaceName('');
      setError(err.toString());
    }
  }, [token, workspaceId]);

  useEffect(() => {
    if (workspaceId) {
      rememberLastWorkspace(workspaceId);
      fetchCollections();
      fetchWorkspaceName();
    }
  }, [workspaceId, fetchCollections, fetchWorkspaceName]);

  const closeActionMenu = () => {
    setActionMenuAnchorEl(null);
    setSelectedCollection(null);
  };

  const closeEdit = () => {
    setEditingCollectionId(null);
    setEditCollectionName('');
  };

  const startReordering = () => {
    closeEdit();
    setIsAdding(false);
    closeActionMenu();
    setIsReordering(true);
  };

  const openActionMenu = (event, collection) => {
    event.stopPropagation();
    setActionMenuAnchorEl(event.currentTarget);
    setSelectedCollection(collection);
  };

  const onAdd = async () => {
    if (!newCollectionName.trim()) return;
    setError(null);

    try {
      const response = await createCollection(
        workspaceId,
        { name: newCollectionName, workspace: workspaceId, description: '' },
        token,
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const created = await response.json();
      setCollections((prev) => [...prev, created]);
      setIsAdding(false);
      setNewCollectionName('');
    } catch (err) {
      setError(err.toString());
    }
  };

  const startEditing = () => {
    setEditingCollectionId(selectedCollection.id);
    setEditCollectionName(selectedCollection.name);
    closeActionMenu();
  };

  const onEdit = async () => {
    if (!editCollectionName.trim()) return;
    setError(null);

    try {
      const response = await updateCollection(
        editingCollectionId,
        { name: editCollectionName },
        token,
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const updated = await response.json();
      setCollections((prev) =>
        prev.map((collection) => (collection.id === updated.id ? updated : collection)),
      );
      closeEdit();
    } catch (err) {
      setError(err.toString());
    }
  };

  const pullToRefreshDisabled =
    loading || isReordering || isAdding || Boolean(editingCollectionId) || actionMenuOpen;
  const { isRefreshing, pullDistance, refreshReady } = usePullToRefresh({
    enabled: !pullToRefreshDisabled,
    onRefresh: fetchCollections,
  });
  const pullContentOffset = isRefreshing ? 0 : Math.min(pullDistance / 2.5, 36);

  const onDelete = async (id) => {
    setError(null);

    try {
      const response = await deleteCollection(id, token);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setCollections((prev) => prev.filter((collection) => collection.id !== id));
    } catch (err) {
      setError(err.toString());
    } finally {
      closeActionMenu();
    }
  };

  const onDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const oldIndex = collections.findIndex((collection) => collection.id === active.id);
    const newIndex = collections.findIndex((collection) => collection.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const previousCollections = collections;
    const reorderedCollections = arrayMove(collections, oldIndex, newIndex);
    setCollections(reorderedCollections);
    setError(null);

    try {
      const response = await reorderCollections(
        workspaceId,
        reorderedCollections.map((collection) => collection.id),
        token,
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const updatedCollections = await response.json();
      setCollections(updatedCollections);
    } catch (err) {
      setCollections(previousCollections);
      setError(err.toString());
    }
  };

  const renderCollectionRow = (collection, handleProps = null) => {
    if (editingCollectionId === collection.id) {
      return (
        <InlineTextEditor
          value={editCollectionName}
          onChange={setEditCollectionName}
          onSubmit={onEdit}
          onCancel={closeEdit}
        />
      );
    }

    if (isReordering) {
      return (
        <Box
          data-testid={`collection-reorder-row-${collection.id}`}
          sx={{ ...rowSx, px: 1, py: 0.5 }}
        >
          <Typography variant="body1" fontWeight="bold" sx={rowTitleSx}>
            {collection.name}
          </Typography>
          <IconButton
            size="small"
            aria-label={`Drag ${collection.name}`}
            data-testid={`collection-drag-handle-${collection.id}`}
            sx={{ color: 'var(--secondary-color)', cursor: 'grab' }}
            style={DRAG_HANDLE_TOUCH_STYLE}
            {...handleProps}
          >
            <DragIndicator />
          </IconButton>
        </Box>
      );
    }

    return (
      <Box data-testid={`collection-row-${collection.id}`} sx={rowSx}>
        <Button
          variant="text"
          data-pull-refresh-start="true"
          data-testid={`collection-row-button-${collection.id}`}
          sx={{
            flexGrow: 1,
            justifyContent: 'flex-start',
            color: 'var(--secondary-color)',
            textTransform: 'none',
          }}
          onClick={() =>
            navigate(`/workspace/${workspaceId}/collection/${collection.id}`, {
              state: { workspaceName, collectionName: collection.name },
            })
          }
        >
          <Typography variant="body1" fontWeight="bold" sx={rowTitleSx}>
            {collection.name}
          </Typography>
        </Button>
        <IconButton
          size="small"
          aria-label={`Collection actions for ${collection.name}`}
          onClick={(event) => openActionMenu(event, collection)}
          sx={{ color: 'var(--secondary-color)' }}
        >
          <MoreVert />
        </IconButton>
      </Box>
    );
  };

  return (
    <>
      <WorkspacePageShell
        title={isReordering ? 'Reorder Collections' : workspaceName}
        loading={loading}
        error={error}
        hasContent={collections.length > 0}
        pullDistance={pullDistance}
        refreshReady={refreshReady}
        isRefreshing={isRefreshing}
        pullContentOffset={pullContentOffset}
      >
        <SortableWorkspaceItems
          items={collections}
          emptyMessage="No collections found."
          isReordering={isReordering}
          onDragEnd={onDragEnd}
          renderItem={renderCollectionRow}
          testIdPrefix="collection"
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
            placeholder="New Collection Name..."
            value={newCollectionName}
            onChange={setNewCollectionName}
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
        onRemove={() => onDelete(selectedCollection.id)}
        reorderDisabled={collections.length < 2}
      />
    </>
  );
}
