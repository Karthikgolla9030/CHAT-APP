from django.contrib import admin
from .models import ChatRoom, Message, TypingStatus, ChatReport


@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ['user1', 'user2', 'status', 'started_at', 'last_activity']
    list_filter = ['status', 'started_at']
    search_fields = ['user1__username', 'user2__username']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['room', 'sender', 'content_preview', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['sender__username', 'content']
    filter_horizontal = []

    def content_preview(self, obj):
        return obj.content[:80]
    content_preview.short_description = 'Content'


@admin.register(TypingStatus)
class TypingStatusAdmin(admin.ModelAdmin):
    list_display = ['room', 'user', 'is_typing', 'updated_at']
    list_filter = ['is_typing']


@admin.register(ChatReport)
class ChatReportAdmin(admin.ModelAdmin):
    list_display = ['reporter', 'reported_user', 'reason', 'reviewed', 'created_at']
    list_filter = ['reason', 'reviewed', 'created_at']
    search_fields = ['reporter__username', 'reported_user__username', 'description']
