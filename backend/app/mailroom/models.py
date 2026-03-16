from django.db import models


class Package(models.Model):
    STATUS_CHOICES = [
        ("received", "Received"),
        ("notified", "Notified"),
        ("picked_up", "Picked Up"),
    ]

    recipient_name = models.CharField(max_length=255)
    carrier = models.CharField(max_length=100, blank=True)
    tracking_number = models.CharField(max_length=255, blank=True)
    received_at = models.DateTimeField(auto_now_add=True)
    notified_at = models.DateTimeField(null=True, blank=True)
    picked_up_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="received")
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.recipient_name} - {self.carrier or 'Package'}"