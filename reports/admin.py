from django.contrib import admin
from .models import Report, BlockedWord


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['reporter', 'reported_user', 'reason', 'status', 'created_at']
    list_filter = ['reason', 'status', 'created_at']
    search_fields = ['reporter__username', 'reported_user__username', 'description', 'admin_notes']
    actions = ['mark_reviewed', 'mark_resolved']

    def mark_reviewed(self, request, queryset):
        queryset.update(status='reviewed')
    mark_reviewed.short_description = 'Mark as reviewed'

    def mark_resolved(self, request, queryset):
        queryset.update(status='resolved')
    mark_resolved.short_description = 'Mark as resolved'


@admin.register(BlockedWord)
class BlockedWordAdmin(admin.ModelAdmin):
    list_display = ['word', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['word']
