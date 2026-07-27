import logging

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Max, Q
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from notifications.models import Notification
from notifications.services import (
    collection_path,
    display_name,
    first_item_collection,
    notify_workspace_members,
    workspace_path,
)

from .models import Collection, CollectionItem, Item, Workspace
from .serializers import CollectionSerializer, ItemSerializer, WorkspaceSerializer

User = get_user_model()
logger = logging.getLogger(__name__)


def _require_workspace_access(user, workspace_id):
    try:
        workspace_id = int(workspace_id)
    except (TypeError, ValueError):
        raise NotFound("Workspace not found.")

    # Prefer 404 for non-existent workspaces and 403 for existing-but-inaccessible workspaces.
    if not Workspace.objects.filter(pk=workspace_id).exists():
        raise NotFound("Workspace not found.")

    accessible_workspaces = Workspace.objects.accessible_to(user)
    if not accessible_workspaces.filter(pk=workspace_id).exists():
        raise PermissionDenied("You do not have access to this workspace.")


def _require_workspace_filter_access(user, workspace_id, _base_queryset=None):
    """
    Allow `?workspace=` only when the workspace exists and the user is a
    workspace-level member.
    """
    try:
        workspace_id = int(workspace_id)
    except (TypeError, ValueError):
        raise NotFound("Workspace not found.")

    if not Workspace.objects.filter(pk=workspace_id).exists():
        raise NotFound("Workspace not found.")

    if Workspace.objects.accessible_to(user).filter(pk=workspace_id).exists():
        return

    raise PermissionDenied("You do not have access to this workspace.")


