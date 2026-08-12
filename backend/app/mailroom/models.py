from django.db import models
from django.utils import timezone


class Client(models.Model):
    full_name = models.CharField(
        max_length=255,
        db_index=True,
    )

    date_of_birth = models.DateField(
        db_index=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["full_name"]

    def __str__(self):
        return f"{self.full_name} ({self.date_of_birth})"


class Visit(models.Model):
    client = models.ForeignKey(
        Client,
        related_name="visits",
        on_delete=models.CASCADE,
    )

    visited_at = models.DateTimeField(
        default=timezone.now,
        db_index=True,
    )

    class Meta:
        ordering = ["-visited_at"]
        indexes = [
            models.Index(fields=["client", "-visited_at"]),
        ]

    def __str__(self):
        return f"{self.client.full_name} - {self.visited_at}"