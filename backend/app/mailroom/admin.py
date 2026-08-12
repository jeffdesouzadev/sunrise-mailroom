from django.contrib import admin
from .models import Package, Client, AuthorizedPickupPerson


@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "recipient_name",
        "carrier",
        "tracking_number",
        "status",
        "received_at",
        "notified_at",
        "picked_up_at",
    )
    search_fields = ("recipient_name", "tracking_number", "carrier")
    list_filter = ("status", "carrier")


class AuthorizedPickupPersonInline(admin.TabularInline):
    model = AuthorizedPickupPerson
    extra = 1


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "full_name",
        "first_name",
        "last_name",
        "date_of_birth",
        "is_active",
        "last_checked_in_at",
    )
    search_fields = ("full_name", "first_name", "last_name")
    list_filter = ("is_active",)
    inlines = [AuthorizedPickupPersonInline]


@admin.register(AuthorizedPickupPerson)
class AuthorizedPickupPersonAdmin(admin.ModelAdmin):
    list_display = ("id", "full_name", "client", "relationship")
    search_fields = ("full_name", "client__full_name", "relationship")