from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Profile, Interest, UserInterest

User = get_user_model()

class InterestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interest
        fields = ['id', 'name', 'category']

class ProfileSerializer(serializers.ModelSerializer):
    interests = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            'display_name', 'bio', 'avatar', 'gender',
            'looking_for', 'country', 'language',
            'online_status', 'last_seen', 'interests'
        ]
        read_only_fields = ['online_status', 'last_seen']

    def get_interests(self, obj):
        user_interests = UserInterest.objects.filter(user=obj.user).select_related('interest')
        return [ui.interest.name for ui in user_interests]

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_guest', 'created_at', 'profile']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        Profile.objects.create(user=user, display_name=user.username)
        return user

class GuestLoginSerializer(serializers.Serializer):
    nickname = serializers.CharField(required=False, allow_blank=True, max_length=30)
    captcha_proof_token = serializers.CharField(required=True, error_messages={'required': 'CAPTCHA verification is required to create a guest account.'})
