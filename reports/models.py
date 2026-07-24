from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class Report(models.Model):
    REASON_CHOICES = [
        ('spam', 'Spam'),
        ('harassment', 'Harassment'),
        ('fake_profile', 'Fake Profile'),
        ('abuse', 'Abuse'),
        ('adult_content', 'Adult Content'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('open', 'Open'),
        ('reviewed', 'Reviewed'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_sent')
    reported_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_received')
    reason = models.CharField(max_length=30, choices=REASON_CHOICES)
    description = models.TextField(max_length=1000, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    admin_notes = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['reporter', 'status']),
            models.Index(fields=['reported_user', 'status']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"Report: {self.reporter.username} -> {self.reported_user.username} ({self.reason})"


class BlockedWord(models.Model):
    word = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=['word'])]

    def __str__(self):
        return self.word
