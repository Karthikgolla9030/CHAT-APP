import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import ChatRoom, Message
from common.services.session import SessionService
from common.services.chat import ChatService
from common.services.presence import PresenceService, STATUS_MATCHED, STATUS_OFFLINE

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')
        self.room_id_str = str(self.scope['url_route']['kwargs']['room_id'])
        self.explicit_disconnect = False

        if not self.user or self.user.is_anonymous:
            await self.close(code=4001)
            return

        self.room = await self.get_room()
        is_member = await self.check_membership()
        if not self.room or not is_member:
            await self.close(code=4003)
            return

        self.room_group = f"chat_{self.room_id_str}"
        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

        # Handle potential reconnection within 30s grace period
        await database_sync_to_async(SessionService.handle_reconnect)(self.room_id_str, self.user.id)

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group'):
            await self.channel_layer.group_discard(self.room_group, self.channel_name)

        if not self.explicit_disconnect and hasattr(self, 'room_id_str') and hasattr(self, 'user') and self.user.id:
            # Trigger 30-second reconnection grace period for unexpected disconnects
            await database_sync_to_async(SessionService.handle_disconnect)(self.room_id_str, self.user.id)

    async def receive_json(self, content):
        msg_type = content.get('type')

        if msg_type == 'chat_message':
            text = content.get('message', '').strip()
            if text:
                try:
                    msg_obj = await database_sync_to_async(ChatService.save_message)(self.room, self.user, text)
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

        elif msg_type == 'skip_chat':
            self.explicit_disconnect = True
            await database_sync_to_async(SessionService.end_session)(
                self.room_id_str, ended_by_user_id=self.user.id, reason='skip'
            )

    async def broadcast_message(self, event):
        msg = event['message']
        if isinstance(msg, dict) and '_type' in msg:
            await self.send_json({'type': msg['_type'], 'data': msg})
        else:
            await self.send_json({'type': 'chat_message', 'message': msg})

    async def broadcast_typing(self, event):
        if event['user_id'] != self.user.id:
            await self.send_json({'type': 'typing', 'user_id': event['user_id'], 'is_typing': event['is_typing']})

    async def broadcast_seen(self, event):
        await self.send_json({'type': 'mark_seen', 'message_id': event['message_id'], 'user_id': event['user_id']})

    async def broadcast_chat_ended(self, event):
        await self.send_json({
            'type': 'chat_ended',
            'ended_by': event.get('ended_by'),
            'reason': event.get('reason', 'skip')
        })

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
