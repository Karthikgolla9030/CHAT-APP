from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404
from .models import FriendRequest, BlockedUser, Friendship
from .serializers import FriendRequestSerializer, BlockedUserSerializer, FriendshipSerializer
from accounts.models import Profile
from accounts.services import get_online_status
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class FriendRequestListCreateAPI(generics.ListCreateAPIView):
    serializer_class = FriendRequestSerializer

    def get_queryset(self):
        user = self.request.user
        return FriendRequest.objects.filter(Q(sender=user) | Q(receiver=user)).order_by('-created_at')

    def perform_create(self, serializer):
        receiver_id = self.request.data.get('receiver')
        chat_room_id = self.request.data.get('chat_room')
        if not chat_room_id:
            from rest_framework.exceptions import ValidationError
            raise ValidationError('Friend requests can only be sent during an active chat session.')
        try:
            from chat.models import ChatRoom
            room = ChatRoom.objects.get(id=chat_room_id, status='active')
            if request.user not in [room.user1, room.user2]:
                raise ValidationError('You are not part of this chat session.')
            other = room.user2 if room.user1 == request.user else room.user1
            if str(other.id) != str(receiver_id):
                raise ValidationError('Receiver does not match chat session.')
        except ChatRoom.DoesNotExist:
            raise ValidationError('Invalid or expired chat session.')
        serializer.save(sender=self.request.user, chat_room=room)


class FriendRequestRespondAPI(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, request_id):
        req = get_object_or_404(FriendRequest, id=request_id, receiver=request.user)
        action = request.data.get('action')
        if action == 'accept':
            req.status = 'accepted'
            req.save()
            user1 = min(req.sender, req.receiver, key=lambda u: u.id)
            user2 = max(req.sender, req.receiver, key=lambda u: u.id)
            Friendship.objects.get_or_create(user1=user1, user2=user2)
            return Response({'detail': 'Friend request accepted'})
        elif action == 'reject':
            req.status = 'rejected'
            req.save()
            return Response({'detail': 'Friend request rejected'})
        return Response({'detail': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)


class FriendRequestCancelAPI(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FriendRequest.objects.filter(sender=self.request.user, status='pending')


class RemoveFriendAPI(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Friendship.objects.filter(
            Q(user1=self.request.user) | Q(user2=self.request.user)
        )


class FriendListAPI(generics.ListAPIView):
    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Friendship.objects.filter(Q(user1=user) | Q(user2=user))


class BlockUserAPI(generics.CreateAPIView):
    serializer_class = BlockedUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user_id = self.request.data.get('user_id')
        user = get_object_or_404(User, id=user_id)
        BlockedUser.objects.get_or_create(blocker=self.request.user, blocked=user)
        FriendRequest.objects.filter(
            Q(sender=self.request.user, receiver=user) | Q(sender=user, receiver=self.request.user)
        ).delete()
        Friendship.objects.filter(Q(user1=self.request.user, user2=user) | Q(user1=user, user2=self.request.user)).delete()


class UnblockUserAPI(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BlockedUser.objects.filter(blocker=self.request.user)


class BlockedListAPI(generics.ListAPIView):
    serializer_class = BlockedUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BlockedUser.objects.filter(blocker=self.request.user)
