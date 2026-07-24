from rest_framework import generics, permissions
from rest_framework.response import Response
from django.db.models import Q
from django.shortcuts import get_object_or_404
from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer


class ChatRoomAPI(generics.ListCreateAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(Q(user1=user) | Q(user2=user)).order_by('-last_activity')


class MessageListAPI(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room = get_object_or_404(ChatRoom, id=self.kwargs['room_id'])
        return Message.objects.filter(room=room, is_deleted=False).order_by('created_at')[:200]


class TypingStatusAPI(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_id):
        is_typing = request.data.get('is_typing', False)
        room = get_object_or_404(ChatRoom, id=room_id)
        if request.user not in [room.user1, room.user2]:
            return Response({'detail': 'Forbidden'}, status=403)
        from .models import TypingStatus
        TypingStatus.objects.update_or_create(room=room, user=request.user, defaults={'is_typing': is_typing})
        return Response({'status': 'ok'})
