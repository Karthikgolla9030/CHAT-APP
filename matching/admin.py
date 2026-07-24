from django.contrib import admin
from .models import MatchRequest, MatchQueue, MatchHistory


@admin.register(MatchRequest)
class MatchRequestAdmin(admin.ModelAdmin):
    list_display = ['sender', 'receiver', 'status', 'match_score', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['sender__username', 'receiver__username']


@admin.register(MatchQueue)
class MatchQueueAdmin(admin.ModelAdmin):
    list_display = ['user', 'match_mode', 'is_active', 'entered_at', 'last_searched_at']
    list_filter = ['match_mode', 'is_active']


@admin.register(MatchHistory)
class MatchHistoryAdmin(admin.ModelAdmin):
    list_display = ['user1', 'user2', 'match_score', 'matched_at']
    list_filter = ['matched_at']
    search_fields = ['user1__username', 'user2__username']
