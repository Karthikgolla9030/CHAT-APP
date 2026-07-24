from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import User, Profile, GuestConversion
from .serializers import UserSerializer, RegisterSerializer, ProfileSerializer, GuestConversionSerializer
from .services import generate_guest_user, convert_guest_to_user
import logging

logger = logging.getLogger(__name__)


class RegisterAPI(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        from rest_framework.authtoken.models import Token
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': UserSerializer(user).data}, status=status.HTTP_201_CREATED)


class LoginAPI(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            login(request, user)
            from rest_framework.authtoken.models import Token
            token, _ = Token.objects.get_or_create(user=user)
            return Response({'token': token.key, 'user': UserSerializer(user).data})
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


class GuestLoginAPI(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        form_data = {'nickname': request.data.get('nickname', '')}
        import accounts.forms as forms_mod
        form = forms_mod.GuestLoginForm(form_data)
        if not form.is_valid():
            return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)
        user = generate_guest_user(nickname=form_data.get('nickname'))
        from rest_framework.authtoken.models import Token
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': UserSerializer(user).data, 'is_guest': True}, status=status.HTTP_201_CREATED)


class LogoutAPI(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({'detail': 'Logged out'})


class ProfileAPI(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.profile

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


class ConvertGuestAPI(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not request.user.is_guest:
            return Response({'detail': 'Not a guest account'}, status=status.HTTP_400_BAD_REQUEST)
        result = convert_guest_to_user(request.user, request.data)
        return Response(result)


class UserSearchAPI(generics.ListAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        q = self.request.query_params.get('q', '')
        return Profile.objects.filter(
            Q(username__icontains=q) | Q(display_name__icontains=q)
        ).exclude(user=self.request.user)[:20]


class OnlineUsersAPI(generics.ListAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Profile.objects.filter(online_status='online').exclude(user=self.request.user)[:50]


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    user = request.user
    old = request.data.get('old_password')
    new = request.data.get('new_password')
    if not user.check_password(old):
        return Response({'detail': 'Old password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)
    user.set_password(new)
    user.save()
    return Response({'detail': 'Password changed successfully'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def delete_account(request):
    user = request.user
    password = request.data.get('password')
    if not user.check_password(password):
        return Response({'detail': 'Password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)
    user.delete()
    return Response({'detail': 'Account deleted'})
