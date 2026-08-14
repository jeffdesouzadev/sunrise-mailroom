from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404
from django.shortcuts import render


def frontend_index(request):
    return render(request, "index.html")


def frontend_asset(request, path):
    asset_path = settings.FRONTEND_DIST_DIR / "assets" / path

    if not asset_path.exists() or not asset_path.is_file():
        raise Http404()

    return FileResponse(
        open(asset_path, "rb")
    )