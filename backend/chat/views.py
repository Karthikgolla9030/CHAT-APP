from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from .models import ChatRoom, Message
from .serializers import MessageSerializer

class RoomMessagesView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MessageSerializer

    def get_queryset(self):
        room_id = self.kwargs['room_id']
        room = get_object_or_404(ChatRoom, id=room_id)
        if self.request.user.id not in [room.user1_id, room.user2_id]:
            raise PermissionDenied("You are not a member of this chat room.")
        return Message.objects.filter(room=room).order_by('created_at')
