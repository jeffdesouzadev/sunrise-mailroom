from django.contrib import admin
from django.urls import path
from mailroom.views import (
    # existing views...
    export_visits,
    import_visits,
)


from mailroom.views import (
    home,
    health_check,
    client_list,
    client_detail,
    client_visit,
)

from mailroom.frontend_views import (
    frontend_index,
    frontend_asset,
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
    path(
        "api/export/visits/",
        export_visits,
    ),
    path(
        "api/import/visits/",
        import_visits,
    ),
    path(
        "assets/<path:path>",
        frontend_asset,
        name="frontend-asset",
    ),
    path(
        "",
        frontend_index,
        name="frontend",
    ),
]