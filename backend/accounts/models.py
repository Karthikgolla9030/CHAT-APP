from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid

class User(AbstractUser):
    id = models.BigAutoField(primary_key=True)
    is_guest = models.BooleanField(default=False)
    email = models.EmailField(unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'users'
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
        ('anyone', 'Anyone'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    display_name = models.CharField(max_length=100, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    gender = models.CharField(max_length=30, choices=GENDER_CHOICES, default='prefer_not_to_say')
    looking_for = models.CharField(max_length=30, choices=LOOKING_FOR_CHOICES, default='anyone')
    country = models.CharField(max_length=100, blank=True)
    language = models.CharField(max_length=50, default='English')
    online_status = models.CharField(max_length=20, default='offline')
    last_seen = models.DateTimeField(auto_now=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'profiles'
        indexes = [
            models.Index(fields=['online_status']),
            models.Index(fields=['country']),
            models.Index(fields=['language']),
        ]

    def __str__(self):
        return f"Profile of {self.user.username}"


class Interest(models.Model):
    name = models.CharField(max_length=50, unique=True)
    category = models.CharField(max_length=50, default='General')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'interests'
        ordering = ['name']

    def __str__(self):
        return self.name


class UserInterest(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_interests')
    interest = models.ForeignKey(Interest, on_delete=models.CASCADE, related_name='user_links')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_interests'
        unique_together = ('user', 'interest')

    def __str__(self):
        return f"{self.user.username} -> {self.interest.name}"
