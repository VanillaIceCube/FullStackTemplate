# Sharing and notifications
The example domain is intentionally generic:

```text
Workspace
├── Collection
│   └── Item
└── Collaborators
```

Use it as the first real feature or as a reference implementation to replace
with an application-specific domain.

## Ownership and access
`Workspace.owner` is the administrative owner.
`Workspace.collaborators` contains users with shared application access.
`created_by` records who created each workspace, collection, or item.

| Action | Owner | Collaborator | Unrelated user |
| --- | --- | --- | --- |
| View workspace content | Yes | Yes | No |
| Create collections/items | Yes | Yes | No |
| Rename/delete own collections/items | Yes | Yes | No |
| Rename/delete workspace | Yes | No | No |
| Add/remove collaborators | Yes | No | No |

The backend always filters querysets through workspace membership; hiding UI
controls is not the security boundary. Collections and items cannot be moved to
another workspace, and an item from one workspace cannot be attached to a
collection in another.

## API flow
1. Create a workspace with `POST /api/workspaces/`.
2. The owner shares it with
   `POST /api/workspaces/{id}/collaborators/` and body
   `{"email":"collaborator@example.com"}`.
3. Members create collections with `POST /api/collections/` and a `workspace`
   ID.
4. Members create items with `POST /api/items/` and a `collection` ID.
5. Reorder with `PATCH /api/collections/reorder/` or
   `PATCH /api/items/reorder/`.
6. Remove access with
   `DELETE /api/workspaces/{id}/collaborators/{user_id}/`.

The React example exposes the same flow through the workspace drawer, share
dialog, collection page, and item page.

## Notification behavior
Workspace activity creates persisted notifications for other affected members.
Events include collaborator changes, workspace/collection/item changes, item
completion, and deletion. The actor is excluded from their own notification.

Each notification stores enough denormalized names to remain understandable
when a related object is deleted, plus a `target_path` for navigation when the
target still exists.

The app header calls:

- `GET /api/notifications/`
- `PATCH /api/notifications/{id}/read/`
- `PATCH /api/notifications/read-all/`
- `DELETE /api/notifications/{id}/clear/`
- `DELETE /api/notifications/clear-all/`

Notification delivery is best-effort: a notification failure is logged but
does not roll back the user’s primary collection or item action.

## Adapt the example
When replacing the generic names:

1. Preserve one clear top-level authorization boundary equivalent to
   `Workspace`.
2. Keep authorization in backend queryset and serializer validation, not only
   the frontend.
3. Keep ownership changes separate from collaboration.
4. Add a stable target path and human-readable denormalized context for each
   new notification event.
5. Add tests for owners, collaborators, unrelated users, cross-workspace
   attachment, deleted targets, and notification failure isolation.
6. Generate migrations; do not edit an already deployed migration.

Core implementation locations:

- `backend/workspaces/models.py`, `serializers.py`, and `views.py`
- `backend/notifications/models.py` and `services.py`
- `frontend/src/services/workspaceApiClient.js`
- `frontend/src/components/WorkspaceShareDialog.jsx`
- `frontend/src/components/AppHeader.jsx`
