from django.db import models
from django.contrib.auth import get_user_model
from accounts.models import Profile
import uuid

User = get_user_model()


class FriendRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('blocked', 'Blocked'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friend_requests_sent')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friend_requests_received')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    message = models.TextField(blank=True, max_length=500)
    seen = models.BooleanField(default=False)
    chat_room = models.ForeignKey('chat.ChatRoom', on_delete=models.SET_NULL, null=True, blank=True, related_name='friend_requests')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['sender', 'status']),
            models.Index(fields=['receiver', 'status']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.sender.username} -> {self.receiver.username} ({self.status})"


class BlockedUser(models.Model):
    blocker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_users')
    blocked = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_by')
    reason = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['blocker', 'blocked']
        indexes = [
            models.Index(fields=['blocker']),
            models.Index(fields=['blocked']),
        ]

    def __str__(self):
        return f"{self.blocker.username} blocked {self.blocked.username}"


class Friendship(models.Model):
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendships_1')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendships_2')
    chat_room = models.ForeignKey('chat.ChatRoom', on_delete=models.SET_NULL, null=True, blank=True, related_name='friendships')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user1', 'user2']
        indexes = [
            models.Index(fields=['user1', 'user2']),
        ]

    def __str__(self):
        return f"{self.user1.username} <-> {self.user2.username}"
