import time
import logging
from django.utils import timezone
from django.db.models import Q
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from chat.models import ChatRoom, Message
from friends.models import Friendship
from common.redis_client import get_redis_client
from common.services.presence import PresenceService, STATUS_MATCHED, STATUS_OFFLINE, STATUS_SEARCHING, STATUS_ONLINE

logger = logging.getLogger(__name__)

RECONNECT_TIMEOUT = 30  # 30 seconds grace period for network glitch reconnect

class SessionService:
    @staticmethod
    def create_session(user1, user2, match_score=0.0, room_type='random'):
        """
        Creates an active ChatRoom and registers session in Redis.
        Random chats always create a new ChatRoom(room_type='random').
        Friend chats get or create a dedicated permanent ChatRoom(room_type='friend').
        Both users reference the exact same room_id.
        """
        u1, u2 = (user1, user2) if user1.id < user2.id else (user2, user1)
        
        if room_type == 'random':
            # Create a brand new random chat room for this random encounter
            room = ChatRoom.objects.create(
                user1=u1,
                user2=u2,
                room_type='random',
                status='active'
            )
        else:
            # Dedicated permanent friend conversation
            room, _ = ChatRoom.objects.get_or_create(
                user1=u1,
                user2=u2,
                room_type='friend',
                defaults={'status': 'active'}
            )
            if room.status != 'active':
                room.status = 'active'
                room.ended_at = None
                room.save()

        redis_c = get_redis_client()
        room_id_str = str(room.id)

        # Store room details in Redis
        session_data = {
            'room_id': room_id_str,
            'user1_id': u1.id,
            'user2_id': u2.id,
            'room_type': room.room_type,
            'status': 'active',
            'created_at': time.time(),
            'match_score': match_score
        }
        redis_c.hset(f"session:{room_id_str}", mapping=session_data)

        # Map both users to this active session
        redis_c.set(f"user_session:{u1.id}", room_id_str, ex=86400)
        redis_c.set(f"user_session:{u2.id}", room_id_str, ex=86400)

        # Update presence for both
        PresenceService.set_presence(u1.id, STATUS_MATCHED, room_id=room_id_str)
        PresenceService.set_presence(u2.id, STATUS_MATCHED, room_id=room_id_str)

        return room

    @staticmethod
    def get_user_active_room_id(user_id):
        """Get current active room_id for user from Redis."""
        redis_c = get_redis_client()
        return redis_c.get(f"user_session:{user_id}")

    @staticmethod
    def end_session(room_id_str, ended_by_user_id=None, reason='skip'):
        """
        Atomically end an active session:
        1. Acquire Redis lock to prevent dual-skip race conditions
        2. Set ChatRoom.status = 'ended'
        3. Delete Redis keys for room and users
        4. Delete temporary messages IF room is a random chat
        5. Broadcast 'chat_ended' to the WS room group AND individual user groups
        6. Clear presence state
        """
        redis_c = get_redis_client()
        lock_key = f"session_end_lock:{room_id_str}"
        acquired = redis_c.set(lock_key, "1", nx=True, ex=5)
        if not acquired:
            # Another request is executing teardown concurrently
            return None

        try:
            try:
                room = ChatRoom.objects.get(id=room_id_str)
            except ChatRoom.DoesNotExist:
                return None

            if room.status == 'ended':
                # Already ended
                return room

            room.status = 'ended'
            room.ended_at = timezone.now()
            room.save()

            u1_id = room.user1_id
            u2_id = room.user2_id

            # Clean Redis keys
            redis_c.delete(f"session:{room_id_str}")
            redis_c.delete(f"user_session:{u1_id}")
            redis_c.delete(f"user_session:{u2_id}")
            redis_c.delete(f"reconnect_pending:{room_id_str}:{u1_id}")
            redis_c.delete(f"reconnect_pending:{room_id_str}:{u2_id}")
            redis_c.delete(f"typing:{room_id_str}:{u1_id}")
            redis_c.delete(f"typing:{room_id_str}:{u2_id}")

            # Purge temporary messages IF random chat
            if room.room_type == 'random':
                Message.objects.filter(room=room).delete()
                logger.info(f"Purged temporary messages for random chat room {room_id_str}")

            # Broadcast WS event to room group AND individual user groups so BOTH clients terminate synchronously
            try:
                channel_layer = get_channel_layer()
                if channel_layer:
                    ended_payload = {
                        'type': 'broadcast_chat_ended',
                        'room_id': room_id_str,
                        'ended_by': ended_by_user_id,
                        'reason': reason
                    }
                    async_to_sync(channel_layer.group_send)(f"chat_{room_id_str}", ended_payload)

                    user_notice = {
                        'type': 'match_notification',
                        'data': {
                            'type': 'chat_ended',
                            'room_id': room_id_str,
                            'ended_by': ended_by_user_id,
                            'reason': reason
                        }
                    }
                    async_to_sync(channel_layer.group_send)(f"user_{u1_id}", user_notice)
                    async_to_sync(channel_layer.group_send)(f"user_{u2_id}", user_notice)

            except Exception as e:
                logger.error(f"Error broadcasting chat_ended for room {room_id_str}: {e}")

            # Reset presence
            PresenceService.set_presence(u1_id, STATUS_ONLINE)
            PresenceService.set_presence(u2_id, STATUS_ONLINE)

            return room

        finally:
            try:
                redis_c.delete(lock_key)
            except Exception:
                pass

    @staticmethod
    def handle_disconnect(room_id_str, user_id):
        """
        Handle unexpected WS disconnection.
        Sets a 30s grace period. If user does not reconnect within 30s, end session.
        """
        redis_c = get_redis_client()
        active_room = redis_c.get(f"user_session:{user_id}")
        if not active_room or active_room != str(room_id_str):
            return

        key = f"reconnect_pending:{room_id_str}:{user_id}"
        redis_c.set(key, str(time.time()), ex=RECONNECT_TIMEOUT)
        PresenceService.set_presence(user_id, STATUS_OFFLINE, room_id=room_id_str)

        # Broadcast disconnect alert to partner in the room
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                group_name = f"chat_{room_id_str}"
                async_to_sync(channel_layer.group_send)(
                    group_name,
                    {
                        'type': 'broadcast_partner_disconnected',
                        'disconnected_user_id': user_id,
                        'grace_period_seconds': RECONNECT_TIMEOUT
                    }
                )
        except Exception as e:
            logger.error(f"Error broadcasting disconnect alert for room {room_id_str}: {e}")

    @staticmethod
    def handle_reconnect(room_id_str, user_id):
        """
        Handle user reconnection within 30s.
        Cancels pending disconnect and notifies partner.
        """
        redis_c = get_redis_client()
        key = f"reconnect_pending:{room_id_str}:{user_id}"
        was_pending = redis_c.delete(key)

        PresenceService.set_presence(user_id, STATUS_MATCHED, room_id=room_id_str)

        if was_pending:
            try:
                channel_layer = get_channel_layer()
                if channel_layer:
                    group_name = f"chat_{room_id_str}"
                    async_to_sync(channel_layer.group_send)(
                        group_name,
                        {
                            'type': 'broadcast_partner_reconnected',
                            'reconnected_user_id': user_id
                        }
                    )
            except Exception as e:
                logger.error(f"Error broadcasting reconnect alert for room {room_id_str}: {e}")

        return True
