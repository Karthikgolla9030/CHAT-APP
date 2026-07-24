from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import Notification
from .serializers import NotificationSerializer, NotificationPreferenceSerializer
from django.db.models import Q
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class NotificationListAPI(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')[:100]


class NotificationMarkReadAPI(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, notification_id):
        notification = Notification.objects.filter(id=notification_id, recipient=request.user).first()
        if notification:
            notification.is_read = True
            notification.save()
        return Response({'detail': 'Marked as read'})


class NotificationMarkAllReadAPI(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'detail': 'All marked as read'})


class NotificationPreferenceAPI(generics.RetrieveUpdateAPIView):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        pref, _ = NotificationPreference.objects.get_or_create(user=self.request.user)
        return pref
