from django.contrib import admin
from django.db.models import Q
from .models import Notification, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['recipient', 'notification_type', 'title', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['recipient__username', 'title', 'message']


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'friend_requests', 'friend_accepted', 'new_message', 'system_message', 'chat_invite']
    list_filter = ['friend_requests', 'friend_accepted', 'new_message', 'system_message', 'chat_invite']
