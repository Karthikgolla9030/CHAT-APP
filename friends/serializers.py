from rest_framework import serializers
from .models import FriendRequest, BlockedUser, Friendship
from accounts.serializers import UserSerializer


class FriendRequestSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)

    class Meta:
        model = FriendRequest
        fields = ['id', 'sender', 'receiver', 'status', 'message', 'seen', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class BlockedUserSerializer(serializers.ModelSerializer):
    blocker = UserSerializer(read_only=True)
    blocked = UserSerializer(read_only=True)

    class Meta:
        model = BlockedUser
        fields = ['id', 'blocker', 'blocked', 'reason', 'created_at']
        read_only_fields = ['id', 'created_at']


class FriendshipSerializer(serializers.ModelSerializer):
    friend = serializers.SerializerMethodField()

    class Meta:
        model = Friendship
        fields = ['id', 'user1', 'user2', 'created_at', 'friend']
        read_only_fields = ['id', 'created_at']

    def get_friend(self, obj):
        user = self.context['request'].user
        friend = obj.user2 if obj.user1 == user else obj.user1
        return UserSerializer(friend).data
