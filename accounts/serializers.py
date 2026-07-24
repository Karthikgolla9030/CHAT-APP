from rest_framework import serializers
from .models import User, Profile, GuestConversion


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_guest', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class RegisterSerializer(serializers.ModelSerializer):
    password1 = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2', 'first_name', 'last_name']

    def validate(self, data):
        if data['password1'] != data['password2']:
            raise serializers.ValidationError('Passwords do not match.')
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password1')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user


class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False, allow_blank=True)
    languages = serializers.ListField(child=serializers.CharField(), required=False)
    interests = serializers.ListField(child=serializers.CharField(), required=False)
    favorite_topics = serializers.ListField(child=serializers.CharField(), required=False)
    skill_tags = serializers.ListField(child=serializers.CharField(), required=False)
    hobbies = serializers.ListField(child=serializers.CharField(), required=False)

    class Meta:
        model = Profile
        fields = ['id', 'username', 'display_name', 'age', 'gender', 'looking_for', 'country', 'state', 'languages', 'interests', 'bio', 'profile_picture', 'online_status', 'last_seen', 'favorite_topics', 'skill_tags', 'hobbies', 'profile_completion', 'created_at']
        read_only_fields = ['id', 'online_status', 'last_seen', 'profile_completion', 'created_at']


class GuestConversionSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuestConversion
        fields = ['id', 'temp_email', 'converted', 'created_at']
        read_only_fields = ['id', 'converted', 'created_at']
