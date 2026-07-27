from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Collection, CollectionItem, Item, Workspace

User = get_user_model()


class ModelTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="owner",
            email="owner_email@example.com",
            password="owner-password",
        )
        self.workspace = Workspace.objects.create(
            name="Owner Workspace",
            description="Owner Workspace Description",
            created_by=self.owner,
        )
        self.collection = Collection.objects.create(
            name="Owner Collection",
            description="Owner Collection Description",
            workspace=self.workspace,
            created_by=self.owner,
        )
        self.item = Item.objects.create(
            item="Owner Item",
            description="Owner Item Description",
            workspace=self.workspace,
            created_by=self.owner,
        )
        self.collection.items.add(self.item)

    def test_model_strs(self):
        self.assertEqual(
            str(self.workspace),
            "Owner Workspace",
            "Workspace __str__ did not return the name.",
        )
        self.assertEqual(
            str(self.collection),
            "Owner Collection",
            "Collection __str__ did not return the name.",
        )
        self.assertEqual(
            str(self.item), "Owner Item", "Item __str__ did not return the item text."
        )


class WorkspaceApiTests(APITestCase):
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
        self.outsider = User.objects.create_user(
            username="outsider",
            email="outsider_email@example.com",
            password="outsider-password",
        )
        self.workspace = Workspace.objects.create(
            name="Owner Workspace",
            description="Owner Workspace Description",
            created_by=self.owner,
        )

    def test_create_workspace_sets_owner_and_creator(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(
            "/api/workspaces/",
            {"name": "New Workspace", "description": "New Description"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            f"Expected 201 on workspace create, got {response.status_code}: {response.data}",
        )
        workspace_id = response.data.get("id")
        workspace = Workspace.objects.get(id=workspace_id)
        self.assertEqual(
            workspace.owner,
            self.owner,
            f"Workspace owner was not set to request user: {workspace.owner_id}",
        )
        self.assertEqual(
            workspace.created_by,
            self.owner,
            f"Workspace creator was not set to request user: {workspace.created_by_id}",
        )

    def test_create_workspace_as_collaborator(self):
        self.client.force_authenticate(user=self.collaborator)
        response = self.client.post(
            "/api/workspaces/",
            {
                "name": "Collaborator Workspace",
                "description": "Collaborator Description",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            f"Expected 201 on workspace create, got {response.status_code}: {response.data}",
        )
        workspace = Workspace.objects.get(id=response.data.get("id"))
        self.assertEqual(
            workspace.owner,
            self.collaborator,
            f"Workspace owner was not set to collaborator: {workspace.owner_id}",
        )
        self.assertEqual(
            workspace.created_by,
            self.collaborator,
            f"Workspace creator was not set to collaborator: {workspace.created_by_id}",
        )

    def test_create_workspace_missing_name(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(
            "/api/workspaces/",
            {"description": "No Name Supplied"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            f"Expected 400 when name is missing, got {response.status_code}: {response.data}",
        )
        self.assertEqual(
            response.data.get("name"),
            ["This field is required."],
            f"Unexpected error body when name is missing: {response.data}",
        )

    def test_list_workspaces_limited_to_access(self):
        Workspace.objects.create(
            name="Outsider Workspace",
            description="Outsider Workspace Description",
            created_by=self.outsider,
        )
        self.workspace.collaborators.add(self.collaborator)

        self.client.force_authenticate(user=self.collaborator)
        response = self.client.get("/api/workspaces/")

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            f"Expected 200 on workspace collection, got {response.status_code}: {response.data}",
        )
        workspace_ids = {item["id"] for item in response.data}
        outsider_workspace_ids = set(
            Workspace.objects.filter(owner=self.outsider).values_list("id", flat=True)
        )
        self.assertIn(
            self.workspace.id,
            workspace_ids,
            f"Collaborator workspace missing from collection: {response.data}",
        )
        self.assertTrue(
            workspace_ids.isdisjoint(outsider_workspace_ids),
            f"Unexpected outsider workspace included in collection: {response.data}",
        )

    def test_owner_can_add_workspace_collaborator_by_email(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(
            f"/api/workspaces/{self.workspace.id}/collaborators/",
            {"identifier": self.collaborator.email},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(
            self.workspace.collaborators.filter(pk=self.collaborator.pk).exists()
        )
        collaborator_ids = {
            item["id"] for item in response.data["collaborators_details"]
        }
        self.assertIn(self.collaborator.id, collaborator_ids)

    def test_non_owner_cannot_add_workspace_collaborator(self):
        self.workspace.collaborators.add(self.collaborator)
        self.client.force_authenticate(user=self.collaborator)
        response = self.client.post(
            f"/api/workspaces/{self.workspace.id}/collaborators/",
            {"identifier": self.outsider.email},
            format="json",
        )
        self.assertEqual(response.status_code, 403, response.data)
        self.assertFalse(
            self.workspace.collaborators.filter(pk=self.outsider.pk).exists()
        )

    def test_owner_cannot_add_duplicate_workspace_collaborator(self):
        self.workspace.collaborators.add(self.collaborator)
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(
            f"/api/workspaces/{self.workspace.id}/collaborators/",
            {"identifier": self.collaborator.username},
            format="json",
        )
        self.assertEqual(response.status_code, 400, response.data)
        self.assertEqual(
            self.workspace.collaborators.filter(pk=self.collaborator.pk).count(), 1
        )

    def test_owner_can_remove_workspace_collaborator(self):
        self.workspace.collaborators.add(self.collaborator)
        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(
            f"/api/workspaces/{self.workspace.id}/collaborators/{self.collaborator.id}/"
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertFalse(
            self.workspace.collaborators.filter(pk=self.collaborator.pk).exists()
        )
        collaborator_ids = {
            item["id"] for item in response.data["collaborators_details"]
        }
        self.assertNotIn(self.collaborator.id, collaborator_ids)

    def test_non_owner_cannot_remove_workspace_collaborator(self):
        self.workspace.collaborators.add(self.collaborator, self.outsider)
        self.client.force_authenticate(user=self.collaborator)
        response = self.client.delete(
            f"/api/workspaces/{self.workspace.id}/collaborators/{self.outsider.id}/"
        )

        self.assertEqual(response.status_code, 403, response.data)
        self.assertTrue(
            self.workspace.collaborators.filter(pk=self.outsider.pk).exists()
        )

    def test_owner_cannot_remove_workspace_owner(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(
            f"/api/workspaces/{self.workspace.id}/collaborators/{self.owner.id}/"
        )
        self.assertEqual(response.status_code, 400, response.data)
        self.assertEqual(self.workspace.owner_id, self.owner.id)

    def test_retrieve_workspace_denied_for_outsider(self):
        self.client.force_authenticate(user=self.outsider)
        response = self.client.get(f"/api/workspaces/{self.workspace.id}/")

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
            f"Expected 404 for outsider workspace access, got {response.status_code}: {response.data}",
        )

    def test_update_workspace_denied_for_outsider(self):
        self.client.force_authenticate(user=self.outsider)
        response = self.client.patch(
            f"/api/workspaces/{self.workspace.id}/",
            {"name": "No Access"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
            f"Expected 404 when outsider updates workspace, got {response.status_code}: {response.data}",
        )

    def test_update_workspace_denied_for_collaborator(self):
        self.workspace.collaborators.add(self.collaborator)
        self.client.force_authenticate(user=self.collaborator)
        response = self.client.patch(
            f"/api/workspaces/{self.workspace.id}/",
            {"name": "Collaborator Rename"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
            f"Expected 403 when collaborator updates workspace, got {response.status_code}: {response.data}",
        )
        self.assertEqual(
            response.data.get("detail"),
            "Only the workspace owner can update this workspace.",
        )
        self.workspace.refresh_from_db()
        self.assertEqual(self.workspace.name, "Owner Workspace")

    def test_delete_workspace_denied_for_outsider(self):
        self.client.force_authenticate(user=self.outsider)
        response = self.client.delete(f"/api/workspaces/{self.workspace.id}/")

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
            f"Expected 404 when outsider deletes workspace, got {response.status_code}: {response.data}",
        )

    def test_delete_workspace_denied_for_collaborator(self):
        self.workspace.collaborators.add(self.collaborator)
        self.client.force_authenticate(user=self.collaborator)
        response = self.client.delete(f"/api/workspaces/{self.workspace.id}/")

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
            f"Expected 403 when collaborator deletes workspace, got {response.status_code}: {response.data}",
        )
        self.assertEqual(
            response.data.get("detail"),
            "Only the workspace owner can delete this workspace.",
        )
        self.assertTrue(Workspace.objects.filter(pk=self.workspace.pk).exists())


class CollectionApiTests(APITestCase):
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
        self.collection_only_collaborator = User.objects.create_user(
            username="collection_only_collaborator",
            email="collection_only_collaborator_email@example.com",
            password="collection-only-password",
        )
        self.outsider = User.objects.create_user(
            username="outsider",
            email="outsider_email@example.com",
            password="outsider-password",
        )
        self.workspace = Workspace.objects.create(
            name="Owner Workspace",
            description="Owner Workspace Description",
            created_by=self.owner,
        )
        self.workspace.collaborators.add(self.collaborator)
        self.collection = Collection.objects.create(
            name="Owner Collection",
            description="Owner Collection Description",
            workspace=self.workspace,
            created_by=self.owner,
        )

    def test_create_collection_as_collaborator(self):
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

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            f"Expected 201 for collaborator collection create, got {response.status_code}: {response.data}",
        )
        collection = Collection.objects.get(id=response.data.get("id"))
        self.assertEqual(
            collection.created_by,
            self.collaborator,
            f"Expected collaborator to be creator, got {collection.created_by_id}",
        )

    def test_create_collection_missing_name(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(
            "/api/collections/",
            {"description": "No Name Supplied", "workspace": self.workspace.id},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            f"Expected 400 when name is missing, got {response.status_code}: {response.data}",
        )
        self.assertEqual(
            response.data.get("name"),
            ["This field is required."],
            f"Unexpected error body when name is missing: {response.data}",
        )

    def test_create_collection_missing_workspace(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(
            "/api/collections/",
            {"name": "Missing Workspace", "description": "No Workspace Supplied"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            f"Expected 400 when workspace is missing, got {response.status_code}: {response.data}",
        )
        self.assertEqual(
            response.data.get("workspace"),
            ["This field is required."],
            f"Unexpected error body when workspace is missing: {response.data}",
        )

    def test_create_collection_requires_workspace_access(self):
        self.client.force_authenticate(user=self.outsider)
        response = self.client.post(
            "/api/collections/",
            {
                "name": "Bad Collection",
                "description": "No Access",
                "workspace": self.workspace.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
            f"Expected 403 when creating collection without access, got {response.status_code}: {response.data}",
        )
        self.assertEqual(
            response.data.get("detail"),
            "You cannot add collections to this workspace.",
            f"Unexpected error detail when access denied: {response.data}",
        )

    def test_list_collections_filters_by_workspace(self):
        other_workspace = Workspace.objects.create(
            name="Other Workspace",
            description="Other Workspace Description",
            created_by=self.owner,
        )
        Collection.objects.create(
            name="Other Collection",
            description="Other Collection Description",
            workspace=other_workspace,
            created_by=self.owner,
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f"/api/collections/?workspace={self.workspace.id}")

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            f"Expected 200 for filtered collection collection, got {response.status_code}: {response.data}",
        )
        response_ids = {item["id"] for item in response.data}
        self.assertIn(
            self.collection.id,
            response_ids,
            f"Expected collection from workspace to be listed: {response.data}",
        )
        self.assertEqual(
            len(response_ids),
            1,
            f"Expected only one collection in filtered response, got {response.data}",
        )

    def test_list_collections_returns_saved_workspace_order(self):
        second_collection = Collection.objects.create(
            name="Second Collection",
            description="Second Collection Description",
            workspace=self.workspace,
            created_by=self.owner,
            position=0,
        )
        self.collection.position = 1
        self.collection.save(update_fields=["position"])

        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f"/api/collections/?workspace={self.workspace.id}")

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(
            [item["id"] for item in response.data],
            [second_collection.id, self.collection.id],
        )

    def test_reorder_collections_persists_workspace_order(self):
        second_collection = Collection.objects.create(
            name="Second Collection",
            description="Second Collection Description",
            workspace=self.workspace,
            created_by=self.owner,
            position=1,
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(
            "/api/collections/reorder/",
            {
                "workspace": self.workspace.id,
                "ordered_ids": [second_collection.id, self.collection.id],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(
            [item["id"] for item in response.data],
            [second_collection.id, self.collection.id],
        )
        self.collection.refresh_from_db()
        second_collection.refresh_from_db()
        self.assertEqual(second_collection.position, 0)
        self.assertEqual(self.collection.position, 1)

    def test_reorder_collections_rejects_ids_outside_workspace(self):
        other_workspace = Workspace.objects.create(
            name="Other Workspace",
            description="Other Workspace Description",
            created_by=self.owner,
        )
        other_collection = Collection.objects.create(
            name="Other Collection",
            description="Other Collection Description",
            workspace=other_workspace,
            created_by=self.owner,
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(
            "/api/collections/reorder/",
            {
                "workspace": self.workspace.id,
                "ordered_ids": [other_collection.id, self.collection.id],
            },
            format="json",
        )

        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST, response.data
        )
        self.assertIn("ordered_ids", response.data)

    def test_list_collections_filters_by_workspace_denied_for_outsider_workspace(self):
        other_workspace = Workspace.objects.create(
            name="Other Workspace",
            description="Other Workspace Description",
            created_by=self.outsider,
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f"/api/collections/?workspace={other_workspace.id}")

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
            f"Expected 403 when filtering by workspace without access, got {response.status_code}: {response.data}",
        )

    def test_list_collections_filters_by_workspace_denied_for_item_only_collaborator(
        self,
    ):
        Collection.objects.create(
            name="Shared Collection",
            description="No item-level sharing remains",
            workspace=self.workspace,
            created_by=self.owner,
        )

        self.client.force_authenticate(user=self.collection_only_collaborator)
        response = self.client.get(f"/api/collections/?workspace={self.workspace.id}")

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
            f"Expected 403 for non-member workspace filter, got {response.status_code}: {response.data}",
        )

    def test_retrieve_collection_denied_for_outsider(self):
        self.client.force_authenticate(user=self.outsider)
        response = self.client.get(f"/api/collections/{self.collection.id}/")

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
            f"Expected 404 for outsider collection access, got {response.status_code}: {response.data}",
        )

    def test_update_collection_denied_for_outsider(self):
        self.client.force_authenticate(user=self.outsider)
        response = self.client.patch(
            f"/api/collections/{self.collection.id}/",
            {"name": "No Access"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
            f"Expected 404 when outsider updates collection, got {response.status_code}: {response.data}",
        )

    def test_delete_collection_denied_for_outsider(self):
        self.client.force_authenticate(user=self.outsider)
        response = self.client.delete(f"/api/collections/{self.collection.id}/")

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
            f"Expected 404 when outsider deletes collection, got {response.status_code}: {response.data}",
        )

    def test_collection_cannot_add_items_from_other_workspace(self):
        other_workspace = Workspace.objects.create(
            name="Other Workspace",
            description="Other Workspace Description",
            created_by=self.owner,
        )
        other_item = Item.objects.create(
            item="Cross Workspace Item",
            description="Should not be attachable across workspaces",
            workspace=other_workspace,
            created_by=self.owner,
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(
            f"/api/collections/{self.collection.id}/",
            {"items": [other_item.id]},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            f"Expected 400 when attaching cross-workspace items, got {response.status_code}: {response.data}",
        )
        self.assertIn(
            "items",
            response.data,
            f"Expected 'items' validation error, got: {response.data}",
        )

    def test_collection_cannot_change_workspace_after_create(self):
        other_workspace = Workspace.objects.create(
            name="Second Workspace",
            description="Second Workspace Description",
            created_by=self.owner,
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(
            f"/api/collections/{self.collection.id}/",
            {"workspace": other_workspace.id},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            f"Expected 400 when changing collection workspace, got {response.status_code}: {response.data}",
        )
        self.assertEqual(
            response.data.get("workspace"),
            ["Cannot change workspace of a collection."],
            f"Unexpected error body when changing collection workspace: {response.data}",
        )

        self.collection.refresh_from_db()
        self.assertEqual(
            self.collection.workspace_id,
            self.workspace.id,
            "Collection workspace unexpectedly changed.",
        )

    def test_workspace_collaborator_can_retrieve_owner_created_collection_without_item_share(
        self,
    ):
        self.client.force_authenticate(user=self.collaborator)
        response = self.client.get(f"/api/collections/{self.collection.id}/")

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            f"Expected workspace collaborator to retrieve owner-created collection, got {response.status_code}: {response.data}",
        )
        self.assertEqual(response.data.get("id"), self.collection.id)

    def test_owner_can_retrieve_collaborator_created_collection_without_item_share(
        self,
    ):
        collaborator_collection = Collection.objects.create(
            name="Collaborator Created Collection",
            description="Shared through workspace",
            workspace=self.workspace,
            created_by=self.collaborator,
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f"/api/collections/{collaborator_collection.id}/")

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            f"Expected workspace owner to retrieve collaborator-created collection, got {response.status_code}: {response.data}",
        )
        self.assertEqual(response.data.get("id"), collaborator_collection.id)

    def test_workspace_membership_does_not_leak_lists_from_other_workspaces(self):
        other_member = User.objects.create_user(
            username="other_member",
            email="other_member@example.com",
            password="other-member-password",
        )
        other_workspace = Workspace.objects.create(
            name="Other Shared Workspace",
            description="Separate sharing boundary",
            created_by=self.outsider,
        )
        other_workspace.collaborators.add(other_member)
        other_collection = Collection.objects.create(
            name="Other Workspace Collection",
            description="Should not leak",
            workspace=other_workspace,
            created_by=self.outsider,
        )

        self.client.force_authenticate(user=self.collaborator)
        response = self.client.get(f"/api/collections/{other_collection.id}/")

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
            f"Expected no access to another workspace's collection, got {response.status_code}: {response.data}",
        )


class ItemApiTests(APITestCase):
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
        self.item_only_collaborator = User.objects.create_user(
            username="item_only_collaborator",
            email="item_only_collaborator_email@example.com",
            password="item-only-password",
        )
        self.outsider = User.objects.create_user(
            username="outsider",
            email="outsider_email@example.com",
            password="outsider-password",
        )
        self.workspace = Workspace.objects.create(
            name="Owner Workspace",
            description="Owner Workspace Description",
            created_by=self.owner,
        )
        self.workspace.collaborators.add(self.collaborator)
        self.collection = Collection.objects.create(
            name="Owner Collection",
            description="Owned Collection Description",
            workspace=self.workspace,
            created_by=self.owner,
        )
        self.item = Item.objects.create(
            item="Owner Item",
            description="Owner Item Description",
            workspace=self.workspace,
            created_by=self.owner,
        )
        self.collection.items.add(self.item)

    def test_workspace_collaborator_can_retrieve_owner_created_item_without_item_share(
        self,
    ):
        self.client.force_authenticate(user=self.collaborator)
        response = self.client.get(f"/api/items/{self.item.id}/")

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            f"Expected workspace collaborator to retrieve owner-created item, got {response.status_code}: {response.data}",
        )
        self.assertEqual(response.data.get("id"), self.item.id)

    def test_owner_can_retrieve_collaborator_created_item_in_list_without_item_share(
        self,
    ):
        collaborator_item = Item.objects.create(
            item="Collaborator Created Item",
            description="Shared through workspace collection",
            workspace=self.workspace,
            created_by=self.collaborator,
        )
        self.collection.items.add(collaborator_item)

        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f"/api/items/{collaborator_item.id}/")

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            f"Expected workspace owner to retrieve collaborator-created item, got {response.status_code}: {response.data}",
        )
        self.assertEqual(response.data.get("id"), collaborator_item.id)

    def test_collaborator_can_create_item_directly_in_shared_workspace(self):
        self.client.force_authenticate(user=self.collaborator)
        response = self.client.post(
            "/api/items/",
            {
                "item": "Workspace Scoped Item",
                "description": "Created directly in shared workspace",
                "workspace": self.workspace.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            f"Expected collaborator to create workspace-scoped item, got {response.status_code}: {response.data}",
        )
        item = Item.objects.get(id=response.data.get("id"))
        self.assertEqual(item.workspace_id, self.workspace.id)

        self.client.force_authenticate(user=self.owner)
        retrieve_response = self.client.get(f"/api/items/{item.id}/")
        self.assertEqual(
            retrieve_response.status_code,
            status.HTTP_200_OK,
            f"Expected owner to retrieve collaborator-created workspace item, got {retrieve_response.status_code}: {retrieve_response.data}",
        )

    def test_workspace_membership_does_not_leak_items_from_other_workspaces(self):
        other_workspace = Workspace.objects.create(
            name="Other Shared Workspace",
            description="Separate sharing boundary",
            created_by=self.outsider,
        )
        other_item = Item.objects.create(
            item="Other Workspace Item",
            description="Should not leak",
            workspace=other_workspace,
            created_by=self.outsider,
        )

        self.client.force_authenticate(user=self.collaborator)
        response = self.client.get(f"/api/items/{other_item.id}/")

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
            f"Expected no access to another workspace's item, got {response.status_code}: {response.data}",
        )

    def test_create_item_as_collaborator(self):
        self.client.force_authenticate(user=self.collaborator)
        response = self.client.post(
            "/api/items/",
            {
                "item": "Collaborator Item",
                "description": "Created by Collaborator",
                "collection": self.collection.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            f"Expected 201 for collaborator item create, got {response.status_code}: {response.data}",
        )
        item = Item.objects.get(id=response.data.get("id"))
        self.assertEqual(
            item.workspace,
            self.workspace,
            f"Expected item workspace to match collection workspace, got {item.workspace_id}",
        )
        self.assertEqual(
            item.created_by,
            self.collaborator,
            f"Expected collaborator to be creator, got {item.created_by_id}",
        )

    def test_create_item_missing_item(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(
            "/api/items/",
            {"description": "No Item Supplied", "collection": self.collection.id},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            f"Expected 400 when item is missing, got {response.status_code}: {response.data}",
        )
        self.assertEqual(
            response.data.get("item"),
            ["This field is required."],
            f"Unexpected error body when item is missing: {response.data}",
        )

    def test_create_item_missing_list(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(
            "/api/items/",
            {"item": "Missing Collection", "description": "No Collection Supplied"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            f"Expected 400 when collection is missing, got {response.status_code}: {response.data}",
        )
        self.assertEqual(
            response.data.get("collection"),
            ["This field is required when workspace is not provided."],
            f"Unexpected error body when collection is missing: {response.data}",
        )

    def test_create_item_requires_collection_access(self):
        self.client.force_authenticate(user=self.outsider)
        response = self.client.post(
            "/api/items/",
            {
                "item": "Outsider Item",
                "description": "No Access",
                "collection": self.collection.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
            f"Expected 403 when creating item without access, got {response.status_code}: {response.data}",
        )
        self.assertEqual(
            response.data.get("detail"),
            "You cannot add items to this collection.",
            f"Unexpected error detail for item access denial: {response.data}",
        )

    def test_list_items_filters_by_collection(self):
        other_collection = Collection.objects.create(
            name="Other Collection",
            description="Other Collection Description",
            workspace=self.workspace,
            created_by=self.owner,
        )
        other_item = Item.objects.create(
            item="Other Item",
            description="Other Item Description",
            workspace=self.workspace,
            created_by=self.owner,
        )
        other_collection.items.add(other_item)

        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f"/api/items/?collection={self.collection.id}")

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            f"Expected 200 for filtered item collection, got {response.status_code}: {response.data}",
        )
        response_ids = {item["id"] for item in response.data}
        self.assertIn(
            self.item.id,
            response_ids,
            f"Expected item from collection to be listed: {response.data}",
        )
        self.assertEqual(
            len(response_ids),
            1,
            f"Expected only one item in filtered response, got {response.data}",
        )

    def test_list_items_returns_saved_collection_membership_order(self):
        second_item = Item.objects.create(
            item="Second Item",
            description="Second Item Description",
            workspace=self.workspace,
            created_by=self.owner,
        )
        self.collection.items.add(second_item)
        CollectionItem.objects.filter(
            collection=self.collection, item=self.item
        ).update(position=1)
        CollectionItem.objects.filter(
            collection=self.collection, item=second_item
        ).update(position=0)

        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f"/api/items/?collection={self.collection.id}")

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(
            [item["id"] for item in response.data],
            [second_item.id, self.item.id],
        )

    def test_reorder_items_persists_collection_membership_order(self):
        second_item = Item.objects.create(
            item="Second Item",
            description="Second Item Description",
            workspace=self.workspace,
            created_by=self.owner,
        )
        self.collection.items.add(second_item)

        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(
            "/api/items/reorder/",
            {
                "collection": self.collection.id,
                "ordered_ids": [second_item.id, self.item.id],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(
            [item["id"] for item in response.data],
            [second_item.id, self.item.id],
        )
        self.assertEqual(
            CollectionItem.objects.get(
                collection=self.collection, item=second_item
            ).position,
            0,
        )
        self.assertEqual(
            CollectionItem.objects.get(
                collection=self.collection, item=self.item
            ).position,
            1,
        )

    def test_reorder_items_rejects_ids_outside_list(self):
        outside_item = Item.objects.create(
            item="Outside Item",
            description="Outside Item Description",
            workspace=self.workspace,
            created_by=self.owner,
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(
            "/api/items/reorder/",
            {
                "collection": self.collection.id,
                "ordered_ids": [outside_item.id, self.item.id],
            },
            format="json",
        )

        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST, response.data
        )
        self.assertIn("ordered_ids", response.data)

    def test_same_item_can_have_different_positions_in_different_lists(self):
        second_item = Item.objects.create(
            item="Second Item",
            description="Second Item Description",
            workspace=self.workspace,
            created_by=self.owner,
        )
        other_collection = Collection.objects.create(
            name="Other Collection",
            description="Other Collection Description",
            workspace=self.workspace,
            created_by=self.owner,
        )
        self.collection.items.add(second_item)
        other_collection.items.add(self.item)
        other_collection.items.add(second_item)

        self.client.force_authenticate(user=self.owner)
        first_response = self.client.patch(
            "/api/items/reorder/",
            {
                "collection": self.collection.id,
                "ordered_ids": [second_item.id, self.item.id],
            },
            format="json",
        )
        second_response = self.client.patch(
            "/api/items/reorder/",
            {
                "collection": other_collection.id,
                "ordered_ids": [self.item.id, second_item.id],
            },
            format="json",
        )

        self.assertEqual(
            first_response.status_code, status.HTTP_200_OK, first_response.data
        )
        self.assertEqual(
            second_response.status_code,
            status.HTTP_200_OK,
            second_response.data,
        )
        self.assertEqual(
            CollectionItem.objects.get(
                collection=self.collection, item=self.item
            ).position,
            1,
        )
        self.assertEqual(
            CollectionItem.objects.get(
                collection=other_collection, item=self.item
            ).position,
            0,
        )

    def test_list_items_filters_by_workspace_denied_for_outsider_workspace(self):
        other_workspace = Workspace.objects.create(
            name="Other Workspace",
            description="Other Workspace Description",
            created_by=self.outsider,
        )
        Item.objects.create(
            item="Outsider Item",
            description="Should not be accessible",
            workspace=other_workspace,
            created_by=self.outsider,
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f"/api/items/?workspace={other_workspace.id}")

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
            f"Expected 403 when filtering items by workspace without access, got {response.status_code}: {response.data}",
        )

    def test_list_items_filters_by_workspace_denied_for_item_only_collaborator(self):
        self.client.force_authenticate(user=self.item_only_collaborator)
        response = self.client.get(f"/api/items/?workspace={self.workspace.id}")

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
            f"Expected 403 for non-member workspace filter, got {response.status_code}: {response.data}",
        )

    def test_item_can_belong_to_multiple_lists(self):
        other_collection = Collection.objects.create(
            name="Secondary Collection",
            description="Secondary Collection Description",
            workspace=self.workspace,
            created_by=self.owner,
        )
        other_collection.items.add(self.item)

        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f"/api/items/?collection={other_collection.id}")

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            f"Expected 200 for filtered item collection, got {response.status_code}: {response.data}",
        )
        response_ids = {item["id"] for item in response.data}
        self.assertIn(
            self.item.id,
            response_ids,
            f"Expected item to be listed for secondary collection: {response.data}",
        )

    def test_item_removed_from_list_not_in_filtered_results(self):
        other_collection = Collection.objects.create(
            name="Secondary Collection",
            description="Secondary Collection Description",
            workspace=self.workspace,
            created_by=self.owner,
        )
        other_collection.items.add(self.item)
        other_collection.items.remove(self.item)

        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f"/api/items/?collection={other_collection.id}")

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            f"Expected 200 for filtered item collection, got {response.status_code}: {response.data}",
        )
        response_ids = {item["id"] for item in response.data}
        self.assertNotIn(
            self.item.id,
            response_ids,
            f"Expected item to be absent after removal: {response.data}",
        )

    def test_retrieve_item_denied_for_outsider(self):
        self.client.force_authenticate(user=self.outsider)
        response = self.client.get(f"/api/items/{self.item.id}/")

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
            f"Expected 404 for outsider item access, got {response.status_code}: {response.data}",
        )

    def test_update_item_denied_for_outsider(self):
        self.client.force_authenticate(user=self.outsider)
        response = self.client.patch(
            f"/api/items/{self.item.id}/",
            {"item": "No Access"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
            f"Expected 404 when outsider updates item, got {response.status_code}: {response.data}",
        )

    def test_delete_item_denied_for_outsider(self):
        self.client.force_authenticate(user=self.outsider)
        response = self.client.delete(f"/api/items/{self.item.id}/")

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
            f"Expected 404 when outsider deletes item, got {response.status_code}: {response.data}",
        )

    def test_patch_item_allows_partial_update_without_resupplying_scope(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(
            f"/api/items/{self.item.id}/",
            {"description": "Updated Description"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            f"Expected 200 when patching item without scope fields, got {response.status_code}: {response.data}",
        )
        self.item.refresh_from_db()
        self.assertEqual(self.item.description, "Updated Description")

    def test_item_status_defaults_not_started_and_can_be_updated(self):
        self.client.force_authenticate(user=self.owner)

        retrieve_response = self.client.get(f"/api/items/{self.item.id}/")
        self.assertEqual(
            retrieve_response.status_code,
            status.HTTP_200_OK,
            f"Expected 200 retrieving item, got {retrieve_response.status_code}: {retrieve_response.data}",
        )
        self.assertEqual(retrieve_response.data.get("status"), Item.STATUS_NOT_STARTED)

        update_response = self.client.patch(
            f"/api/items/{self.item.id}/",
            {"status": Item.STATUS_COMPLETE},
            format="json",
        )

        self.assertEqual(
            update_response.status_code,
            status.HTTP_200_OK,
            f"Expected 200 updating item status, got {update_response.status_code}: {update_response.data}",
        )
        self.assertEqual(update_response.data.get("status"), Item.STATUS_COMPLETE)
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, Item.STATUS_COMPLETE)

    def test_item_status_allows_in_progress(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(
            f"/api/items/{self.item.id}/",
            {"status": Item.STATUS_IN_PROGRESS},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            f"Expected 200 updating item status to in progress, got {response.status_code}: {response.data}",
        )
        self.assertEqual(response.data.get("status"), Item.STATUS_IN_PROGRESS)

    def test_patch_collection_attaches_within_workspace(self):
        other_collection = Collection.objects.create(
            name="Secondary Collection",
            description="Secondary Collection Description",
            workspace=self.workspace,
            created_by=self.owner,
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(
            f"/api/items/{self.item.id}/",
            {"collection": other_collection.id},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            f"Expected 200 when attaching item to another collection, got {response.status_code}: {response.data}",
        )
        self.assertTrue(
            other_collection.items.filter(id=self.item.id).exists(),
            "Expected item to be attached to the specified collection.",
        )

    def test_patch_collection_attach_requires_collection_access(self):
        other_collection = Collection.objects.create(
            name="Private Collection",
            description="Not shared with item-only collaborator",
            workspace=self.workspace,
            created_by=self.owner,
        )

        # Item-level item sharing no longer exists, so this user has no access.
        self.client.force_authenticate(user=self.item_only_collaborator)
        response = self.client.patch(
            f"/api/items/{self.item.id}/",
            {"collection": other_collection.id},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
            f"Expected 404 when patching a item without access, got {response.status_code}: {response.data}",
        )

    def test_patch_collection_cross_workspace_rejected(self):
        other_workspace = Workspace.objects.create(
            name="Other Workspace",
            description="Other Workspace Description",
            created_by=self.owner,
        )
        other_collection = Collection.objects.create(
            name="Other Collection",
            description="Other Collection Description",
            workspace=other_workspace,
            created_by=self.owner,
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(
            f"/api/items/{self.item.id}/",
            {"collection": other_collection.id},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            f"Expected 400 when attaching item to cross-workspace collection, got {response.status_code}: {response.data}",
        )
        self.assertEqual(
            response.data.get("collection"),
            ["Collection must be in the same workspace as the item."],
            f"Unexpected error body for cross-workspace collection: {response.data}",
        )

    def test_item_cannot_change_workspace_after_create(self):
        other_workspace = Workspace.objects.create(
            name="Second Workspace",
            description="Second Workspace Description",
            created_by=self.owner,
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(
            f"/api/items/{self.item.id}/",
            {"workspace": other_workspace.id},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            f"Expected 400 when changing item workspace, got {response.status_code}: {response.data}",
        )
        self.assertEqual(
            response.data.get("workspace"),
            ["Cannot change workspace of an existing item."],
            f"Unexpected error body when changing item workspace: {response.data}",
        )

        self.item.refresh_from_db()
        self.assertEqual(
            self.item.workspace_id,
            self.workspace.id,
            "Item workspace unexpectedly changed.",
        )

    def test_item_workspace_immutability_error_precedes_list_validation(self):
        other_workspace = Workspace.objects.create(
            name="Second Workspace",
            description="Second Workspace Description",
            created_by=self.owner,
        )

        # If a client tries to change both `workspace` and `collection`, the API should
        # report the workspace immutability error (clearer semantics) rather than a
        # derived workspace/collection mismatch error.
        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(
            f"/api/items/{self.item.id}/",
            {"workspace": other_workspace.id, "collection": self.collection.id},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            f"Expected 400 when attempting to change item workspace, got {response.status_code}: {response.data}",
        )
        self.assertEqual(
            response.data.get("workspace"),
            ["Cannot change workspace of an existing item."],
            f"Unexpected error body when changing item workspace: {response.data}",
        )
        self.assertNotIn(
            "collection",
            response.data,
            f"Expected workspace error to be raised first: {response.data}",
        )
