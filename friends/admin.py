from django.contrib import admin
from .models import FriendRequest, BlockedUser, Friendship


@admin.register(FriendRequest)
class FriendRequestAdmin(admin.ModelAdmin):
    list_display = ['sender', 'receiver', 'status', 'seen', 'created_at']
    list_filter = ['status', 'seen', 'created_at']
    search_fields = ['sender__username', 'receiver__username']


@admin.register(BlockedUser)
class BlockedUserAdmin(admin.ModelAdmin):
    list_display = ['blocker', 'blocked', 'reason', 'created_at']
    list_filter = ['created_at']
    search_fields = ['blocker__username', 'blocked__username']


@admin.register(Friendship)
class FriendshipAdmin(admin.ModelAdmin):
    list_display = ['user1', 'user2', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user1__username', 'user2__username']
