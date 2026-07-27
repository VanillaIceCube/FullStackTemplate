from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models.signals import m2m_changed, post_save
from django.dispatch import receiver

from .models import Collection, CollectionItem, Item, Workspace

User = get_user_model()

DEFAULT_PERSONAL_WORKSPACE_CONTENT = [
    (
        "Grocery Collection",
        [
            "Large Tortillas",
            "Carne Asada",
            "Fries",
            "Shredded Mexican Cheese",
            "Sour Cream",
            "Guac",
        ],
    ),
    (
        "Chores Collection",
        [
            "Sweep up the beach sand somehow still in the house",
            "Wipe down the entire condo, shouldn't take long",
            "Throw away the cold brew collection from every coffee shop nearby",
        ],
    ),
    (
        "Todo Collection",
        [
            "Volleyball",
            "Build Furniture",
            "Oceanside Hike",
            "Date Night with the wifey :)",
            "More Volleyball",
        ],
    ),
]


def _capitalize_first(value):
    if not value:
        return value
    return value[0].upper() + value[1:]


def _default_workspace_base_name(user):
    username = (user.get_username() or "").strip()
    fallback = (user.email or "").split("@", 1)[0].strip()
    if username and username != fallback:
        return username
    return _capitalize_first(fallback or username) or "My"


def seed_default_personal_workspace(workspace, user):
    for list_position, (collection_name, item_texts) in enumerate(
        DEFAULT_PERSONAL_WORKSPACE_CONTENT
    ):
        collection, _ = Collection.objects.get_or_create(
            workspace=workspace,
            name=collection_name,
            defaults={
                "created_by": user,
                "position": list_position,
            },
        )

        for note_position, item_text in enumerate(item_texts):
            item, _ = Item.objects.get_or_create(
                workspace=workspace,
                item=item_text,
                defaults={"created_by": user},
            )
            CollectionItem.objects.get_or_create(
                collection=collection,
                item=item,
                defaults={"position": note_position},
            )


@receiver(post_save, sender=User)
def create_default_workspace(sender, instance, created, **kwargs):
    if not created:
        return
    if Workspace.objects.filter(owner=instance).exists():
        return
    base_name = _default_workspace_base_name(instance)
    with transaction.atomic():
        workspace = Workspace.objects.create(
            name=f"{base_name}'s Workspace",
            owner=instance,
            created_by=instance,
        )
        seed_default_personal_workspace(workspace, instance)


@receiver(m2m_changed, sender=Collection.items.through)
def enforce_item_workspace_boundary(
    sender, instance, action, reverse, model, pk_set, **kwargs
):
    """
    Prevent cross-workspace links between Collections and Items.

    The hard boundary is:
    - Collection belongs to exactly one Workspace
    - Item belongs to exactly one Workspace
    - A Item may appear in multiple Collections, but only within its Workspace
    """

    if action != "pre_add" or not pk_set:
        return

    if reverse:
        # instance is a Item; pk_set contains Collection IDs.
        item = instance
        if (
            Collection.objects.filter(id__in=pk_set)
            .exclude(workspace_id=item.workspace_id)
            .exists()
        ):
            raise ValidationError(
                "Cannot add a item to a collection in a different workspace."
            )
        return

    # instance is a Collection; pk_set contains Item IDs.
    collection = instance
    if (
        Item.objects.filter(id__in=pk_set)
        .exclude(workspace_id=collection.workspace_id)
        .exists()
    ):
        raise ValidationError("Cannot add items from a different workspace.")
