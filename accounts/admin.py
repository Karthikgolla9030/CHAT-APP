from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Profile, GuestConversion


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'is_guest', 'is_staff', 'is_active', 'date_joined']
    list_filter = ['is_guest', 'is_staff', 'is_active', 'date_joined']
    search_fields = ['username', 'email']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Extra', {'fields': ('is_guest', 'email_verified')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Extra', {'fields': ('is_guest',)}),
    )


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['username', 'user', 'gender', 'country', 'online_status', 'profile_completion', 'created_at']
    list_filter = ['gender', 'online_status', 'country', 'created_at']
    search_fields = ['username', 'user__username', 'country']
    readonly_fields = ['profile_completion', 'created_at', 'updated_at']


@admin.register(GuestConversion)
class GuestConversionAdmin(admin.ModelAdmin):
    list_display = ['guest_user', 'converted', 'created_at']
    list_filter = ['converted', 'created_at']
    search_fields = ['guest_user__username']
