from rest_framework import serializers
from .models import Report, BlockedWord


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ['id', 'reporter', 'reported_user', 'reason', 'description', 'status', 'admin_notes', 'reviewed_at', 'created_at']
        read_only_fields = ['id', 'reporter', 'created_at', 'reviewed_at']


class BlockedWordSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlockedWord
        fields = ['id', 'word', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']
