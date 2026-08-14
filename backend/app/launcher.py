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

from config.wsgi import application


def open_browser():
    time.sleep(1.5)
    webbrowser.open(
        "http://127.0.0.1:8765"
    )


if __name__ == "__main__":
    threading.Thread(
        target=open_browser,
        daemon=True,
    ).start()

    serve(
        application,
        host="127.0.0.1",
        port=8765,
    )