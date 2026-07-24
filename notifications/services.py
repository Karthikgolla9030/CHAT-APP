from .models import Notification, NotificationPreference
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


def create_notification(recipient, notification_type, title, message, data=None):
    preference = NotificationPreference.objects.filter(user=recipient).first()
    if preference:
        field_map = {
            'friend_request': 'friend_requests',
            'friend_accepted': 'friend_accepted',
            'new_message': 'new_message',
            'system_message': 'system_message',
            'chat_invite': 'chat_invite',
        }
        field = field_map.get(notification_type)
        if field and not getattr(preference, field, True):
            return None
    return Notification.objects.create(recipient=recipient, notification_type=notification_type, title=title, message=message, data=data or {})


def get_unread_count(user):
    return Notification.objects.filter(recipient=user, is_read=False).count()
