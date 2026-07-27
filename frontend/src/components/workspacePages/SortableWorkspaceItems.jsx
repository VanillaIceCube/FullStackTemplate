// Shared ordered-row renderer; parent pages provide row UI while this component owns sortable wiring.
import React from 'react';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, Typography } from '@mui/material';
import Divider from '@mui/material/Divider';

export const WORKSPACE_ITEM_VERTICAL_GAP = '8px';
export const WORKSPACE_ITEM_ROW_MIN_HEIGHT = 42;
export const WORKSPACE_ITEM_FOOTPRINT_HEIGHT = 52;
export const VERTICAL_REORDER_DRAG_MODIFIERS = [
  ({ transform }) => ({
    ...transform,
    x: 0,
  }),
];
export const DRAG_HANDLE_TOUCH_STYLE = {
  touchAction: 'none',
  userSelect: 'none',
  WebkitUserSelect: 'none',
};

const listStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: WORKSPACE_ITEM_VERTICAL_GAP,
};

const dividerSx = { borderBottomWidth: 2, bgcolor: 'var(--secondary-color)' };

function SortableWorkspaceItem({ itemId, testIdPrefix, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: itemId,
  });

  return (
    <Box
      ref={setNodeRef}
      data-testid={`${testIdPrefix}-sortable-row-${itemId}`}
      sx={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.78 : 1,
        zIndex: isDragging ? 1 : 'auto',
      }}
    >
      {children({ handleProps: { ...attributes, ...listeners } })}
    </Box>
  );
}

export default function SortableWorkspaceItems({
  items,
  emptyMessage,
  isReordering,
  onDragEnd,
  renderItem,
  testIdPrefix,
}) {
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (!items.length) {
    return (
      <Typography
        data-testid={`${testIdPrefix}-empty-state`}
        variant="body1"
        align="center"
        fontWeight="bold"
        style={{
          minHeight: `${WORKSPACE_ITEM_FOOTPRINT_HEIGHT}px`,
          borderBottom: '2px solid var(--secondary-color)',
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // Match one rendered collection item: 42px row + 8px collection gap + 2px divider.
          minHeight: WORKSPACE_ITEM_FOOTPRINT_HEIGHT,
          boxSizing: 'border-box',
          px: 2,
          borderRadius: 1,
          borderBottom: '2px solid var(--secondary-color)',
          bgcolor: 'var(--secondary-background-color)',
          color: 'var(--secondary-color)',
          fontSize: '1.1rem',
        }}
      >
        {emptyMessage}
      </Typography>
    );
  }

  if (isReordering) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={VERTICAL_REORDER_DRAG_MODIFIERS}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <Box data-testid={`${testIdPrefix}-reorder-collection`} style={listStyle}>
            {items.map((item) => (
              <SortableWorkspaceItem key={item.id} itemId={item.id} testIdPrefix={testIdPrefix}>
                {({ handleProps }) => (
                  <Box data-testid={`${testIdPrefix}-reorder-item-${item.id}`} style={listStyle}>
                    {renderItem(item, handleProps)}
                    <Divider sx={dividerSx} />
                  </Box>
                )}
              </SortableWorkspaceItem>
            ))}
          </Box>
        </SortableContext>
      </DndContext>
    );
  }

  return (
    <Box data-testid={`${testIdPrefix}-collection`} style={listStyle}>
      {items.map((item) => (
        <React.Fragment key={item.id}>
          {renderItem(item)}
          <Divider sx={dividerSx} />
        </React.Fragment>
      ))}
    </Box>
  );
}
