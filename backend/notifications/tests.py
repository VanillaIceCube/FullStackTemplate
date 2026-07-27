from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from workspaces.models import Collection, Item, Workspace

from .models import Notification

User = get_user_model()


class NotificationApiTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="owner",
            email="owner_email@example.com",
            password="owner-password",
        )
        self.collaborator = User.objects.create_user(
            username="collaborator",
            email="collaborator_email@example.com",
            password="collaborator-password",
        )
        self.other_collaborator = User.objects.create_user(
            username="other_collaborator",
            email="other_collaborator@example.com",
            password="other-password",
        )
        self.outsider = User.objects.create_user(
            username="outsider",
            email="outsider_email@example.com",
            password="outsider-password",
        )
        self.workspace = Workspace.objects.create(
            name="Shared Workspace",
            description="Shared Workspace Description",
            created_by=self.owner,
        )
        self.workspace.collaborators.add(self.collaborator, self.other_collaborator)
        self.collection = Collection.objects.create(
            name="Shared Collection",
            description="Shared Collection Description",
            workspace=self.workspace,
            created_by=self.owner,
        )
        self.item = Item.objects.create(
            item="Shared Item",
            description="Shared Item Description",
            workspace=self.workspace,
            created_by=self.owner,
        )
        self.collection.items.add(self.item)

    def test_notifications_are_limited_to_recipient(self):
        owner_notification = Notification.objects.create(
            recipient=self.owner,
            actor=self.collaborator,
            workspace=self.workspace,
            event_type=Notification.EVENT_ITEM_UPDATED,
            title="Owner notification",
            message="Visible to owner.",
        )
        Notification.objects.create(
            recipient=self.outsider,
            actor=self.owner,
            workspace=self.workspace,
            event_type=Notification.EVENT_ITEM_UPDATED,
            title="Outsider notification",
            message="Hidden from owner.",
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.get("/api/notifications/")

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(
            [item["id"] for item in response.data], [owner_notification.id]
        )

    def test_user_can_mark_own_notification_read(self):
        notification = Notification.objects.create(
            recipient=self.owner,
            actor=self.collaborator,
            workspace=self.workspace,
            event_type=Notification.EVENT_ITEM_UPDATED,
            title="Owner notification",
            message="Visible to owner.",
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(
            f"/api/notifications/{notification.id}/",
            {"is_read": True},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)
        self.assertIsNotNone(notification.read_at)

    def test_user_cannot_mark_another_users_notification_read(self):
        notification = Notification.objects.create(
            recipient=self.outsider,
            actor=self.owner,
            workspace=self.workspace,
            event_type=Notification.EVENT_ITEM_UPDATED,
            title="Outsider notification",
            message="Hidden from owner.",
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(
            f"/api/notifications/{notification.id}/",
            {"is_read": True},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, response.data)
        notification.refresh_from_db()
        self.assertFalse(notification.is_read)

    def test_user_can_clear_own_notification(self):
        notification = Notification.objects.create(
            recipient=self.owner,
            actor=self.collaborator,
            workspace=self.workspace,
            event_type=Notification.EVENT_ITEM_UPDATED,
            title="Owner notification",
            message="Visible to owner.",
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(f"/api/notifications/{notification.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Notification.objects.filter(pk=notification.id).exists())

    def test_user_cannot_clear_another_users_notification(self):
        notification = Notification.objects.create(
            recipient=self.outsider,
            actor=self.owner,
            workspace=self.workspace,
            event_type=Notification.EVENT_ITEM_UPDATED,
            title="Outsider notification",
            message="Hidden from owner.",
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(f"/api/notifications/{notification.id}/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, response.data)
        self.assertTrue(Notification.objects.filter(pk=notification.id).exists())

    def test_mark_all_read_only_updates_request_users_notifications(self):
        owner_notification = Notification.objects.create(
            recipient=self.owner,
            actor=self.collaborator,
            workspace=self.workspace,
            event_type=Notification.EVENT_ITEM_UPDATED,
            title="Owner notification",
            message="Visible to owner.",
        )
        outsider_notification = Notification.objects.create(
            recipient=self.outsider,
            actor=self.owner,
            workspace=self.workspace,
            event_type=Notification.EVENT_ITEM_UPDATED,
            title="Outsider notification",
            message="Hidden from owner.",
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.patch("/api/notifications/mark-all-read/")

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data, {"updated": 1})
        owner_notification.refresh_from_db()
        outsider_notification.refresh_from_db()
        self.assertTrue(owner_notification.is_read)
        self.assertFalse(outsider_notification.is_read)

    def test_clear_all_only_deletes_request_users_notifications(self):
        owner_notification = Notification.objects.create(
            recipient=self.owner,
            actor=self.collaborator,
            workspace=self.workspace,
            event_type=Notification.EVENT_ITEM_UPDATED,
            title="Owner notification",
            message="Visible to owner.",
        )
        outsider_notification = Notification.objects.create(
            recipient=self.outsider,
            actor=self.owner,
            workspace=self.workspace,
            event_type=Notification.EVENT_ITEM_UPDATED,
            title="Outsider notification",
            message="Hidden from owner.",
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.delete("/api/notifications/clear-all/")

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data, {"deleted": 1})
        self.assertFalse(Notification.objects.filter(pk=owner_notification.id).exists())
        self.assertTrue(
            Notification.objects.filter(pk=outsider_notification.id).exists()
        )

    def test_adding_collaborator_creates_notification_for_added_user(self):
        new_collaborator = User.objects.create_user(
            username="new_collaborator",
            email="new_collaborator@example.com",
            password="new-password",
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.post(
            f"/api/workspaces/{self.workspace.id}/collaborators/",
            {"identifier": new_collaborator.email},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        notification = Notification.objects.get(recipient=new_collaborator)
        self.assertEqual(notification.actor, self.owner)
        self.assertEqual(notification.event_type, Notification.EVENT_COLLABORATOR_ADDED)
        self.assertEqual(notification.workspace, self.workspace)
        self.assertEqual(notification.workspace_name, self.workspace.name)
        self.assertEqual(notification.target_path, f"/workspace/{self.workspace.id}")
        self.assertIn("added you as a collaborator", notification.message)

    def test_duplicate_collaborator_add_does_not_create_notification(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(
            f"/api/workspaces/{self.workspace.id}/collaborators/",
            {"identifier": self.collaborator.email},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(
            Notification.objects.filter(
                recipient=self.collaborator,
                event_type=Notification.EVENT_COLLABORATOR_ADDED,
            ).exists()
        )

    def test_adding_collaborator_notifies_existing_workspace_members(self):
        new_collaborator = User.objects.create_user(
            username="new_collaborator",
            email="new_collaborator@example.com",
            password="new-password",
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.post(
            f"/api/workspaces/{self.workspace.id}/collaborators/",
            {"identifier": new_collaborator.email},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        notifications = Notification.objects.filter(
            event_type=Notification.EVENT_COLLABORATOR_ADDED
        )
        self.assertTrue(notifications.filter(recipient=new_collaborator).exists())
        self.assertEqual(
            set(
                notifications.exclude(recipient=new_collaborator).values_list(
                    "recipient_id", flat=True
                )
            ),
            {self.collaborator.id, self.other_collaborator.id},
        )
        self.assertIn(
            "new_collaborator",
            notifications.get(recipient=self.collaborator).message,
        )
        self.assertEqual(
            set(notifications.values_list("target_path", flat=True)),
            {f"/workspace/{self.workspace.id}"},
        )

    def test_removing_collaborator_notifies_removed_user_and_remaining_members(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(
            f"/api/workspaces/{self.workspace.id}/collaborators/{self.collaborator.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        notifications = Notification.objects.filter(
            event_type=Notification.EVENT_COLLABORATOR_REMOVED
        )
        self.assertTrue(notifications.filter(recipient=self.collaborator).exists())
        self.assertEqual(
            set(
                notifications.exclude(recipient=self.collaborator).values_list(
                    "recipient_id", flat=True
                )
            ),
            {self.other_collaborator.id},
        )
        removed_notification = notifications.get(recipient=self.collaborator)
        self.assertEqual(removed_notification.workspace, self.workspace)
        self.assertEqual(removed_notification.workspace_name, "Shared Workspace")
        self.assertIn("removed you", removed_notification.message)
        self.assertEqual(
            removed_notification.target_path, f"/workspace/{self.workspace.id}"
        )

    def test_collaborator_collection_create_notifies_other_workspace_members(self):
        self.client.force_authenticate(user=self.collaborator)
        response = self.client.post(
            "/api/collections/",
            {
                "name": "Collaborator Collection",
                "description": "Collaborator Description",
                "workspace": self.workspace.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        notifications = Notification.objects.filter(
            event_type=Notification.EVENT_COLLECTION_CREATED
        )
        recipient_ids = set(notifications.values_list("recipient_id", flat=True))
        self.assertEqual(recipient_ids, {self.owner.id, self.other_collaborator.id})
        self.assertFalse(notifications.filter(recipient=self.collaborator).exists())
        notification = notifications.first()
        self.assertEqual(notification.collection.name, "Collaborator Collection")
        self.assertEqual(
            notification.target_path,
            f"/workspace/{self.workspace.id}/collection/{notification.collection_id}",
        )

    @patch(
        "workspaces.views.notify_workspace_members",
        side_effect=Exception("notifications table is unavailable"),
    )
    def test_collection_create_succeeds_when_notification_fails(self, mock_notify):
        self.client.force_authenticate(user=self.collaborator)
        with self.assertLogs("workspaces.views", level="ERROR") as logs:
            response = self.client.post(
                "/api/collections/",
                {
                    "name": "Collection Without Notification",
                    "description": "The collection must still be created.",
                    "workspace": self.workspace.id,
                },
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        created_collection = Collection.objects.get(
            name="Collection Without Notification"
        )
        self.assertEqual(response.data["id"], created_collection.id)
        mock_notify.assert_called_once()
        self.assertIn("Collection creation notification failed", logs.output[0])

    def test_owner_workspace_rename_notifies_collaborators(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(
            f"/api/workspaces/{self.workspace.id}/",
            {"name": "Renamed Shared Workspace"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        notifications = Notification.objects.filter(
            event_type=Notification.EVENT_WORKSPACE_UPDATED
        )
        self.assertEqual(
            set(notifications.values_list("recipient_id", flat=True)),
            {self.collaborator.id, self.other_collaborator.id},
        )
        notification = notifications.first()
        self.assertEqual(notification.workspace, self.workspace)
        self.assertEqual(notification.workspace_name, "Renamed Shared Workspace")
        self.assertIn("Shared Workspace", notification.message)
        self.assertIn("Renamed Shared Workspace", notification.message)

    def test_owner_workspace_description_update_does_not_notify(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(
            f"/api/workspaces/{self.workspace.id}/",
            {"description": "Updated description"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertFalse(
            Notification.objects.filter(
                event_type=Notification.EVENT_WORKSPACE_UPDATED
            ).exists()
        )

    def test_collaborator_collection_update_notifies_other_workspace_members(self):
        self.client.force_authenticate(user=self.collaborator)
        response = self.client.patch(
            f"/api/collections/{self.collection.id}/",
            {"name": "Renamed Shared Collection"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        notifications = Notification.objects.filter(
            event_type=Notification.EVENT_COLLECTION_UPDATED
        )
        self.assertEqual(
            set(notifications.values_list("recipient_id", flat=True)),
            {self.owner.id, self.other_collaborator.id},
        )
        self.assertFalse(notifications.filter(recipient=self.collaborator).exists())
        self.assertIn("Renamed Shared Collection", notifications.first().message)
        self.assertEqual(notifications.first().collection, self.collection)
        self.assertEqual(
            notifications.first().target_path,
            f"/workspace/{self.workspace.id}/collection/{self.collection.id}",
        )

    def test_collaborator_collection_delete_notifies_other_workspace_members(self):
        self.client.force_authenticate(user=self.collaborator)
        response = self.client.delete(f"/api/collections/{self.collection.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        notifications = Notification.objects.filter(
            event_type=Notification.EVENT_COLLECTION_DELETED
        )
        self.assertEqual(
            set(notifications.values_list("recipient_id", flat=True)),
            {self.owner.id, self.other_collaborator.id},
        )
        self.assertFalse(notifications.filter(recipient=self.collaborator).exists())
        self.assertIn("Shared Collection", notifications.first().message)

    def test_collaborator_item_create_update_and_delete_notify_other_workspace_members(
        self,
    ):
        self.client.force_authenticate(user=self.collaborator)
        create_response = self.client.post(
            "/api/items/",
            {
                "item": "Collaborator Item",
                "description": "Collaborator Description",
                "collection": self.collection.id,
            },
            format="json",
        )
        self.assertEqual(
            create_response.status_code, status.HTTP_201_CREATED, create_response.data
        )
        item_id = create_response.data["id"]

        update_response = self.client.patch(
            f"/api/items/{item_id}/",
            {"description": "Updated by collaborator"},
            format="json",
        )

        self.assertEqual(
            update_response.status_code, status.HTTP_200_OK, update_response.data
        )
        for event_type in (
            Notification.EVENT_ITEM_CREATED,
            Notification.EVENT_ITEM_UPDATED,
        ):
            notifications = Notification.objects.filter(event_type=event_type)
            self.assertEqual(
                set(notifications.values_list("recipient_id", flat=True)),
                {self.owner.id, self.other_collaborator.id},
            )
            notification = notifications.first()
            self.assertEqual(notification.item_id, item_id)
            self.assertEqual(notification.collection, self.collection)
            self.assertEqual(
                notification.target_path,
                f"/workspace/{self.workspace.id}/collection/{self.collection.id}",
            )

        delete_response = self.client.delete(f"/api/items/{item_id}/")

        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        deleted_notifications = Notification.objects.filter(
            event_type=Notification.EVENT_ITEM_DELETED
        )
        self.assertEqual(
            set(deleted_notifications.values_list("recipient_id", flat=True)),
            {self.owner.id, self.other_collaborator.id},
        )
        self.assertFalse(
            deleted_notifications.filter(recipient=self.collaborator).exists()
        )
        self.assertIn("Collaborator Item", deleted_notifications.first().message)

    def test_item_completion_notifies_once_with_list_and_item_context(self):
        self.client.force_authenticate(user=self.collaborator)
        response = self.client.patch(
            f"/api/items/{self.item.id}/",
            {"status": Item.STATUS_COMPLETE},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        completed_notifications = Notification.objects.filter(
            event_type=Notification.EVENT_ITEM_COMPLETED
        )
        self.assertEqual(
            set(completed_notifications.values_list("recipient_id", flat=True)),
            {self.owner.id, self.other_collaborator.id},
        )
        self.assertFalse(
            Notification.objects.filter(
                event_type=Notification.EVENT_ITEM_UPDATED
            ).exists()
        )
        notification = completed_notifications.first()
        self.assertEqual(notification.workspace, self.workspace)
        self.assertEqual(notification.collection, self.collection)
        self.assertEqual(notification.item, self.item)
        self.assertEqual(
            notification.target_path,
            f"/workspace/{self.workspace.id}/collection/{self.collection.id}",
        )
        self.assertIn("completed", notification.message)
        self.assertIn("Shared Item", notification.message)
        self.assertNotIn("Shared Collection", notification.message)

        repeat_response = self.client.patch(
            f"/api/items/{self.item.id}/",
            {"description": "Saved again after completion"},
            format="json",
        )

        self.assertEqual(repeat_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            Notification.objects.filter(
                event_type=Notification.EVENT_ITEM_COMPLETED
            ).count(),
            2,
        )
        self.assertTrue(
            Notification.objects.filter(
                event_type=Notification.EVENT_ITEM_UPDATED
            ).exists()
        )

    def test_notification_api_returns_navigation_context(self):
        notification = Notification.objects.create(
            recipient=self.owner,
            actor=self.collaborator,
            workspace=self.workspace,
            collection=self.collection,
            item=self.item,
            event_type=Notification.EVENT_ITEM_COMPLETED,
            title="Item completed",
            message="Shared Item was completed.",
            target_path=f"/workspace/{self.workspace.id}/collection/{self.collection.id}",
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.get("/api/notifications/")

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data[0]["id"], notification.id)
        self.assertEqual(response.data[0]["workspace_name"], "Shared Workspace")
        self.assertEqual(response.data[0]["collection_name"], "Shared Collection")
        self.assertEqual(response.data[0]["item_text"], "Shared Item")
        self.assertEqual(
            response.data[0]["target_path"],
            f"/workspace/{self.workspace.id}/collection/{self.collection.id}",
        )

    def test_owner_workspace_delete_notifies_collaborators_and_preserves_workspace_name(
        self,
    ):
        workspace_id = self.workspace.id
        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(f"/api/workspaces/{workspace_id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        notifications = Notification.objects.filter(
            event_type=Notification.EVENT_WORKSPACE_DELETED
        )
        self.assertEqual(
            set(notifications.values_list("recipient_id", flat=True)),
            {self.collaborator.id, self.other_collaborator.id},
        )
        notification = notifications.first()
        self.assertIsNone(notification.workspace)
        self.assertEqual(notification.workspace_name, "Shared Workspace")
        self.assertIn("Shared Workspace", notification.message)
