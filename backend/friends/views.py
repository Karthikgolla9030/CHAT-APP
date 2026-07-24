from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from django.contrib.auth import get_user_model
from .models import FriendRequest, Friendship, BlockedUser
from .serializers import FriendRequestSerializer, FriendshipSerializer, BlockedUserSerializer

User = get_user_model()

class FriendListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FriendshipSerializer

    def get_queryset(self):
        user = self.request.user
        query = self.request.query_params.get('search', '').strip()
        qs = Friendship.objects.filter(Q(user1=user) | Q(user2=user)).select_related('user1', 'user2', 'user1__profile', 'user2__profile')
        if query:
            qs = qs.filter(
                Q(user1__username__icontains=query) | Q(user2__username__icontains=query) |
                Q(user1__profile__display_name__icontains=query) | Q(user2__profile__display_name__icontains=query)
            )
        return qs


class FriendRequestListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        requests = FriendRequest.objects.filter(receiver=request.user, status='pending').select_related('sender', 'sender__profile')
        return Response(FriendRequestSerializer(requests, many=True).data)

    def post(self, request):
        target_id = request.data.get('target_user_id')
        if not target_id:
            return Response({'detail': 'target_user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            target_user = User.objects.get(id=target_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if target_user == request.user:
            return Response({'detail': 'Cannot send friend request to yourself'}, status=status.HTTP_400_BAD_REQUEST)

        # Check existing friendship
        if Friendship.objects.filter(Q(user1=request.user, user2=target_user) | Q(user1=target_user, user2=request.user)).exists():
            return Response({'detail': 'Already friends'}, status=status.HTTP_400_BAD_REQUEST)

        freq, created = FriendRequest.objects.get_or_create(
            sender=request.user, receiver=target_user,
            defaults={'status': 'pending'}
        )
        return Response(FriendRequestSerializer(freq).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class AcceptFriendRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            freq = FriendRequest.objects.get(id=pk, receiver=request.user, status='pending')
        except FriendRequest.DoesNotExist:
            return Response({'detail': 'Friend request not found'}, status=status.HTTP_404_NOT_FOUND)

        freq.status = 'accepted'
        freq.save()

        u1, u2 = (request.user, freq.sender) if request.user.id < freq.sender.id else (freq.sender, request.user)
        Friendship.objects.get_or_create(user1=u1, user2=u2)

        return Response({'detail': 'Friend request accepted'})


class RejectFriendRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            freq = FriendRequest.objects.get(id=pk, receiver=request.user, status='pending')
        except FriendRequest.DoesNotExist:
            return Response({'detail': 'Friend request not found'}, status=status.HTTP_404_NOT_FOUND)

        freq.status = 'rejected'
        freq.save()
        return Response({'detail': 'Friend request rejected'})


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
