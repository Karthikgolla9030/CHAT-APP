from django.db import models
from django.contrib.auth import get_user_model
from accounts.models import Profile
import uuid

User = get_user_model()


class MatchRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('expired', 'Expired'),
        ('matched', 'Matched'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='match_requests_sent')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='match_requests_received')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    sender_preferences = models.JSONField(default=dict, blank=True)
    receiver_preferences = models.JSONField(default=dict, blank=True)
    match_score = models.FloatField(default=0.0)
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


class MatchQueue(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='match_queue')
    preferences = models.JSONField(default=dict, blank=True)
    match_mode = models.CharField(max_length=20, default='random')
    is_active = models.BooleanField(default=True)
    entered_at = models.DateTimeField(auto_now_add=True)
    last_searched_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['is_active', 'entered_at']),
        ]

    def __str__(self):
        return f"Queue: {self.user.username} ({self.match_mode})"


class MatchHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='match_history_1')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='match_history_2')
    match_score = models.FloatField(default=0.0)
    matched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['user1', 'user2']),
            models.Index(fields=['matched_at']),
        ]
        ordering = ['-matched_at']

    def __str__(self):
        return f"{self.user1.username} <-> {self.user2.username}"
