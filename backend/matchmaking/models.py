from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class MatchQueue(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='active_queue')
    preferences = models.JSONField(default=dict, blank=True)
    match_mode = models.CharField(max_length=20, default='random')
    is_active = models.BooleanField(default=True)
    entered_at = models.DateTimeField(auto_now_add=True)
    last_searched_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'match_queue'
        indexes = [
            models.Index(fields=['is_active', 'entered_at']),
        ]

    def __str__(self):
        return f"Queue: {self.user.username} ({self.match_mode})"


class MatchHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='matches_as_user1')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='matches_as_user2')
    match_score = models.FloatField(default=0.0)
    matched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'match_history'
        indexes = [
            models.Index(fields=['user1', 'user2']),
            models.Index(fields=['matched_at']),
        ]

    def __str__(self):
        return f"{self.user1.username} <-> {self.user2.username}"


class SkippedUser(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='skips_sent')
    skipped_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='skips_received')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'skipped_users'
        indexes = [
            models.Index(fields=['user', 'skipped_user']),
        ]

    def __str__(self):
        return f"{self.user.username} skipped {self.skipped_user.username}"
