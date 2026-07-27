from django.contrib.auth import get_user_model
from django.db.models import Max
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from .models import Collection, CollectionItem, Item, Workspace

User = get_user_model()


class UserSummarySerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "email", "display_name")

    def get_display_name(self, obj):
        return obj.get_full_name() or obj.get_username() or obj.email


class WorkspaceSerializer(serializers.ModelSerializer):
    owner_details = UserSummarySerializer(source="owner", read_only=True)
    collaborators_details = UserSummarySerializer(
        source="collaborators", many=True, read_only=True
    )

    class Meta:
        model = Workspace
        fields = "__all__"
        # perform_create in models.py automatically sets owner & created_by upon creation
        # this is placed here to allow you to not have to pass in owner & created_by
        # but still requires them on the database level
        extra_kwargs = {"owner": {"required": False}, "created_by": {"required": False}}


class CollectionSerializer(serializers.ModelSerializer):
    items = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Item.objects.all(),
        required=False,
    )

    class Meta:
        model = Collection
        fields = "__all__"
        # perform_create in models.py automatically sets owner & created_by upon creation
        # this is placed here to allow you to not have to pass in owner & created_by
        # but still requires them on the database level
        extra_kwargs = {
            "created_by": {"required": False},
        }

    def validate(self, attrs):
        # Hard boundary: Collections cannot move between workspaces once created.
        if self.instance is not None and "workspace" in attrs:
            if attrs["workspace"].id != self.instance.workspace_id:
                raise serializers.ValidationError(
                    {"workspace": ["Cannot change workspace of a collection."]}
                )

        workspace = attrs.get("workspace") or getattr(self.instance, "workspace", None)
        items = attrs.get("items")
        if workspace is not None and items is not None:
            bad_item_ids = [n.id for n in items if n.workspace_id != workspace.id]
            if bad_item_ids:
                raise serializers.ValidationError(
                    {
                        "items": [
                            "All items must belong to the same workspace as the collection."
                        ]
                    }
                )

        return attrs

    def create(self, validated_data):
        items = validated_data.pop("items", None)
        collection = super().create(validated_data)
        if items is not None:
            self._set_items(collection, items)
        return collection

    def update(self, instance, validated_data):
        items = validated_data.pop("items", None)
        collection = super().update(instance, validated_data)
        if items is not None:
            self._set_items(collection, items)
        return collection

    def _set_items(self, collection, items):
        CollectionItem.objects.filter(collection=collection).delete()
        CollectionItem.objects.bulk_create(
            [
                CollectionItem(collection=collection, item=item, position=position)
                for position, item in enumerate(items)
            ]
        )


class ItemSerializer(serializers.ModelSerializer):
    collection = serializers.PrimaryKeyRelatedField(
        queryset=Collection.objects.all(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Item
        fields = "__all__"
        # perform_create in models.py automatically sets owner & created_by upon creation
        # this is placed here to allow you to not have to pass in owner & created_by
        # but still requires them on the database level
        extra_kwargs = {
            "created_by": {"required": False},
            "workspace": {"required": False},
        }

    def validate(self, attrs):
        collection = attrs.get("collection")
        workspace = attrs.get("workspace")

        instance_workspace = getattr(self.instance, "workspace", None)

        # Enforce that attaching to a collection via PATCH requires access to that collection.
        # Otherwise a user who can edit a item could inject it into a collection they can't access.
        if collection is not None:
            request = self.context.get("request")
            user = getattr(request, "user", None)
            if user is not None and getattr(user, "is_authenticated", False):
                has_collection_access = (
                    collection.created_by_id == user.id
                    or collection.workspace.owner_id == user.id
                    or collection.workspace.created_by_id == user.id
                    or collection.workspace.collaborators.filter(id=user.id).exists()
                )
                if not has_collection_access:
                    raise PermissionDenied("You cannot add items to this collection.")

        # Hard boundary: Items cannot move between workspaces once created.
        # Validate this first so clients get a clear immutability error even if they also send `collection`.
        if self.instance is not None and "workspace" in attrs:
            if attrs["workspace"].id != self.instance.workspace_id:
                raise serializers.ValidationError(
                    {"workspace": ["Cannot change workspace of an existing item."]}
                )

        # For updates, the item's workspace is immutable, so always validate against the instance workspace.
        effective_workspace = (
            instance_workspace if self.instance is not None else workspace
        )

        # Creation requires scope. Updates can omit scope as long as the instance already has it.
        if collection is None and workspace is None:
            if self.instance is None or instance_workspace is None:
                raise serializers.ValidationError(
                    {
                        "collection": [
                            "This field is required when workspace is not provided."
                        ],
                    }
                )

        if collection is not None and effective_workspace is not None:
            if collection.workspace_id != effective_workspace.id:
                raise serializers.ValidationError(
                    {
                        "collection": [
                            "Collection must be in the same workspace as the item."
                        ]
                    }
                )

        return attrs

    def create(self, validated_data):
        collection = validated_data.pop("collection", None)

        if validated_data.get("workspace") is None and collection is not None:
            validated_data["workspace"] = collection.workspace

        item = super().create(validated_data)

        if collection is not None:
            self._attach_item_to_collection(collection, item)

        return item

    def update(self, instance, validated_data):
        # `collection` is an API convenience for attaching a item to a collection.
        # It is not a model field, so we must handle it explicitly on update.
        collection = validated_data.pop("collection", None)

        item = super().update(instance, validated_data)

        if collection is not None:
            self._attach_item_to_collection(collection, item)

        return item

    def _attach_item_to_collection(self, collection, item):
        max_position = CollectionItem.objects.filter(collection=collection).aggregate(
            Max("position")
        )["position__max"]
        next_position = (max_position if max_position is not None else -1) + 1
        CollectionItem.objects.get_or_create(
            collection=collection,
            item=item,
            defaults={"position": next_position},
        )
