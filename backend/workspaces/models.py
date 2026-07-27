from django.conf import settings
from django.db import models
from django.db.models import Max, Q


class WorkspaceQuerySet(models.QuerySet):
    def accessible_to(self, user):
        return self.filter(
            Q(owner=user) | Q(created_by=user) | Q(collaborators=user)
        ).distinct()


# Workspace: A container for collections and items.
class Workspace(models.Model):
    # Attributes
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    # Ownership
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_workspaces",
    )
    collaborators = models.ManyToManyField(
        settings.AUTH_USER_MODEL, blank=True, related_name="collaborating_workspaces"
    )

    # Metadata
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_workspaces",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = WorkspaceQuerySet.as_manager()

    def save(self, *args, **kwargs):
        if self.owner_id is None and self.created_by_id is not None:
            self.owner = self.created_by
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Workspace"
        verbose_name_plural = "Workspaces"


# Collection: A singular Collection within the Workspace
class Collection(models.Model):
    # Attributes
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    # Scope
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="collections",
    )
    items = models.ManyToManyField(
        "Item",
        blank=True,
        related_name="collections",
        through="CollectionItem",
    )
    position = models.PositiveIntegerField(default=0)

    # Metadata
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_collections",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Collection"
        verbose_name_plural = "Collections"
        ordering = ["position", "created_at", "id"]


# Item: The actual Collection item
class Item(models.Model):
    STATUS_NOT_STARTED = "Not Started"
    STATUS_IN_PROGRESS = "In Progress"
    STATUS_COMPLETE = "Complete"
    STATUS_CHOICES = [
        (STATUS_NOT_STARTED, "Not Started"),
        (STATUS_IN_PROGRESS, "In Progress"),
        (STATUS_COMPLETE, "Complete"),
    ]

    # Attributes
    item = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_NOT_STARTED,
    )

    # Scope
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="items",
    )

    # Metadata
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_items",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.item

    class Meta:
        verbose_name = "Item"
        verbose_name_plural = "Items"


class CollectionItem(models.Model):
    collection = models.ForeignKey(
        Collection,
        on_delete=models.CASCADE,
        related_name="item_memberships",
    )
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name="collection_memberships",
    )
    position = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        if self._state.adding and self.position == 0:
            max_position = (
                CollectionItem.objects.filter(collection=self.collection)
                .exclude(item=self.item)
                .aggregate(Max("position"))["position__max"]
            )
            if max_position is not None:
                self.position = max_position + 1
        super().save(*args, **kwargs)

    class Meta:
        db_table = "workspaces_collection_items"
        verbose_name = "Collection Item"
        verbose_name_plural = "Collection Items"
        ordering = ["position", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["collection", "item"], name="unique_collection_item_membership"
            )
        ]
