from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from django.contrib.auth import get_user_model
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import FriendRequest, Friendship, BlockedUser
from .serializers import FriendRequestSerializer, FriendshipSerializer, BlockedUserSerializer

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

        me = request.user

        # Already friends?
        if Friendship.objects.filter(
            Q(user1=me, user2=partner) | Q(user1=partner, user2=me)
        ).exists():
            return Response({'status': 'friends'})

        # I sent a pending request?
        sent = FriendRequest.objects.filter(sender=me, receiver=partner, status='pending').first()
        if sent:
            return Response({'status': 'request_sent', 'request_id': str(sent.id)})

        # I received a pending request?
        received = FriendRequest.objects.filter(sender=partner, receiver=me, status='pending').first()
        if received:
            return Response({
                'status': 'request_received',
                'request_id': str(received.id),
                'sender_username': partner.username,
            })

        return Response({'status': 'none'})


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
        room_id = request.data.get('room_id')  # Optional: chat room for real-time notification

        if not target_id:
            return Response({'detail': 'target_user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            target_user = User.objects.get(id=target_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if target_user == request.user:
            return Response({'detail': 'Cannot send friend request to yourself'}, status=status.HTTP_400_BAD_REQUEST)

        # Already friends?
        if Friendship.objects.filter(
            Q(user1=request.user, user2=target_user) | Q(user1=target_user, user2=request.user)
        ).exists():
            return Response({'detail': 'Already friends', 'status': 'friends'}, status=status.HTTP_200_OK)

        # Cross request? If they sent us one, accept it instead
        reverse_req = FriendRequest.objects.filter(
            sender=target_user, receiver=request.user, status='pending'
        ).first()
        if reverse_req:
            reverse_req.status = 'accepted'
            reverse_req.save()
            u1, u2 = (request.user, target_user) if request.user.id < target_user.id else (target_user, request.user)
            Friendship.objects.get_or_create(user1=u1, user2=u2)
            payload = {
                '_type': 'friend_status_update',
                'new_status': 'friends',
                'user_id': request.user.id,
                'partner_id': target_user.id,
            }
            _push_to_chat_room(room_id, payload)
            return Response({'detail': 'Cross request auto-accepted. You are now friends!', 'status': 'friends'}, status=status.HTTP_200_OK)

        freq, created = FriendRequest.objects.get_or_create(
            sender=request.user, receiver=target_user,
            defaults={'status': 'pending'}
        )

        # Push real-time notification to the chat room so receiver sees inline request UI
        payload = {
            '_type': 'friend_request_received',
            'request_id': str(freq.id),
            'sender_id': request.user.id,
            'sender_username': request.user.username,
            'receiver_id': target_user.id,
        }
        _push_to_chat_room(room_id, payload)

        return Response(
            {'detail': 'Friend request sent', 'status': 'request_sent', 'request_id': str(freq.id)},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


class AcceptFriendRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        room_id = request.data.get('room_id')

        try:
            freq = FriendRequest.objects.get(id=pk, receiver=request.user, status='pending')
        except FriendRequest.DoesNotExist:
            return Response({'detail': 'Friend request not found'}, status=status.HTTP_404_NOT_FOUND)

        freq.status = 'accepted'
        freq.save()

        u1, u2 = (request.user, freq.sender) if request.user.id < freq.sender.id else (freq.sender, request.user)
        Friendship.objects.get_or_create(user1=u1, user2=u2)

        # Push real-time update so both users' headers update to "Friends ✓"
        payload = {
            '_type': 'friend_status_update',
            'new_status': 'friends',
            'user_id': freq.sender.id,
            'partner_id': request.user.id,
        }
        _push_to_chat_room(room_id, payload)

        return Response({'detail': 'Friend request accepted', 'status': 'friends'})


class RejectFriendRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        room_id = request.data.get('room_id')

        try:
            freq = FriendRequest.objects.get(id=pk, receiver=request.user, status='pending')
        except FriendRequest.DoesNotExist:
            return Response({'detail': 'Friend request not found'}, status=status.HTTP_404_NOT_FOUND)

        sender_id = freq.sender.id
        freq.status = 'rejected'
        freq.save()

        # Notify sender in chat that request was declined
        payload = {
            '_type': 'friend_request_declined',
            'sender_id': sender_id,
            'receiver_id': request.user.id,
        }
        _push_to_chat_room(room_id, payload)

        return Response({'detail': 'Friend request declined'})


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
