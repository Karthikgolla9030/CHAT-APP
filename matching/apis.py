from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import MatchRequest, MatchQueue, MatchHistory
from .serializers import MatchRequestSerializer, MatchQueueSerializer, MatchHistorySerializer
from accounts.models import Profile
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class JoinQueueAPI(generics.CreateAPIView):
    serializer_class = MatchQueueSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        user = request.user
        MatchQueue.objects.filter(user=user).delete()
        queue, created = MatchQueue.objects.get_or_create(
            user=user,
            defaults={'preferences': request.data.get('preferences', {}), 'match_mode': request.data.get('match_mode', 'random')}
        )
        serializer = self.get_serializer(queue)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class LeaveQueueAPI(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return MatchQueue.objects.filter(user=self.request.user).first()

    def destroy(self, request, *args, **kwargs):
        queue = self.get_object()
        if queue:
            queue.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MatchRequestAPI(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        receiver_id = request.data.get('receiver_id')
        receiver = get_object_or_404(User, id=receiver_id)
        if receiver == request.user:
            return Response({'detail': 'Cannot match with yourself'}, status=status.HTTP_400_BAD_REQUEST)
        match_request, created = MatchRequest.objects.get_or_create(
            sender=request.user,
            receiver=receiver,
            defaults={'sender_preferences': request.data.get('preferences', {}), 'receiver_preferences': {}}
        )
        if not created:
            return Response({'detail': 'Request already sent'}, status=status.HTTP_400_BAD_REQUEST)
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'user_{receiver.id}',
            {'type': 'chat_request', 'data': MatchRequestSerializer(match_request).data}
        )
        return Response({'detail': 'Match request sent', 'request': MatchRequestSerializer(match_request).data})


class RespondRequestAPI(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, request_id):
        match_request = get_object_or_404(MatchRequest, id=request_id, receiver=request.user)
        action = request.data.get('action')
        if action == 'accept':
            match_request.status = 'matched'
            match_request.save()
            MatchHistory.objects.create(user1=match_request.sender, user2=match_request.receiver, match_score=match_request.match_score)
            return Response({'detail': 'Match accepted', 'match_id': str(match_request.id)})
        elif action == 'decline':
            match_request.status = 'declined'
            match_request.save()
            return Response({'detail': 'Match declined'})
        return Response({'detail': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)


class MatchHistoryAPI(generics.ListAPIView):
    serializer_class = MatchHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return MatchHistory.objects.filter(Q(user1=user) | Q(user2=user))[:50]


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_queue_status(request):
    user = request.user
    queue = MatchQueue.objects.filter(user=user, is_active=True).first()
    serializer = MatchQueueSerializer(queue) if queue else None
    return Response({'queue': serializer.data if serializer else None})
