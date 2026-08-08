from rest_framework import serializers
from django.db import models
from django.contrib.auth import get_user_model
from .models import FriendRequest, Friendship, BlockedUser
from accounts.serializers import UserSerializer

User = get_user_model()

class FriendRequestSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)

    class Meta:
        model = FriendRequest
        fields = ['id', 'sender', 'receiver', 'status', 'created_at']

class FriendshipSerializer(serializers.ModelSerializer):
    friend = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Friendship
        fields = ['id', 'friend', 'created_at', 'unread_count', 'last_message']

    def get_friend(self, obj):
        request_user = self.context.get('request').user
        friend_user = obj.user2 if obj.user1 == request_user else obj.user1
        return UserSerializer(friend_user).data

    def get_unread_count(self, obj):
        request_user = self.context.get('request').user
        friend_user = obj.user2 if obj.user1 == request_user else obj.user1
        # Use existing ChatRoom and Message models
        from chat.models import ChatRoom, Message
        try:
            # friend chats enforce deterministic user1 < user2 ordering in FriendService, but check both to be safe
            room = ChatRoom.objects.get(
                models.Q(user1=request_user, user2=friend_user) | models.Q(user1=friend_user, user2=request_user),
                room_type='friend'
            )
            return Message.objects.filter(room=room, status__in=['sent', 'delivered'], sender=friend_user).count()
        except ChatRoom.DoesNotExist:
            return 0

    def get_last_message(self, obj):
        request_user = self.context.get('request').user
        friend_user = obj.user2 if obj.user1 == request_user else obj.user1
        from chat.models import ChatRoom, Message
        try:
            room = ChatRoom.objects.get(
                models.Q(user1=request_user, user2=friend_user) | models.Q(user1=friend_user, user2=request_user),
                room_type='friend'
            )
            last = Message.objects.filter(room=room).order_by('-created_at').first()
            if last:
                return {
                    'content': last.content,
                    'created_at': last.created_at.isoformat(),
                    'sender_id': last.sender_id
                }
        except ChatRoom.DoesNotExist:
            pass
        return None

class BlockedUserSerializer(serializers.ModelSerializer):
    blocked = UserSerializer(read_only=True)

    class Meta:
        model = BlockedUser
        fields = ['id', 'blocked', 'created_at']
