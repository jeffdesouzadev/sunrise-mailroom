import os
import threading
import time
import webbrowser

from waitress import serve

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings",
)

import django

django.setup()

from django.core.management import call_command
from config.wsgi import application


def open_browser():
    time.sleep(1.5)

    webbrowser.open(
        "http://127.0.0.1:8765"
    )


if __name__ == "__main__":
    #
    # Initialize or upgrade the persistent SQLite database.
    #
    call_command(
        "migrate",
        interactive=False,
        verbosity=1,
    )

    threading.Thread(
        target=open_browser,
        daemon=True,
    ).start()

    serve(
        application,
        host="127.0.0.1",
        port=8765,
    )