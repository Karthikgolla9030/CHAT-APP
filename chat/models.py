from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class ChatRoom(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('ended', 'Ended'),
        ('reported', 'Reported'),
        ('blocked', 'Blocked'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_rooms_as_user1')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_rooms_as_user2')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    last_activity = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['user1', 'status']),
            models.Index(fields=['user2', 'status']),
            models.Index(fields=['started_at']),
        ]

    def __str__(self):
        return f"Chat: {self.user1.username} <-> {self.user2.username}"


class Message(models.Model):
    STATUS_CHOICES = [
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('seen', 'Seen'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField(max_length=5000)
    message_type = models.CharField(max_length=20, default='text')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='sent')
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['room', 'created_at']),
            models.Index(fields=['sender']),
        ]
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"


class TypingStatus(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='typing_statuses')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='typing_statuses')
    is_typing = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['room', 'user']
        indexes = [
            models.Index(fields=['room', 'is_typing']),
        ]


class ChatReport(models.Model):
    REASON_CHOICES = [
        ('spam', 'Spam'),
        ('harassment', 'Harassment'),
        ('fake_profile', 'Fake Profile'),
        ('abuse', 'Abuse'),
        ('adult_content', 'Adult Content'),
        ('other', 'Other'),
    ]

    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='reports')
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_reports_sent')
    reported_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_reports_received')
    reason = models.CharField(max_length=30, choices=REASON_CHOICES)
    description = models.TextField(blank=True, max_length=1000)
    reviewed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['reporter', 'reviewed']),
            models.Index(fields=['reported_user', 'reviewed']),
        ]
        ordering = ['-created_at']
