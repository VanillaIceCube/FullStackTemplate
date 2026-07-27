from django.conf import settings
from django.db import models

from workspaces.models import Collection, Item, Workspace


class Notification(models.Model):
    EVENT_COLLABORATOR_ADDED = "collaborator_added"
    EVENT_COLLABORATOR_REMOVED = "collaborator_removed"
    EVENT_COLLECTION_CREATED = "collection_created"
    EVENT_COLLECTION_UPDATED = "collection_updated"
    EVENT_COLLECTION_DELETED = "collection_deleted"
    EVENT_ITEM_CREATED = "item_created"
    EVENT_ITEM_UPDATED = "item_updated"
    EVENT_ITEM_COMPLETED = "item_completed"
    EVENT_ITEM_DELETED = "item_deleted"
    EVENT_WORKSPACE_UPDATED = "workspace_updated"
    EVENT_WORKSPACE_DELETED = "workspace_deleted"
    EVENT_CHOICES = [
        (EVENT_COLLABORATOR_ADDED, "Collaborator added"),
        (EVENT_COLLABORATOR_REMOVED, "Collaborator removed"),
        (EVENT_COLLECTION_CREATED, "Collection created"),
        (EVENT_COLLECTION_UPDATED, "Collection updated"),
        (EVENT_COLLECTION_DELETED, "Collection deleted"),
        (EVENT_ITEM_CREATED, "Item created"),
        (EVENT_ITEM_UPDATED, "Item updated"),
        (EVENT_ITEM_COMPLETED, "Item completed"),
        (EVENT_ITEM_DELETED, "Item deleted"),
        (EVENT_WORKSPACE_UPDATED, "Workspace updated"),
        (EVENT_WORKSPACE_DELETED, "Workspace deleted"),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_notifications",
    )
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )
    workspace_name = models.CharField(max_length=255, blank=True)
    collection = models.ForeignKey(
        Collection,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )
    item = models.ForeignKey(
        Item,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )
    event_type = models.CharField(max_length=40, choices=EVENT_CHOICES)
    title = models.CharField(max_length=160)
    message = models.TextField()
    target_path = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.workspace_name and self.workspace_id is not None:
            self.workspace_name = self.workspace.name
        super().save(*args, **kwargs)

    class Meta:
        ordering = ["-created_at", "-id"]
        indexes = [
            models.Index(fields=["recipient", "is_read", "-created_at"]),
        ]
