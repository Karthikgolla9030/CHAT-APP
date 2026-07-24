from rest_framework import serializers
from .models import MatchRequest, MatchQueue, MatchHistory
from accounts.serializers import ProfileSerializer


class MatchRequestSerializer(serializers.ModelSerializer):
    sender_profile = ProfileSerializer(source='sender.profile', read_only=True)
    receiver_profile = ProfileSerializer(source='receiver.profile', read_only=True)

    class Meta:
        model = MatchRequest
        fields = ['id', 'sender', 'receiver', 'status', 'match_score', 'created_at', 'sender_profile', 'receiver_profile']
        read_only_fields = ['id', 'created_at']


class MatchQueueSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchQueue
        fields = ['id', 'user', 'preferences', 'match_mode', 'is_active', 'entered_at', 'last_searched_at']
        read_only_fields = ['id', 'entered_at', 'last_searched_at']


class MatchHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchHistory
        fields = ['id', 'user1', 'user2', 'match_score', 'matched_at']
        read_only_fields = ['id', 'matched_at']
