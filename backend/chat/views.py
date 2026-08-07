from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.contrib.auth import get_user_model
from friends.models import Friendship, BlockedUser
from .models import ChatRoom, Message
from .serializers import MessageSerializer

User = get_user_model()

class RoomMessagesView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MessageSerializer

    def get_queryset(self):
        room_id = self.kwargs['room_id']
        room = get_object_or_404(ChatRoom, id=room_id)
        if self.request.user.id not in [room.user1_id, room.user2_id]:
            raise PermissionDenied("You are not a member of this chat room.")

        # Strict isolation: Random Chat history is deleted upon room termination.
        # If the room is ended, check if they are currently friends.
        if room.status == 'ended':
            is_friend = Friendship.objects.filter(
                Q(user1_id=room.user1_id, user2_id=room.user2_id) |
                Q(user1_id=room.user2_id, user2_id=room.user1_id)
            ).exists()
            if not is_friend:
                raise PermissionDenied("This random chat room has ended and temporary messages were purged.")

        return Message.objects.filter(room=room).order_by('created_at')


class GetOrCreateFriendRoomView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        friend_id = request.data.get('friend_id')
        if not friend_id:
            return Response({'detail': 'friend_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        friend = get_object_or_404(User, id=friend_id)

        # 1. Check friendship exists in PostgreSQL
        is_friend = Friendship.objects.filter(
            Q(user1=request.user, user2=friend) | Q(user1=friend, user2=request.user)
        ).exists()

        if not is_friend:
            raise PermissionDenied("You can only chat with your accepted friends in Friends mode.")

        # 2. Check blocks
        is_blocked = BlockedUser.objects.filter(
            Q(blocker=request.user, blocked=friend) | Q(blocker=friend, blocked=request.user)
        ).exists()
        if is_blocked:
            raise PermissionDenied("Cannot start a chat session. User is blocked.")

        # 3. Retrieve or create dedicated permanent friend room (room_type='friend')
        from common.services.session import SessionService
        room = SessionService.create_session(request.user, friend, room_type='friend')

        return Response({
            'room_id': str(room.id),
            'partner': {
                'id': friend.id,
                'username': friend.username,
                'display_name': getattr(getattr(friend, 'profile', None), 'display_name', friend.username),
                'avatar': friend.profile.avatar.url if getattr(getattr(friend, 'profile', None), 'avatar', None) else None,
            }
        })


class RoomDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_id):
        room = get_object_or_404(ChatRoom, id=room_id)
        if request.user.id not in [room.user1_id, room.user2_id]:
            raise PermissionDenied("You are not a member of this chat room.")

        # Find the partner
        partner = room.user2 if room.user1 == request.user else room.user1

        # Is this room a dedicated friend chat or a random chat?
        is_friend_chat = (room.room_type == 'friend')

        return Response({
            'room_id': str(room.id),
            'room_type': room.room_type,
            'status': room.status,
            'is_friend_chat': is_friend_chat,
            'partner': {
                'id': partner.id,
                'username': partner.username,
                'display_name': getattr(getattr(partner, 'profile', None), 'display_name', partner.username),
                'avatar': partner.profile.avatar.url if getattr(getattr(partner, 'profile', None), 'avatar', None) else None,
            }
        })
