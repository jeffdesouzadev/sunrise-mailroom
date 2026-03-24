from django.db import models    
from django.forms.models import model_to_dict
from django.utils import timezone

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
    
    def to_dict(self):
        return model_to_dict(self)

    def debug_dump(self):
        return str(self.to_dict())

class Client(models.Model):
    full_name = models.CharField(max_length=255)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)

    date_of_birth = models.DateField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    last_checked_in_at = models.DateTimeField(null=True, blank=True)

    notes = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        name_parts = self.full_name.strip().split() if self.full_name else []

        if not self.first_name and name_parts:
            self.first_name = name_parts[0]

        if not self.last_name and len(name_parts) > 1:
            self.last_name = name_parts[-1]

        super().save(*args, **kwargs)


    def check_in(self):
        self.last_checked_in_at = timezone.now()
        self.is_active = True
        self.save()

    def __str__(self):
        return self.full_name
    
class AuthorizedPickupPerson(models.Model):
    client = models.ForeignKey(Client, related_name="authorized_pickups", on_delete=models.CASCADE)
    full_name = models.CharField(max_length=255)
    relationship = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.full_name} for {self.client.full_name}"