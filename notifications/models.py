from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class Notification(models.Model):
    TYPE_CHOICES = [
        ('friend_request', 'Friend Request'),
        ('friend_accepted', 'Friend Accepted'),
        ('new_message', 'New Message'),
        ('system_message', 'System Message'),
        ('chat_invite', 'Chat Invite'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['recipient', 'is_read', 'created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.recipient.username}: {self.title}"


class NotificationPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    friend_requests = models.BooleanField(default=True)
    friend_accepted = models.BooleanField(default=True)
    new_message = models.BooleanField(default=True)
    system_message = models.BooleanField(default=True)
    chat_invite = models.BooleanField(default=True)

    def __str__(self):
        return f"Preferences for {self.user.username}"
