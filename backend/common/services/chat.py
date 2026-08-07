import logging
import time
from django.utils import timezone
from chat.models import ChatRoom, Message
from common.redis_client import get_redis_client

logger = logging.getLogger(__name__)

class ChatService:
    @staticmethod
    def save_message(room, sender, content, message_type='text'):
        """Save a new message in DB for active chat room."""
        if room.status == 'ended':
            raise ValueError("Cannot send message in an ended room.")

        t_start = time.time()
        msg = Message.objects.create(
            room=room,
            sender=sender,
            content=content,
            message_type=message_type,
            status='sent'
        )
        room.last_activity = timezone.now()
        room.save(update_fields=['last_activity'])
        t_end = time.time()
        logger.info(f"[DB_LATENCY] save_message | Room: {room.id} | Sender: {sender.id} | Duration: {(t_end - t_start):.3f}s")
        return msg

    @staticmethod
    def update_message_seen(room, user, message_id):
        """Mark messages as seen by recipient user."""
        updated = Message.objects.filter(id=message_id, room=room).exclude(sender=user).update(status='seen')
        return updated > 0

    @staticmethod
    def set_typing_status(room_id_str, user_id, is_typing):
        """Set user typing status in Redis with 3s TTL."""
        redis_c = get_redis_client()
        key = f"typing:{room_id_str}:{user_id}"
        if is_typing:
            redis_c.set(key, "1", ex=3)
        else:
            redis_c.delete(key)

    @staticmethod
    def is_typing(room_id_str, user_id):
        """Check if user is typing in room from Redis."""
        redis_c = get_redis_client()
        key = f"typing:{room_id_str}:{user_id}"
        return bool(redis_c.get(key))
