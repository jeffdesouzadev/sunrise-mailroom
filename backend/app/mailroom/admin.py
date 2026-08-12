from django.contrib import admin

from .models import Client, Visit


class VisitInline(admin.TabularInline):
    model = Visit
    extra = 0
    ordering = ("-visited_at",)
    readonly_fields = ("visited_at",)


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "full_name",
        "date_of_birth",
        "latest_visit",
        "visit_count",
    )

    search_fields = (
        "full_name",
    )

    list_filter = (
        "date_of_birth",
    )

    inlines = [
        VisitInline,
    ]

    def latest_visit(self, obj):
        visit = obj.visits.first()
        return visit.visited_at if visit else None

    def visit_count(self, obj):
        return obj.visits.count()


@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "client",
        "visited_at",
    )

    search_fields = (
        "client__full_name",
    )

    list_filter = (
        "visited_at",
    )

    ordering = (
        "-visited_at",
    )