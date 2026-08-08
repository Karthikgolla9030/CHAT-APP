import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer

class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')
        if not self.user or self.user.is_anonymous:
            await self.close(code=4001)
            return

        self.user_group = f"notifications_{self.user.id}"
        await self.channel_layer.group_add(self.user_group, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'user_group'):
            await self.channel_layer.group_discard(self.user_group, self.channel_name)

    async def send_notification(self, event):
        await self.send_json({'type': 'notification', 'data': event['data']})

    async def match_notification(self, event):
        await self.send_json(event['data'])

    async def receive_json(self, content):
        msg_type = content.get('type')
        if msg_type == 'mark_delivered':
            message_id = content.get('message_id')
            room_id = content.get('room_id')
            if message_id and room_id:
                from chat.models import Message
                from channels.db import database_sync_to_async
                
                @database_sync_to_async
                def update_delivered():
                    updated = Message.objects.filter(
                        id=message_id, 
                        status='sent'
                    ).exclude(sender=self.user).update(status='delivered')
                    return updated > 0
                
                success = await update_delivered()
                if success:
                    # Broadcast back to the chat room so the sender sees ✓✓
                    await self.channel_layer.group_send(
                        f"chat_{room_id}",
                        {
                            'type': 'broadcast_delivered',
                            'message_id': message_id,
                            'user_id': self.user.id
                        }
                    )
