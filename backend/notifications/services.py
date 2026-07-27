from django.contrib.auth import get_user_model

from .models import Notification

User = get_user_model()


def display_name(user):
    return user.get_full_name() or user.get_username() or user.email


def workspace_recipients(workspace, actor, exclude_user_ids=None):
    exclude_user_ids = set(exclude_user_ids or [])
    user_ids = {
        workspace.owner_id,
        *workspace.collaborators.values_list("id", flat=True),
    }
    user_ids.discard(actor.id)
    user_ids.difference_update(exclude_user_ids)
    return User.objects.filter(id__in=user_ids)


def workspace_path(workspace):
    return f"/workspace/{workspace.id}"


def collection_path(collection):
    return f"/workspace/{collection.workspace_id}/collection/{collection.id}"


def first_item_collection(item):
    membership = (
        item.collection_memberships.select_related(
            "collection",
            "collection__workspace",
        )
        .order_by("position", "id")
        .first()
    )
    if membership is None:
        return None
    return membership.collection


def notify_workspace_members(
    workspace,
    actor,
    event_type,
    title,
    message,
    exclude_user_ids=None,
    collection=None,
    item=None,
    target_path="",
):
    recipients = list(workspace_recipients(workspace, actor, exclude_user_ids))
    if not recipients:
        return

    Notification.objects.bulk_create(
        [
            Notification(
                recipient=recipient,
                actor=actor,
                workspace=workspace,
                workspace_name=workspace.name,
                collection=collection,
                item=item,
                event_type=event_type,
                title=title,
                message=message,
                target_path=target_path,
            )
            for recipient in recipients
        ]
    )
