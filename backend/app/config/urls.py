from django.contrib import admin
from django.urls import path
from mailroom.views import (
    home,
    health_check,
    package_list,
    client_list,
    client_detail,
    client_check_in,
)

urlpatterns = [
    path("", home, name="home"),
    path("admin/", admin.site.urls),
    path("api/health/", health_check),
    path("api/packages/", package_list),
    path("api/clients/", client_list),
    path("api/clients/<int:pk>/", client_detail),
    path("api/clients/<int:pk>/check-in/", client_check_in),
]