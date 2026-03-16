from django.contrib import admin
from .models import Package


@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    list_display = ("recipient_name", "carrier", "status", "received_at", "picked_up_at")
    search_fields = ("recipient_name", "tracking_number", "carrier")
    list_filter = ("status", "carrier")