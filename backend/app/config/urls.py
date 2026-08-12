from django.contrib import admin
from django.urls import path

from mailroom.views import (
    home,
    health_check,
    client_list,
    client_detail,
    client_visit,
)


urlpatterns = [
    path("", home, name="home"),
    path("admin/", admin.site.urls),

    path("api/health/", health_check, name="health-check"),

    path("api/clients/", client_list, name="client-list"),
    path("api/clients/<int:pk>/", client_detail, name="client-detail"),
    path(
        "api/clients/<int:pk>/visit/",
        client_visit,
        name="client-visit",
    ),
]