def _ordered_ids_from_request(request):
    ordered_ids = request.data.get("ordered_ids")
    if not isinstance(ordered_ids, list) or not ordered_ids:
        return None, Response(
            {"ordered_ids": ["Provide a non-empty list of ids."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        ordered_ids = [int(item_id) for item_id in ordered_ids]
    except (TypeError, ValueError):
        return None, Response(
            {"ordered_ids": ["All ids must be integers."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(ordered_ids) != len(set(ordered_ids)):
        return None, Response(
            {"ordered_ids": ["Duplicate ids are not allowed."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return ordered_ids, None


class WorkspaceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = WorkspaceSerializer

    def get_queryset(self):
        return Workspace.objects.accessible_to(self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user, created_by=self.request.user)

    def perform_update(self, serializer):
        self._require_owner(
            serializer.instance, "Only the workspace owner can update this workspace."
        )
        previous_name = serializer.instance.name
        workspace = serializer.save()
        if workspace.name != previous_name:
            notify_workspace_members(
                workspace,
                self.request.user,
                Notification.EVENT_WORKSPACE_UPDATED,
                f"Workspace renamed: {workspace.name}",
                f'{display_name(self.request.user)} renamed "{previous_name}" to "{workspace.name}".',
            )

    def perform_destroy(self, instance):
        self._require_owner(
            instance, "Only the workspace owner can delete this workspace."
        )
        notify_workspace_members(
            instance,
            self.request.user,
            Notification.EVENT_WORKSPACE_DELETED,
            f"Workspace deleted: {instance.name}",
            f'{display_name(self.request.user)} deleted the shared workspace "{instance.name}".',
        )
        instance.delete()

    def _require_owner(
        self, workspace, message="Only the workspace owner can manage access."
    ):
        if workspace.owner_id != self.request.user.id:
            raise PermissionDenied(message)

    def _find_collaborator(self, identifier):
        identifier = identifier.strip() if isinstance(identifier, str) else ""
        if not identifier:
            return None
        return User.objects.filter(
            Q(username__iexact=identifier) | Q(email__iexact=identifier)
        ).first()

    @action(detail=True, methods=["post"], url_path="collaborators")
    def add_collaborator(self, request, pk=None):
        workspace = self.get_object()
        self._require_owner(workspace)
        user = self._find_collaborator(request.data.get("identifier"))
        if user is None:
            return Response(
                {"error": "No user found for that username or email."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if user.id == workspace.owner_id:
            return Response(
                {"error": "The workspace owner already has access."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if workspace.collaborators.filter(pk=user.pk).exists():
            return Response(
                {"error": "That user is already a collaborator."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        workspace.collaborators.add(user)
        Notification.objects.create(
            recipient=user,
            actor=request.user,
            workspace=workspace,
            workspace_name=workspace.name,
            event_type=Notification.EVENT_COLLABORATOR_ADDED,
            title=f"You were added to {workspace.name}",
            message=f"{display_name(request.user)} added you as a collaborator.",
            target_path=workspace_path(workspace),
        )
        notify_workspace_members(
            workspace,
            request.user,
            Notification.EVENT_COLLABORATOR_ADDED,
            f"Collaborator added to {workspace.name}",
            f'{display_name(request.user)} added {display_name(user)} to "{workspace.name}".',
            exclude_user_ids={user.id},
            target_path=workspace_path(workspace),
        )
        serializer = self.get_serializer(workspace)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(
        detail=True, methods=["delete"], url_path="collaborators/(?P<user_id>[^/.]+)"
    )
    def remove_collaborator(self, request, pk=None, user_id=None):
        workspace = self.get_object()
        self._require_owner(workspace)
        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            return Response(
                {"error": "Invalid collaborator."}, status=status.HTTP_400_BAD_REQUEST
            )
        if user_id == workspace.owner_id:
            return Response(
                {"error": "The workspace owner cannot be removed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not workspace.collaborators.filter(pk=user_id).exists():
            return Response(
                {"error": "That user is not a collaborator."},
                status=status.HTTP_404_NOT_FOUND,
            )
        removed_user = User.objects.get(pk=user_id)
        workspace.collaborators.remove(user_id)
        Notification.objects.create(
            recipient=removed_user,
            actor=request.user,
            workspace=workspace,
            workspace_name=workspace.name,
            event_type=Notification.EVENT_COLLABORATOR_REMOVED,
            title=f"You were removed from {workspace.name}",
            message=f"{display_name(request.user)} removed you from this workspace.",
            target_path=workspace_path(workspace),
        )
        notify_workspace_members(
            workspace,
            request.user,
            Notification.EVENT_COLLABORATOR_REMOVED,
            f"Collaborator removed from {workspace.name}",
            f'{display_name(request.user)} removed {display_name(removed_user)} from "{workspace.name}".',
            target_path=workspace_path(workspace),
        )
        serializer = self.get_serializer(workspace)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CollectionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CollectionSerializer

    def get_queryset(self):
        user = self.request.user

        queryset = Collection.objects.filter(
            Q(created_by=user)
            | Q(workspace__owner=user)
            | Q(workspace__created_by=user)
            | Q(workspace__collaborators=user)
        )

        # Adding additional querying capabilities by ?workspace=ID
        workspace_id = self.request.query_params.get("workspace")
        if workspace_id:
            _require_workspace_filter_access(user, workspace_id, queryset)
            queryset = queryset.filter(workspace_id=workspace_id)

        return queryset.distinct().order_by("position", "created_at", "id")

    def perform_create(self, serializer):
        # Require workspace upon creation
        workspace_id = self.request.data.get("workspace")
        workspace = get_object_or_404(Workspace, pk=workspace_id)

        # Ensure user access to specified workspace
        if (
            not Workspace.objects.accessible_to(self.request.user)
            .filter(pk=workspace.pk)
            .exists()
        ):
            raise PermissionDenied("You cannot add collections to this workspace.")

        max_position = Collection.objects.filter(workspace=workspace).aggregate(
            Max("position")
        )["position__max"]
        next_position = (max_position if max_position is not None else -1) + 1

        serializer.save(
            created_by=self.request.user,
            workspace=workspace,
            position=next_position,
        )
        collection = serializer.instance
        try:
            notify_workspace_members(
                workspace,
                self.request.user,
                Notification.EVENT_COLLECTION_CREATED,
                f"New collection in {workspace.name}",
                f'{display_name(self.request.user)} created the collection "{collection.name}".',
                collection=collection,
                target_path=collection_path(collection),
            )
        except Exception:
            # A notification failure must not turn a successful collection write into a
            # misleading 500 response. The collection is already persisted, so log the
            # failure and let the API return the created resource.
            logger.exception(
                "Collection creation notification failed for collection_id=%s",
                collection.pk,
            )

    def perform_update(self, serializer):
        collection = serializer.save()
        notify_workspace_members(
            collection.workspace,
            self.request.user,
            Notification.EVENT_COLLECTION_UPDATED,
            f"Collection updated in {collection.workspace.name}",
            f'{display_name(self.request.user)} updated the collection "{collection.name}".',
            collection=collection,
            target_path=collection_path(collection),
        )

    def perform_destroy(self, instance):
        workspace = instance.workspace
        collection_name = instance.name
        notify_workspace_members(
            workspace,
            self.request.user,
            Notification.EVENT_COLLECTION_DELETED,
            f"Collection deleted in {workspace.name}",
            f'{display_name(self.request.user)} deleted the collection "{collection_name}".',
            target_path=workspace_path(workspace),
        )
        instance.delete()

    @action(detail=False, methods=["patch"], url_path="reorder")
    def reorder(self, request):
        workspace_id = request.data.get("workspace")
        if workspace_id is None:
            return Response(
                {"workspace": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ordered_ids, error_response = _ordered_ids_from_request(request)
        if error_response is not None:
            return error_response

        accessible_queryset = self.get_queryset()
        _require_workspace_filter_access(
            request.user,
            workspace_id,
            accessible_queryset,
        )
        scoped_queryset = accessible_queryset.filter(workspace_id=workspace_id)
        current_ids = list(scoped_queryset.values_list("id", flat=True))

        if set(ordered_ids) != set(current_ids):
            return Response(
                {
                    "ordered_ids": [
                        "Ordered ids must include every accessible collection in the workspace."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            for position, collection_id in enumerate(ordered_ids):
                Collection.objects.filter(
                    pk=collection_id, workspace_id=workspace_id
                ).update(position=position)

        serializer = self.get_serializer(
            scoped_queryset.order_by("position", "created_at", "id"), many=True
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class ItemViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ItemSerializer

    def get_queryset(self):
        user = self.request.user

        queryset = Item.objects.filter(
            Q(created_by=user)
            | Q(workspace__owner=user)
            | Q(workspace__created_by=user)
            | Q(workspace__collaborators=user)
        )

        # Adding additional querying capabilities by ?workspace=ID
        workspace_id = self.request.query_params.get("workspace")
        if workspace_id:
            _require_workspace_filter_access(user, workspace_id, queryset)
            queryset = queryset.filter(workspace_id=workspace_id)

        # Adding additional querying capabilities by ?collection=ID
        collection_id = self.request.query_params.get("collection")
        if collection_id:
            queryset = queryset.filter(
                collection_memberships__collection_id=collection_id
            )
            return queryset.distinct().order_by(
                "collection_memberships__position",
                "collection_memberships__id",
                "id",
            )

        return queryset.distinct()

    def perform_create(self, serializer):
        collection = serializer.validated_data.get("collection")
        workspace = serializer.validated_data.get("workspace")

        # Ensure user access to specified collection (when provided).
        if collection is not None:
            if not Collection.objects.filter(
                Q(pk=collection.pk)
                & (
                    Q(created_by=self.request.user)
                    | Q(workspace__owner=self.request.user)
                    | Q(workspace__created_by=self.request.user)
                    | Q(workspace__collaborators=self.request.user)
                )
            ).exists():
                raise PermissionDenied("You cannot add items to this collection.")

        # Ensure user access to specified workspace (when creating a workspace-scoped item).
        if collection is None and workspace is not None:
            if (
                not Workspace.objects.accessible_to(self.request.user)
                .filter(pk=workspace.pk)
                .exists()
            ):
                raise PermissionDenied("You cannot add items to this workspace.")

        serializer.save(created_by=self.request.user)
        item = serializer.instance
        notify_workspace_members(
            item.workspace,
            self.request.user,
            Notification.EVENT_ITEM_CREATED,
            f"New item in {item.workspace.name}",
            f'{display_name(self.request.user)} created "{item.item}".',
            collection=collection,
            item=item,
            target_path=collection_path(collection)
            if collection is not None
            else workspace_path(item.workspace),
        )

    def perform_update(self, serializer):
        previous_status = serializer.instance.status
        item = serializer.save()
        collection = serializer.validated_data.get(
            "collection"
        ) or first_item_collection(item)
        target_path = (
            collection_path(collection)
            if collection is not None
            else workspace_path(item.workspace)
        )
        if (
            previous_status != Item.STATUS_COMPLETE
            and item.status == Item.STATUS_COMPLETE
        ):
            notify_workspace_members(
                item.workspace,
                self.request.user,
                Notification.EVENT_ITEM_COMPLETED,
                f"Item completed in {item.workspace.name}",
                f'{display_name(self.request.user)} completed "{item.item}".',
                collection=collection,
                item=item,
                target_path=target_path,
            )
            return

        notify_workspace_members(
            item.workspace,
            self.request.user,
            Notification.EVENT_ITEM_UPDATED,
            f"Item updated in {item.workspace.name}",
            f'{display_name(self.request.user)} updated "{item.item}".',
            collection=collection,
            item=item,
            target_path=target_path,
        )

    def perform_destroy(self, instance):
        workspace = instance.workspace
        item_text = instance.item
        notify_workspace_members(
            workspace,
            self.request.user,
            Notification.EVENT_ITEM_DELETED,
            f"Item deleted in {workspace.name}",
            f'{display_name(self.request.user)} deleted "{item_text}".',
            target_path=workspace_path(workspace),
        )
        instance.delete()

    @action(detail=False, methods=["patch"], url_path="reorder")
    def reorder(self, request):
        collection_id = request.data.get("collection")
        if collection_id is None:
            return Response(
                {"collection": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ordered_ids, error_response = _ordered_ids_from_request(request)
        if error_response is not None:
            return error_response

        collection = get_object_or_404(Collection, pk=collection_id)
        has_collection_access = (
            Collection.objects.filter(pk=collection.pk)
            .filter(
                Q(created_by=request.user)
                | Q(workspace__owner=request.user)
                | Q(workspace__created_by=request.user)
                | Q(workspace__collaborators=request.user)
            )
            .exists()
        )
        if not has_collection_access:
            raise PermissionDenied("You do not have access to this collection.")

        accessible_items = self.get_queryset()
        memberships = CollectionItem.objects.filter(
            collection=collection,
            item__in=accessible_items,
        )
        current_ids = list(
            memberships.order_by("position", "id").values_list("item_id", flat=True)
        )

        if set(ordered_ids) != set(current_ids):
            return Response(
                {
                    "ordered_ids": [
                        "Ordered ids must include every accessible item in the collection."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            for position, item_id in enumerate(ordered_ids):
                CollectionItem.objects.filter(
                    collection=collection, item_id=item_id
                ).update(position=position)

        ordered_items = list(Item.objects.filter(id__in=ordered_ids))
        ordered_items.sort(key=lambda item: ordered_ids.index(item.id))
        serializer = self.get_serializer(ordered_items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
