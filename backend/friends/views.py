from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from django.contrib.auth import get_user_model
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import FriendRequest, Friendship, BlockedUser
from .serializers import FriendRequestSerializer, FriendshipSerializer
from common.services.friend import FriendService

User = get_user_model()

def _push_to_chat_room(room_id, payload):
    """Push an event to the chat room's Channels group so both users get it."""
    if not room_id:
        return
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    group_name = f"chat_{room_id}"
    async_to_sync(channel_layer.group_send)(group_name, {
        'type': 'broadcast_message',
        'message': payload,
    })


class RelationshipStatusView(APIView):
    """
    GET /api/v1/friends/relationship/?partner_id=<id>
    Returns the current relationship state between the authenticated user and partner.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        partner_id = request.query_params.get('partner_id')
        if not partner_id:
            return Response({'detail': 'partner_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            partner = User.objects.get(id=partner_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        rel = FriendService.get_relationship(request.user, partner)
        return Response(rel)


class FriendListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FriendshipSerializer

    def get_queryset(self):
        user = self.request.user
        query = self.request.query_params.get('search', '').strip()
        qs = Friendship.objects.filter(Q(user1=user) | Q(user2=user)).select_related(
            'user1', 'user2', 'user1__profile', 'user2__profile'
        )
        if query:
            qs = qs.filter(
                Q(user1__username__icontains=query) | Q(user2__username__icontains=query) |
                Q(user1__profile__display_name__icontains=query) | Q(user2__profile__display_name__icontains=query)
            )
        return qs


class FriendRequestListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        requests = FriendRequest.objects.filter(
            receiver=request.user, status='pending'
        ).select_related('sender', 'sender__profile')
        return Response(FriendRequestSerializer(requests, many=True).data)

    def post(self, request):
        target_id = request.data.get('target_user_id')
        room_id = request.data.get('room_id')  # Optional chat room for inline notification

        if not target_id:
            return Response({'detail': 'target_user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            target_user = User.objects.get(id=target_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            res = FriendService.send_request(request.user, target_user)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        # Notify via room WS if provided
        if res['status'] == 'friends':
            payload = {
                '_type': 'friend_status_update',
                'new_status': 'friends',
                'user_id': request.user.id,
                'partner_id': target_user.id,
            }
            _push_to_chat_room(room_id, payload)
        elif res['status'] == 'request_sent':
            payload = {
                '_type': 'friend_request_received',
                'request_id': res.get('request_id'),
                'sender_id': request.user.id,
                'sender_username': request.user.username,
                'receiver_id': target_user.id,
            }
            _push_to_chat_room(room_id, payload)

        return Response(res, status=status.HTTP_200_OK if res['status'] == 'friends' else status.HTTP_201_CREATED)


class AcceptFriendRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        room_id = request.data.get('room_id')
        try:
            res = FriendService.accept_request(request.user, pk)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_404_NOT_FOUND)

        payload = {
            '_type': 'friend_status_update',
            'new_status': 'friends',
            'user_id': res['sender_id'],
            'partner_id': request.user.id,
        }
        _push_to_chat_room(room_id, payload)

        return Response(res)


class RejectFriendRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        room_id = request.data.get('room_id')
        try:
            res = FriendService.reject_request(request.user, pk)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_404_NOT_FOUND)

        payload = {
            '_type': 'friend_request_declined',
            'sender_id': res['sender_id'],
            'receiver_id': request.user.id,
        }
        _push_to_chat_room(room_id, payload)

        return Response(res)


class CancelFriendRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            res = FriendService.cancel_request(request.user, pk)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_404_NOT_FOUND)
        return Response(res)


class RemoveFriendView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, friend_id):
        try:
            friend_user = User.objects.get(id=friend_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        res = FriendService.remove_friend(request.user, friend_user)
        return Response(res)


class BlockUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        target_id = request.data.get('target_user_id')
        if not target_id:
            return Response({'detail': 'target_user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            target_user = User.objects.get(id=target_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        BlockedUser.objects.get_or_create(blocker=request.user, blocked=target_user)
        return Response({'detail': f'Blocked {target_user.username}'})
