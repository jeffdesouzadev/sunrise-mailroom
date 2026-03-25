from django.contrib import admin
from django.urls import path
from mailroom.views import (
    home,
    health_check,
    package_list,
    package_detail,
    package_mark_notified,
    package_mark_picked_up,
    client_list,
    client_detail,
    client_check_in,
    authorized_pickup_create,
    authorized_pickup_detail,
)

urlpatterns = [
    path("", home, name="home"),
    path("admin/", admin.site.urls),
    path("api/health/", health_check),
    path("api/packages/", package_list),
    path("api/packages/<int:pk>/", package_detail),
    path("api/packages/<int:pk>/mark-notified/", package_mark_notified),
    path("api/packages/<int:pk>/mark-picked-up/", package_mark_picked_up),

    path("api/clients/", client_list),
    path("api/clients/<int:pk>/", client_detail),
    path("api/clients/<int:pk>/check-in/", client_check_in),

    path("api/clients/<int:client_pk>/authorized-pickups/", authorized_pickup_create),
    path("api/authorized-pickups/<int:pk>/", authorized_pickup_detail),
]