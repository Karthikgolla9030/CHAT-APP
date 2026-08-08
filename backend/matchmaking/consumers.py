import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from common.services.matchmaking import MatchmakingService
from common.services.presence import PresenceService, STATUS_SEARCHING, STATUS_ONLINE

class MatchmakingConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')
        if not self.user or self.user.is_anonymous:
            await self.close(code=4001)
            return

        self.user_group = f"user_{self.user.id}"
        await self.channel_layer.group_add(self.user_group, self.channel_name)
        await self.accept()
        await database_sync_to_async(PresenceService.set_presence)(self.user.id, STATUS_ONLINE)

    async def disconnect(self, close_code):
        if hasattr(self, 'user_group'):
            await self.channel_layer.group_discard(self.user_group, self.channel_name)
            await self.leave_queue_db()

    async def receive_json(self, content):
        msg_type = content.get('type')

        if msg_type in ['join_queue', 'update_queue_preferences']:
            filters = content.get('filters', {})
            await self.send_json({'type': 'queue_joined', 'status': 'searching'})

            # Execute thread-safe match search using MatchmakingService
            partner, score, common_interests, room = await database_sync_to_async(
                MatchmakingService.find_and_execute_match
            )(self.user, filters)

            if partner and room:
                room_id_str = str(room.id)
                
                # Fetch profiles safely in async context to prevent SynchronousOnlyOperation
                partner_profile, user_profile = await database_sync_to_async(
                    lambda: (getattr(partner, 'profile', None), getattr(self.user, 'profile', None))
                )()

                match_data_me = {
                    'type': 'match_found',
                    'room_id': room_id_str,
                    'partner': {
                        'id': partner.id,
                        'username': partner.username,
                        'display_name': getattr(partner_profile, 'display_name', partner.username) if partner_profile else partner.username,
                        'avatar': partner_profile.avatar.url if partner_profile and partner_profile.avatar else None,
                    },
                    'common_interests': common_interests
                }

                match_data_partner = {
                    'type': 'match_found',
                    'room_id': room_id_str,
                    'partner': {
                        'id': self.user.id,
                        'username': self.user.username,
                        'display_name': getattr(user_profile, 'display_name', self.user.username) if user_profile else self.user.username,
                        'avatar': user_profile.avatar.url if user_profile and user_profile.avatar else None,
                    },
                    'common_interests': common_interests
                }

                # Send WS notification to both users
                await self.channel_layer.group_send(
                    f"user_{self.user.id}",
                    {'type': 'match_notification', 'data': match_data_me}
                )
                await self.channel_layer.group_send(
                    f"user_{partner.id}",
                    {'type': 'match_notification', 'data': match_data_partner}
                )

        elif msg_type == 'leave_queue':
            await self.leave_queue_db()
            await self.send_json({'type': 'queue_left', 'status': 'idle'})

    async def match_notification(self, event):
        await self.send_json(event['data'])

    async def presence_update(self, event):
        await self.send_json({'type': 'presence_update', 'data': event['data']})

    @database_sync_to_async
    def leave_queue_db(self):
        MatchmakingService.leave_queue(self.user)
