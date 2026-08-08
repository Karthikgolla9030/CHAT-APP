import json
import time
import uuid
import logging
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import ChatRoom, Message
from common.services.session import SessionService
from common.services.chat import ChatService
from common.services.presence import PresenceService, STATUS_MATCHED, STATUS_OFFLINE
from common.redis_client import get_redis_client

logger = logging.getLogger(__name__)

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')
        self.room_id_str = str(self.scope['url_route']['kwargs']['room_id'])
        self.explicit_disconnect = False
        self.socket_id = str(uuid.uuid4())
        self.connect_time = time.time()

        if not self.user or self.user.is_anonymous:
            logger.info(f"[WS_CONNECT_REJECT] Socket ID: {self.socket_id} | Reason: Anonymous")
            await self.close(code=4001)
            return

        self.room = await self.get_room()
        is_member = await self.check_membership()
        if not self.room or not is_member:
            logger.info(f"[WS_CONNECT_REJECT] Socket ID: {self.socket_id} | User ID: {self.user.id} | Room ID: {self.room_id_str} | Reason: Not a member or room ended")
            await self.close(code=4003)
            return

        self.room_group = f"chat_{self.room_id_str}"
        
        # Track socket count
        redis_c = get_redis_client()
        redis_c.sadd(f"debug_user_sockets:{self.user.id}", self.socket_id)
        redis_c.sadd(f"debug_room_sockets:{self.room_id_str}", self.socket_id)
        user_socket_count = redis_c.scard(f"debug_user_sockets:{self.user.id}")
        room_socket_count = redis_c.scard(f"debug_room_sockets:{self.room_id_str}")

        logger.info(f"[GROUP_ADD] Timestamp: {time.time():.3f} | User ID: {self.user.id} | Channel Name: {self.channel_name} | Group Name: {self.room_group} | Room ID: {self.room_id_str} | Event Type: connect")
        logger.info(f"[WS_CONNECT] Socket ID: {self.socket_id} | User ID: {self.user.id} | Room ID: {self.room_id_str} | Connection Time: {self.connect_time:.3f} | Total active sockets for that user: {user_socket_count} | Total sockets in that room: {room_socket_count}")

        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

        await self.channel_layer.group_send(
            self.room_group,
            {
                'type': 'broadcast_partner_reconnected',
                'reconnected_user_id': self.user.id
            }
        )

        # Handle potential reconnection within 30s grace period
        await database_sync_to_async(SessionService.handle_reconnect)(self.room_id_str, self.user.id)

    async def disconnect(self, close_code):
        duration = time.time() - getattr(self, 'connect_time', time.time())
        logger.info(f"[WS_DISCONNECT] Socket ID: getattr(self, 'socket_id', 'unknown') | Reason: disconnect | Close Code: {close_code} | Duration: {duration:.3f}s")
        
        if hasattr(self, 'user') and self.user.id:
            redis_c = get_redis_client()
            redis_c.srem(f"debug_user_sockets:{self.user.id}", getattr(self, 'socket_id', ''))
            if hasattr(self, 'room_id_str'):
                redis_c.srem(f"debug_room_sockets:{self.room_id_str}", getattr(self, 'socket_id', ''))
        
        if hasattr(self, 'room_group'):
            logger.info(f"[GROUP_DISCARD] Timestamp: {time.time():.3f} | User ID: {getattr(self.user, 'id', 'unknown')} | Channel Name: {self.channel_name} | Group Name: {self.room_group} | Room ID: {getattr(self, 'room_id_str', 'unknown')} | Event Type: disconnect")
            
            await self.channel_layer.group_send(
                self.room_group,
                {
                    'type': 'broadcast_partner_disconnected',
                    'disconnected_user_id': self.user.id,
                    'grace_period_seconds': 0
                }
            )
            
            await self.channel_layer.group_discard(self.room_group, self.channel_name)

        if not self.explicit_disconnect and hasattr(self, 'room_id_str') and hasattr(self, 'user') and self.user.id:
            # Trigger 30-second reconnection grace period for unexpected disconnects
            await database_sync_to_async(SessionService.handle_disconnect)(self.room_id_str, self.user.id)

    async def send_json(self, content, close=False):
        logger.info(f"[WS_OUTGOING] Socket ID: {getattr(self, 'socket_id', 'unknown')} | Channel Name: {self.channel_name} | Room ID: {getattr(self, 'room_id_str', 'unknown')} | Receiver User ID: {getattr(self.user, 'id', 'unknown')} | Event Type: {content.get('type')} | Timestamp: {time.time():.3f}")
        return await super().send_json(content, close=close)

    async def receive_json(self, content):
        msg_type = content.get('type')
        logger.info(f"[WS_INCOMING] Socket ID: {self.socket_id} | Channel Name: {self.channel_name} | Room ID: {self.room_id_str} | User ID: {self.user.id} | Message ID: N/A | Event Type: {msg_type} | Timestamp: {time.time():.3f}")

        if msg_type == 'chat_message':
            text = content.get('message', '').strip()
            if text:
                try:
                    logger.info(f"[FLOW_TRACE] receive_json -> save_message | Room: {self.room_id_str} | Timestamp: {time.time():.3f}")
                    msg_obj = await database_sync_to_async(ChatService.save_message)(self.room, self.user, text)
                    logger.info(f"[FLOW_TRACE] save_message -> group_send | Room: {self.room_id_str} | Timestamp: {time.time():.3f}")
                    logger.info(f"[GROUP_SEND] Timestamp: {time.time():.3f} | User ID: {self.user.id} | Channel Name: {self.channel_name} | Group Name: {self.room_group} | Room ID: {self.room_id_str} | Event Type: broadcast_message")
                    await self.channel_layer.group_send(
                        self.room_group,
                        {
                            'type': 'broadcast_message',
                            'message': {
                                'id': str(msg_obj.id),
                                'sender_id': self.user.id,
                                'sender_name': self.user.username,
                                'content': msg_obj.content,
                                'status': msg_obj.status,
                                'created_at': msg_obj.created_at.isoformat(),
                            }
                        }
                    )
                except ValueError as exc:
                    await self.send_json({'type': 'error', 'detail': str(exc)})

        elif msg_type == 'typing':
            is_typing = bool(content.get('is_typing'))
            await database_sync_to_async(ChatService.set_typing_status)(self.room_id_str, self.user.id, is_typing)
            await self.channel_layer.group_send(
                self.room_group,
                {
                    'type': 'broadcast_typing',
                    'user_id': self.user.id,
                    'is_typing': is_typing
                }
            )

        elif msg_type == 'mark_seen':
            msg_id = content.get('message_id')
            if msg_id:
                await database_sync_to_async(ChatService.update_message_seen)(self.room, self.user, msg_id)
                await self.channel_layer.group_send(
                    self.room_group,
                    {
                        'type': 'broadcast_seen',
                        'message_id': msg_id,
                        'user_id': self.user.id
                    }
                )
                
        elif msg_type == 'mark_all_seen':
            await database_sync_to_async(ChatService.update_all_messages_seen)(self.room, self.user)
            await self.channel_layer.group_send(
                self.room_group,
                {
                    'type': 'broadcast_all_seen',
                    'user_id': self.user.id
                }
            )

        elif msg_type == 'skip_chat':
            logger.info(f"[FLOW_TRACE_SKIP] Frontend click -> receive_json | Socket: {self.socket_id} | Timestamp: {time.time():.3f}")
            self.explicit_disconnect = True
            await database_sync_to_async(SessionService.end_session)(
                self.room_id_str, ended_by_user_id=self.user.id, reason='skip'
            )

    async def broadcast_message(self, event):
        msg = event['message']
        logger.info(f"[FLOW_TRACE] broadcast_message -> send_json | Room: {self.room_id_str} | Receiver: {self.user.id} | Timestamp: {time.time():.3f}")
        if isinstance(msg, dict) and '_type' in msg:
            await self.send_json({'type': msg['_type'], 'data': msg})
        else:
            await self.send_json({'type': 'chat_message', 'message': msg})

    async def broadcast_typing(self, event):
        if event['user_id'] != self.user.id:
            await self.send_json({'type': 'typing', 'user_id': event['user_id'], 'is_typing': event['is_typing']})

    async def broadcast_seen(self, event):
        await self.send_json({'type': 'mark_seen', 'message_id': event['message_id'], 'user_id': event['user_id']})

    async def broadcast_delivered(self, event):
        await self.send_json({'type': 'mark_delivered', 'message_id': event['message_id'], 'user_id': event['user_id']})

    async def broadcast_all_seen(self, event):
        await self.send_json({'type': 'mark_all_seen', 'user_id': event['user_id']})

    async def broadcast_chat_ended(self, event):
        logger.info(f"[FLOW_TRACE_SKIP] broadcast_chat_ended -> send_json | Socket: {self.socket_id} | Timestamp: {time.time():.3f}")
        await self.send_json({
            'type': 'chat_ended',
            'ended_by': event.get('ended_by'),
            'reason': event.get('reason', 'skip')
        })
        logger.info(f"[FLOW_TRACE_SKIP] send_json -> close() | Socket: {self.socket_id} | Timestamp: {time.time():.3f}")
        await self.close(code=4003)

    async def broadcast_partner_disconnected(self, event):
        if event['disconnected_user_id'] != self.user.id:
            await self.send_json({
                'type': 'partner_disconnected',
                'disconnected_user_id': event['disconnected_user_id'],
                'grace_period_seconds': event['grace_period_seconds']
            })

    async def broadcast_partner_reconnected(self, event):
        if event['reconnected_user_id'] != self.user.id:
            await self.send_json({
                'type': 'partner_reconnected',
                'reconnected_user_id': event['reconnected_user_id']
            })

    @database_sync_to_async
    def get_room(self):
        try:
            return ChatRoom.objects.get(id=self.room_id_str)
        except Exception:
            return None

    @database_sync_to_async
    def check_membership(self):
        if not self.room or not self.user or self.user.is_anonymous:
            return False
        if self.user.id not in [self.room.user1_id, self.room.user2_id]:
            return False
        if self.room.status == 'ended' and self.room.room_type == 'random':
            return False
        return True
