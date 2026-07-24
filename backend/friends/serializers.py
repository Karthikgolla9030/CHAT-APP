from rest_framework import serializers
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

    class Meta:
        model = Friendship
        fields = ['id', 'friend', 'created_at']

    def get_friend(self, obj):
        request_user = self.context.get('request').user
        friend_user = obj.user2 if obj.user1 == request_user else obj.user1
        return UserSerializer(friend_user).data

class BlockedUserSerializer(serializers.ModelSerializer):
    blocked = UserSerializer(read_only=True)

    class Meta:
        model = BlockedUser
        fields = ['id', 'blocked', 'created_at']
