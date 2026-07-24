import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from .models import MatchQueue
from .services import find_match_for_user, execute_match

class MatchmakingConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')
        if not self.user or self.user.is_anonymous:
            await self.close(code=4001)
            return

        self.user_group = f"user_{self.user.id}"
        await self.channel_layer.group_add(self.user_group, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'user_group'):
            await self.channel_layer.group_discard(self.user_group, self.channel_name)
            await self.leave_queue_db()

    async def receive_json(self, content):
        msg_type = content.get('type')

        if msg_type == 'join_queue':
            filters = content.get('filters', {})
            await self.join_queue_db(filters)
            await self.send_json({'type': 'queue_joined', 'status': 'searching'})

            # Attempt instant match search
            partner, score, common_interests = await database_sync_to_async(find_match_for_user)(self.user, filters)
            if partner:
                room = await database_sync_to_async(execute_match)(self.user, partner, score)
                
                # Broadcast match_found to both users via group channels
                match_data = {
                    'type': 'match_found',
                    'room_id': str(room.id),
                    'partner': {
                        'id': partner.id,
                        'username': partner.username,
                        'display_name': getattr(partner.profile, 'display_name', partner.username),
                        'avatar': partner.profile.avatar.url if partner.profile.avatar else None,
                    },
                    'common_interests': common_interests
                }
                
                partner_match_data = {
                    'type': 'match_found',
                    'room_id': str(room.id),
                    'partner': {
                        'id': self.user.id,
                        'username': self.user.username,
                        'display_name': getattr(self.user.profile, 'display_name', self.user.username),
                        'avatar': self.user.profile.avatar.url if self.user.profile.avatar else None,
                    },
                    'common_interests': common_interests
                }

                await self.channel_layer.group_send(f"user_{self.user.id}", {'type': 'match_notification', 'data': match_data})
                await self.channel_layer.group_send(f"user_{partner.id}", {'type': 'match_notification', 'data': partner_match_data})

        elif msg_type == 'leave_queue':
            await self.leave_queue_db()
            await self.send_json({'type': 'queue_left', 'status': 'idle'})

    async def match_notification(self, event):
        await self.send_json(event['data'])

    @database_sync_to_async
    def join_queue_db(self, preferences):
        MatchQueue.objects.update_or_create(
            user=self.user,
            defaults={'preferences': preferences, 'is_active': True}
        )

    @database_sync_to_async
    def leave_queue_db(self):
        MatchQueue.objects.filter(user=self.user).delete()
