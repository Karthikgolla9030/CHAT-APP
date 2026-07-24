import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import ChatRoom, Message, TypingStatus
from matchmaking.models import SkippedUser

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')
        self.room_id = self.scope['url_route']['kwargs']['room_id']

        if not self.user or self.user.is_anonymous:
            await self.close(code=4001)
            return

        self.room = await self.get_room()
        if not self.room or self.user not in [self.room.user1, self.room.user2]:
            await self.close(code=4003)
            return

        self.room_group = f"chat_{self.room_id}"
        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group'):
            await self.channel_layer.group_discard(self.room_group, self.channel_name)

    async def receive_json(self, content):
        msg_type = content.get('type')

        if msg_type == 'chat_message':
            text = content.get('message', '').strip()
            if text:
                msg_obj = await self.save_message(text)
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

        elif msg_type == 'typing':
            is_typing = bool(content.get('is_typing'))
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
                await self.update_message_seen(msg_id)
                await self.channel_layer.group_send(
                    self.room_group,
                    {
                        'type': 'broadcast_seen',
                        'message_id': msg_id,
                        'user_id': self.user.id
                    }
                )

        elif msg_type == 'skip_chat':
            await self.skip_and_end_room()
            await self.channel_layer.group_send(
                self.room_group,
                {
                    'type': 'broadcast_chat_ended',
                    'ended_by': self.user.id
                }
            )

    async def broadcast_message(self, event):
        await self.send_json({'type': 'chat_message', 'message': event['message']})

    async def broadcast_typing(self, event):
        if event['user_id'] != self.user.id:
            await self.send_json({'type': 'typing', 'user_id': event['user_id'], 'is_typing': event['is_typing']})

    async def broadcast_seen(self, event):
        await self.send_json({'type': 'mark_seen', 'message_id': event['message_id'], 'user_id': event['user_id']})

    async def broadcast_chat_ended(self, event):
        await self.send_json({'type': 'chat_ended', 'ended_by': event['ended_by']})

    @database_sync_to_async
    def get_room(self):
        try:
            return ChatRoom.objects.get(id=self.room_id)
        except ChatRoom.DoesNotExist:
            return None

    @database_sync_to_async
    def save_message(self, content):
        msg = Message.objects.create(room=self.room, sender=self.user, content=content)
        self.room.last_activity = timezone.now()
        self.room.save()
        return msg

    @database_sync_to_async
    def update_message_seen(self, msg_id):
        Message.objects.filter(id=msg_id, room=self.room).exclude(sender=self.user).update(status='seen')

    @database_sync_to_async
    def skip_and_end_room(self):
        self.room.status = 'ended'
        self.room.ended_at = timezone.now()
        self.room.save()
        partner = self.room.user2 if self.room.user1 == self.user else self.room.user1
        SkippedUser.objects.get_or_create(user=self.user, skipped_user=partner)
