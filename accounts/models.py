from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
import uuid


class User(AbstractUser):
    is_guest = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['username']),
        ]

    def __str__(self):
        return self.username


class Profile(models.Model):
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('non_binary', 'Non-Binary'),
        ('other', 'Other'),
        ('prefer_not_to_say', 'Prefer not to say'),
    ]
    LOOKING_FOR_CHOICES = [
        ('friends', 'Friends'),
        ('casual', 'Casual Chat'),
        ('serious', 'Serious Relationship'),
        ('anything', 'Anything'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    username = models.CharField(max_length=30, unique=True, blank=True, null=True)
    display_name = models.CharField(max_length=100, blank=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    gender = models.CharField(max_length=30, choices=GENDER_CHOICES, default='prefer_not_to_say')
    looking_for = models.CharField(max_length=30, choices=LOOKING_FOR_CHOICES, default='anything')
    country = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    languages = models.JSONField(default=list, blank=True)
    interests = models.JSONField(default=list, blank=True)
    bio = models.TextField(blank=True, max_length=500)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    online_status = models.CharField(max_length=20, default='offline')
    last_seen = models.DateTimeField(auto_now=True)
    favorite_topics = models.JSONField(default=list, blank=True)
    skill_tags = models.JSONField(default=list, blank=True)
    hobbies = models.JSONField(default=list, blank=True)
    profile_completion = models.PositiveIntegerField(default=0)
    is_banned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['online_status']),
            models.Index(fields=['country']),
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return self.username or self.user.username

    def save(self, *args, **kwargs):
        from core.utils import calculate_profile_completion
        self.profile_completion = calculate_profile_completion(self)
        if not self.username:
            from core.utils import generate_guest_username
            self.username = generate_guest_username()
        super().save(*args, **kwargs)


class GuestConversion(models.Model):
    guest_user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='guest_conversion')
    temp_email = models.EmailField(blank=True)
    converted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Conversion for {self.guest_user.username}"


class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)

    def __str__(self):
        return f"Reset token for {self.user.username}"
