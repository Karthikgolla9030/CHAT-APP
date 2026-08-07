import time
import json
import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from accounts.models import Profile
from common.redis_client import get_redis_client

logger = logging.getLogger(__name__)

STATUS_SEARCHING = 'searching'
STATUS_MATCHED = 'matched'
STATUS_TYPING = 'typing'
STATUS_ONLINE = 'online'
STATUS_OFFLINE = 'offline'
STATUS_DISCONNECTED = 'disconnected'

class PresenceService:
    @staticmethod
    def set_presence(user_id, status, room_id=None, ttl=120):
        """
        Set user presence state in Redis and trigger DB update/channel broadcast.
        Valid statuses: searching, matched, typing, online, offline, disconnected
        """
        redis_c = get_redis_client()
        key = f"presence:{user_id}"
        data = {
            'user_id': str(user_id),
            'status': status,
            'room_id': str(room_id) if room_id else '',
            'updated_at': time.time()
        }
        redis_c.hset(key, mapping=data)
        redis_c.expire(key, ttl)

        # Sync profile status in DB asynchronously / in-process
        try:
            db_status = 'online' if status in [STATUS_SEARCHING, STATUS_MATCHED, STATUS_TYPING, STATUS_ONLINE] else 'offline'
            Profile.objects.filter(user_id=user_id).update(online_status=db_status)
        except Exception as e:
            logger.error(f"Error updating DB profile presence for user {user_id}: {e}")

        # Broadcast via channel layer if notification consumer exists
        PresenceService.broadcast_presence(user_id, status, room_id)

    @staticmethod
    def get_presence(user_id):
        """Get presence data dict for a user from Redis."""
        redis_c = get_redis_client()
        key = f"presence:{user_id}"
        data = redis_c.hgetall(key)
        if not data:
            return {'user_id': str(user_id), 'status': STATUS_OFFLINE, 'room_id': '', 'updated_at': 0}
        return data

    @staticmethod
    def clear_presence(user_id):
        """Remove user presence from Redis and set offline in DB."""
        redis_c = get_redis_client()
        key = f"presence:{user_id}"
        redis_c.delete(key)
        try:
            Profile.objects.filter(user_id=user_id).update(online_status='offline')
        except Exception as e:
            logger.error(f"Error clearing presence for user {user_id}: {e}")
        PresenceService.broadcast_presence(user_id, STATUS_OFFLINE)

    @staticmethod
    def broadcast_presence(user_id, status, room_id=None):
        """Broadcast presence update to the user's notification group."""
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                group_name = f"user_{user_id}"
                async_to_sync(channel_layer.group_send)(
                    group_name,
                    {
                        'type': 'presence_update',
                        'data': {
                            'user_id': user_id,
                            'status': status,
                            'room_id': str(room_id) if room_id else None
                        }
                    }
                )
        except Exception as e:
            logger.debug(f"Could not broadcast presence update for user {user_id}: {e}")
