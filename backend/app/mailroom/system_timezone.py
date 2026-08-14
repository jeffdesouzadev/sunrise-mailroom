import os
from zoneinfo import ZoneInfo

from django.conf import settings
from tzlocal import get_localzone_name


def get_mailroom_timezone():
    if settings.SUNRISE_LOCAL_TIMEZONE:
        timezone_name = settings.SUNRISE_LOCAL_TIMEZONE
        return ZoneInfo(timezone_name), timezone_name

    original_tz = os.environ.pop("TZ", None)

    try:
        timezone_name = get_localzone_name()
    finally:
        if original_tz is not None:
            os.environ["TZ"] = original_tz

    return ZoneInfo(timezone_name), timezone_name