from rest_framework import serializers
from .models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'title', 'message', 'data', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ['friend_requests', 'friend_accepted', 'new_message', 'system_message', 'chat_invite']
