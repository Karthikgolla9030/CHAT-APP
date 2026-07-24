import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        if self.scope['user'].is_authenticated:
            user = self.scope['user']
            self.group_name = f'user_{user.id}'
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        pass

    async def notification_event(self, event):
        await self.send(text_data=json.dumps({'type': 'notification', 'data': event['data']}))


def send_notification(user_id, notification_type, title, message, data=None):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'user_{user_id}',
        {'type': 'notification_event', 'data': {'notification_type': notification_type, 'title': title, 'message': message, 'data': data or {}}}
    )
