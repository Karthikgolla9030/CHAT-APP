import json
import random
import asyncio
from datetime import datetime
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import ChatRoom, Message, TypingStatus
from matching.models import MatchHistory
from accounts.models import Profile
from core.constants import CONVERSATION_STARTERS
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class MatchConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        if self.scope['user'].is_authenticated:
            self.user = self.scope['user']
            self.group_name = f'match_{self.user.id}'
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
            await self.send(text_data=json.dumps({
                'type': 'connected',
                'message': 'Ready to match'
            }))
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await self.leave_queue()

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            msg_type = data.get('type')

            if msg_type == 'join_queue':
                await self.join_queue(data.get('preferences', {}))
            elif msg_type == 'leave_queue':
                await self.leave_queue()
            elif msg_type == 'skip_chat':
                await self.handle_skip(data.get('room_id'))
        except Exception as e:
            logger.error(f"Match consumer error: {e}")

    async def join_queue(self, preferences):
        queue, created = await self.get_or_create_queue(self.user, preferences)
        await self.send(text_data=json.dumps({
            'type': 'queued',
            'message': 'Searching for your best match...',
            'queue_position': await self.get_queue_position()
        }))

        await asyncio.sleep(1)
        partner = await self.find_match(self.user)
        if partner:
            room = await self.create_chat_room(self.user, partner)
            await self.channel_layer.group_send(
                f'match_{partner.id}',
                {
                    'type': 'match_found',
                    'room_id': str(room.id),
                    'partner_id': str(self.user.id),
                    'partner_name': self.user.username,
                    'common_interests': await self.get_common_interests(self.user, partner)
                }
            )
            await self.send(text_data=json.dumps({
                'type': 'match_found',
                'room_id': str(room.id),
                'partner_id': str(partner.id),
                'partner_name': partner.username,
                'common_interests': await self.get_common_interests(self.user, partner)
            }))
        else:
            await self.send(text_data=json.dumps({
                'type': 'searching',
                'message': 'Searching among online users...',
                'phase': 'finding'
            }))

    async def leave_queue(self):
        await self.remove_from_queue(self.user)
        await self.send(text_data=json.dumps({
            'type': 'left_queue',
            'message': 'You left the queue'
        }))

    async def handle_skip(self, room_id):
        room = await self.get_room(room_id)
        if not room:
            return

        other_user = room.user2 if room.user1_id == self.user.id else room.user1
        room.status = 'ended'
        await self.save_room(room)

        await self.record_recent_match(self.user.id, other_user.id)
        await self.record_recent_match(other_user.id, self.user.id)

        await self.channel_layer.group_send(
            f'match_{other_user.id}',
            {
                'type': 'chat_ended',
                'message': 'The other user ended the chat',
                'reason': 'skipped'
            }
        )

        await self.send(text_data=json.dumps({
            'type': 'chat_ended',
            'message': 'Chat ended',
            'reason': 'skipped'
        }))

    async def match_found(self, event):
        await self.send(text_data=json.dumps({
            'type': 'match_found',
            'room_id': event['room_id'],
            'partner_id': event['partner_id'],
            'partner_name': event['partner_name'],
            'common_interests': event['common_interests']
        }))

    async def chat_ended(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_ended',
            'message': event['message'],
            'reason': event.get('reason', 'ended')
        }))

    @database_sync_to_async
    def get_or_create_queue(self, user, preferences):
        return MatchQueue.objects.get_or_create(
            user=user,
            defaults={'preferences': preferences, 'match_mode': 'random', 'is_active': True}
        )

    @database_sync_to_async
    def remove_from_queue(self, user):
        MatchQueue.objects.filter(user=user).delete()

    @database_sync_to_async
    def get_queue_position(self):
        return MatchQueue.objects.filter(is_active=True).count()

    async def find_match(self, user):
        recent = await self.get_recent_matches(user.id)
        queue = MatchQueue.objects.filter(is_active=True).exclude(user=user)
        if not queue.exists():
            return None

        candidates = []
        for q in queue:
            partner = q.user
            if partner.id in recent:
                continue
            score = self.calculate_score(user, partner, q.preferences)
            candidates.append((partner, score))

        if not candidates:
            return None

        candidates.sort(key=lambda x: x[1], reverse=True)
        best_partner, best_score = candidates[0]

        if best_score >= 0.0:
            MatchQueue.objects.filter(user__in=[user, best_partner]).delete()
            return best_partner
        return None

    @database_sync_to_async
    def create_chat_room(self, user1, user2):
        u1 = min(user1, user2, key=lambda u: u.id)
        u2 = max(user1, user2, key=lambda u: u.id)
        room, _ = ChatRoom.objects.get_or_create(user1=u1, user2=u2, defaults={'status': 'active'})
        return room

    @database_sync_to_async
    def get_room(self, room_id):
        try:
            return ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return None

    @database_sync_to_async
    def save_room(self, room):
        room.save()

    @database_sync_to_async
    def get_common_interests(self, user1, user2):
        p1 = user1.profile
        p2 = user2.profile
        i1 = set(x.lower() for x in p1.interests) if p1.interests else set()
        i2 = set(x.lower() for x in p2.interests) if p2.interests else set()
        return list(i1 & i2)[:8]

    @database_sync_to_async
    def get_recent_matches(self, user_id):
        history = MatchHistory.objects.filter(
            user1_id=user_id
        ).order_by('-matched_at').values_list('user2_id', flat=True)[:20]
        return list(history)

    @database_sync_to_async
    def record_recent_match(self, user_id, partner_id):
        MatchHistory.objects.create(user1_id=user_id, user2_id=partner_id, match_score=0.0)

    def calculate_score(self, user1, user2, prefs):
        score = 0.0
        p2 = user2.profile
        looking_for = prefs.get('looking_for', '')
        location = prefs.get('location', '')
        interests = prefs.get('interests', '')

        if looking_for and looking_for != 'anyone':
            if looking_for == p2.gender:
                score += 0.4
            else:
                score -= 0.6

        if location:
            if location.lower() in (p2.state or '').lower() or (p2.state or '').lower() in location.lower():
                score += 0.3

        if interests:
            my_interests = set(x.strip().lower() for x in interests.split(',') if x.strip())
            partner_interests = set(x.lower() for x in p2.interests) if p2.interests else set()
            overlap = len(my_interests & partner_interests)
            if overlap > 0:
                score += min(0.5, overlap * 0.15)

        return max(0.0, min(1.0, score + random.uniform(-0.05, 0.05)))


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs'].get('room_id')
        self.room_group_name = f'chat_{self.room_id}'

        if self.scope['user'].is_authenticated:
            self.user = self.scope['user']
            room = await self.get_room(self.room_id)
            if room and self.user.id in [room.user1_id, room.user2_id]:
                await self.channel_layer.group_add(self.room_group_name, self.channel_name)
                await self.accept()
                await self.mark_messages_read(room, self.user)
                await self.send(text_data=json.dumps({
                    'type': 'connected',
                    'room_id': str(room.id)
                }))
            else:
                await self.close()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            msg_type = data.get('type')

            if msg_type == 'message':
                await self.handle_message(data.get('content', ''))
            elif msg_type == 'typing':
                await self.handle_typing(data.get('is_typing', False))
            elif msg_type == 'seen':
                await self.handle_seen(data.get('message_id'))
            elif msg_type == 'end_chat':
                await self.handle_end_chat()
            elif msg_type == 'skip':
                await self.handle_skip()
            elif msg_type == 'add_friend':
                await self.handle_add_friend(data.get('message', ''))
            elif msg_type == 'accept_friend':
                await self.handle_accept_friend(data.get('request_id'))
            elif msg_type == 'decline_friend':
                await self.handle_decline_friend(data.get('request_id'))
        except Exception as e:
            logger.error(f"Chat consumer error: {e}")

    async def handle_message(self, content):
        room = await self.get_room(self.room_id)
        if not room or not content.strip():
            return

        msg = await self.save_message(room, self.user, content.strip())
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': {
                    'id': str(msg.id),
                    'sender': self.user.username,
                    'content': msg.content,
                    'status': msg.status,
                    'created_at': msg.created_at.isoformat()
                }
            }
        )

    async def handle_typing(self, is_typing):
        room = await self.get_room(self.room_id)
        if room:
            await self.save_typing_status(room, self.user, is_typing)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'typing_status',
                    'user': self.user.username,
                    'is_typing': is_typing
                }
            )

    async def handle_seen(self, message_id):
        await self.mark_seen(message_id, self.user)

    async def handle_end_chat(self):
        room = await self.get_room(self.room_id)
        if room:
            other = room.user2 if room.user1_id == self.user.id else room.user1
            room.status = 'ended'
            await self.save_room(room)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_ended',
                    'message': 'Chat ended by other user',
                    'reason': 'ended'
                }
            )

    async def handle_skip(self):
        room = await self.get_room(self.room_id)
        if room:
            other = room.user2 if room.user1_id == self.user.id else room.user1
            room.status = 'ended'
            await self.save_room(room)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_ended',
                    'message': 'User skipped the chat',
                    'reason': 'skipped'
                }
            )

    async def handle_add_friend(self, message):
        room = await self.get_room(self.room_id)
        if not room or room.status != 'active':
            return

        other_user = room.user2 if room.user1_id == self.user.id else room.user1
        existing = await self.get_existing_request(self.user.id, other_user.id)
        if existing:
            await self.send(text_data=json.dumps({
                'type': 'friend_request_sent',
                'message': 'Friend request already sent'
            }))
            return

        request = await self.create_friend_request(self.user, other_user, room, message)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'friend_request_received',
                'request_id': str(request.id),
                'sender_name': self.user.username,
                'message': message or 'Wants to add you as a friend'
            }
        )

    async def handle_accept_friend(self, request_id):
        request = await self.get_friend_request(request_id)
        if not request or request.receiver_id != self.user.id:
            return

        request.status = 'accepted'
        await self.save_friend_request(request)

        friendship = await self.create_friendship(request.sender, request.receiver, request.chat_room)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'friend_accepted',
                'message': 'Friend request accepted! You are now friends.'
            }
        )

    async def handle_decline_friend(self, request_id):
        request = await self.get_friend_request(request_id)
        if not request or request.receiver_id != self.user.id:
            return

        request.status = 'rejected'
        await self.save_friend_request(request)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'friend_declined',
                'message': 'Friend request declined'
            }
        )

    async def friend_request_received(self, event):
        await self.send(text_data=json.dumps({
            'type': 'friend_request_received',
            'request_id': event['request_id'],
            'sender_name': event['sender_name'],
            'message': event['message']
        }))

    async def friend_accepted(self, event):
        await self.send(text_data=json.dumps({
            'type': 'friend_accepted',
            'message': event['message']
        }))

    async def friend_declined(self, event):
        await self.send(text_data=json.dumps({
            'type': 'friend_declined',
            'message': event['message']
        }))

    @database_sync_to_async
    def get_existing_request(self, sender_id, receiver_id):
        from friends.models import FriendRequest
        return FriendRequest.objects.filter(
            sender_id=sender_id,
            receiver_id=receiver_id,
            status='pending'
        ).first()

    @database_sync_to_async
    def create_friend_request(self, sender, receiver, room, message):
        from friends.models import FriendRequest
        return FriendRequest.objects.create(
            sender=sender,
            receiver=receiver,
            chat_room=room,
            message=message or ''
        )

    @database_sync_to_async
    def get_friend_request(self, request_id):
        from friends.models import FriendRequest
        try:
            return FriendRequest.objects.get(id=request_id)
        except FriendRequest.DoesNotExist:
            return None

    @database_sync_to_async
    def save_friend_request(self, request):
        request.save()

    @database_sync_to_async
    def create_friendship(self, user1, user2, room):
        from friends.models import Friendship
        u1 = min(user1, user2, key=lambda u: u.id)
        u2 = max(user1, user2, key=lambda u: u.id)
        friendship, _ = Friendship.objects.get_or_create(user1=u1, user2=u2, defaults={'chat_room': room})
        return friendship

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({'type': 'message', 'message': event['message']}))

    async def typing_status(self, event):
        await self.send(text_data=json.dumps({'type': 'typing', 'user': event['user'], 'is_typing': event['is_typing']}))

    async def seen_status(self, event):
        await self.send(text_data=json.dumps({'type': 'seen', 'message_id': event['message_id']}))

    async def chat_ended(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_ended',
            'message': event['message'],
            'reason': event.get('reason', 'ended')
        }))

    @database_sync_to_async
    def get_room(self, room_id):
        try:
            return ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return None

    @database_sync_to_async
    def save_message(self, room, sender, content):
        msg = Message.objects.create(room=room, sender=sender, content=content)
        room.last_activity = timezone.now()
        room.save()
        return msg

    @database_sync_to_async
    def save_typing_status(self, room, user, is_typing):
        TypingStatus.objects.update_or_create(room=room, user=user, defaults={'is_typing': is_typing})

    @database_sync_to_async
    def mark_seen(self, message_id, user):
        try:
            msg = Message.objects.get(id=message_id)
            if msg.sender_id != user.id and msg.status != 'seen':
                msg.status = 'seen'
                msg.save()
        except Message.DoesNotExist:
            pass

    @database_sync_to_async
    def mark_messages_read(self, room, user):
        Message.objects.filter(room=room).exclude(sender=user).update(status='seen')

    @database_sync_to_async
    def save_room(self, room):
        room.save()
