from rest_framework import serializers
from .models import ChatRoom, Message, TypingStatus, ChatReport
from accounts.serializers import UserSerializer


class ChatRoomSerializer(serializers.ModelSerializer):
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['id', 'user1', 'user2', 'status', 'started_at', 'ended_at', 'last_activity', 'other_user', 'last_message', 'unread_count']
        read_only_fields = ['id', 'started_at', 'last_activity']

    def get_other_user(self, obj):
        user = self.context['request'].user
        other = obj.user2 if obj.user1 == user else obj.user1
        return UserSerializer(other).data

    def get_last_message(self, obj):
        msg = obj.messages.filter(is_deleted=False).last()
        if msg:
            return {'content': msg.content, 'sender': msg.sender.username, 'created_at': msg.created_at, 'status': msg.status}
        return None

    def get_unread_count(self, obj):
        user = self.context['request'].user
        return obj.messages.filter(is_deleted=False, status='sent').exclude(sender=user).count()


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'room', 'sender', 'sender_name', 'content', 'message_type', 'status', 'is_deleted', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class TypingStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypingStatus
        fields = ['room', 'user', 'is_typing', 'updated_at']
        read_only_fields = ['updated_at']


class ChatReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatReport
        fields = ['id', 'room', 'reporter', 'reported_user', 'reason', 'description', 'reviewed', 'created_at']
        read_only_fields = ['id', 'reporter', 'reviewed', 'created_at']
