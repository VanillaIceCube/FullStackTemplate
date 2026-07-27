from django.contrib import admin

from .models import Collection, CollectionItem, Item, Workspace


def _summarize_users(users, limit: int = 3) -> str:
    users = list(users)
    if not users:
        return "-"

    shown = ", ".join(str(u) for u in users[:limit])
    remaining = len(users) - limit
    if remaining > 0:
        return f"{shown} (+{remaining} more)"
    return shown


def _summarize_items(items, limit: int = 3) -> str:
    items = list(items)
    if not items:
        return "-"

    shown = ", ".join(str(i) for i in items[:limit])
    remaining = len(items) - limit
    if remaining > 0:
        return f"{shown} (+{remaining} more)"
    return shown


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "owner",
        "collaborators_display",
        "created_at",
        "updated_at",
    )
    list_filter = ("owner", "created_at", "updated_at")
    search_fields = (
        "name",
        "description",
        "owner__username",
        "owner__email",
        "collaborators__username",
        "collaborators__email",
    )
    autocomplete_fields = ("owner", "collaborators", "created_by")
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (None, {"fields": ("name", "description")}),
        ("Ownership", {"fields": ("owner", "collaborators")}),
        ("Metadata", {"fields": ("created_by", "created_at", "updated_at")}),
    )

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("owner", "created_by")
            .prefetch_related("collaborators")
        )

    @admin.display(description="Collaborators")
    def collaborators_display(self, obj):
        return _summarize_users(obj.collaborators.all())


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "workspace",
        "created_by",
        "created_at",
        "updated_at",
    )
    list_filter = ("workspace", "created_by", "created_at", "updated_at")
    search_fields = (
        "name",
        "description",
        "workspace__name",
        "created_by__username",
        "created_by__email",
    )
    autocomplete_fields = ("workspace", "created_by")
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (None, {"fields": ("name", "description")}),
        ("Scope", {"fields": ("workspace",)}),
        ("Metadata", {"fields": ("created_by", "created_at", "updated_at")}),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("workspace", "created_by")


@admin.register(CollectionItem)
class CollectionItemAdmin(admin.ModelAdmin):
    list_display = ("collection", "item", "position")
    list_filter = ("collection__workspace", "collection")
    search_fields = ("collection__name", "item__item")
    autocomplete_fields = ("collection", "item")


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = (
        "item",
        "status",
        "collections_display",
        "workspace",
        "created_by",
        "created_at",
        "updated_at",
    )
    list_filter = ("status", "workspace", "created_by", "created_at", "updated_at")
    search_fields = (
        "item",
        "description",
        "workspace__name",
        "created_by__username",
        "created_by__email",
        "collections__name",
    )
    autocomplete_fields = ("workspace", "created_by")
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (None, {"fields": ("item", "description", "status")}),
        ("Scope", {"fields": ("workspace",)}),
        ("Metadata", {"fields": ("created_by", "created_at", "updated_at")}),
    )

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("workspace", "created_by")
            .prefetch_related("collections")
        )

    @admin.display(description="Collections")
    def collections_display(self, obj):
        return _summarize_items(obj.collections.all())
