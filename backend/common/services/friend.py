import logging
from django.db import transaction
from django.db.models import Q
from friends.models import FriendRequest, Friendship, BlockedUser

logger = logging.getLogger(__name__)

STATUS_NONE = 'none'
STATUS_REQUEST_SENT = 'request_sent'
STATUS_REQUEST_RECEIVED = 'request_received'
STATUS_FRIENDS = 'friends'
STATUS_REJECTED = 'rejected'

class FriendService:
    @staticmethod
    def get_relationship(user, partner_user):
        """Returns the relationship status between user and partner_user."""
        if not user or not partner_user or user == partner_user:
            return {'status': STATUS_NONE}

        # Check existing friendship
        if Friendship.objects.filter(
            Q(user1=user, user2=partner_user) | Q(user1=partner_user, user2=user)
        ).exists():
            return {'status': STATUS_FRIENDS}

        # Check pending request sent by user
        sent = FriendRequest.objects.filter(sender=user, receiver=partner_user, status='pending').first()
        if sent:
            return {'status': STATUS_REQUEST_SENT, 'request_id': str(sent.id)}

        # Check pending request received by user
        received = FriendRequest.objects.filter(sender=partner_user, receiver=user, status='pending').first()
        if received:
            return {
                'status': STATUS_REQUEST_RECEIVED,
                'request_id': str(received.id),
                'sender_username': partner_user.username
            }

        return {'status': STATUS_NONE}

    @staticmethod
    @transaction.atomic
    def send_request(sender, target_user):
        """
        Send a friend request.
        Handles simultaneous cross requests atomically (auto-accepts if reverse request exists).
        Prevents self requests, duplicate requests, and requests to existing friends.
        """
        if sender.id == target_user.id:
            raise ValueError("Cannot send friend request to yourself.")

        u1, u2 = (sender, target_user) if sender.id < target_user.id else (target_user, sender)

        # 1. Check if already friends
        if Friendship.objects.filter(user1=u1, user2=u2).exists():
            return {'status': STATUS_FRIENDS, 'detail': 'Already friends'}

        # 2. Check for simultaneous / reverse pending request (select_for_update for atomicity)
        reverse_req = FriendRequest.objects.select_for_update().filter(
            sender=target_user, receiver=sender, status='pending'
        ).first()

        if reverse_req:
            # Auto-accept cross request
            reverse_req.status = 'accepted'
            reverse_req.save()
            Friendship.objects.get_or_create(user1=u1, user2=u2)
            return {
                'status': STATUS_FRIENDS,
                'detail': 'Cross request auto-accepted! You are now friends.'
            }

        # 3. Create or get existing request
        freq, created = FriendRequest.objects.select_for_update().get_or_create(
            sender=sender, receiver=target_user,
            defaults={'status': 'pending'}
        )

        if not created and freq.status == 'rejected':
            # Re-open rejected request as pending
            freq.status = 'pending'
            freq.save()

        return {
            'status': STATUS_REQUEST_SENT,
            'request_id': str(freq.id),
            'detail': 'Friend request sent'
        }

    @staticmethod
    @transaction.atomic
    def accept_request(receiver, request_id):
        """Accept a pending friend request."""
        try:
            freq = FriendRequest.objects.select_for_update().get(id=request_id, receiver=receiver, status='pending')
        except FriendRequest.DoesNotExist:
            raise ValueError("Friend request not found or already processed.")

        freq.status = 'accepted'
        freq.save()

        sender = freq.sender
        u1, u2 = (receiver, sender) if receiver.id < sender.id else (sender, receiver)
        Friendship.objects.get_or_create(user1=u1, user2=u2)

        return {
            'status': STATUS_FRIENDS,
            'sender_id': sender.id,
            'receiver_id': receiver.id,
            'detail': 'Friend request accepted'
        }

    @staticmethod
    @transaction.atomic
    def reject_request(receiver, request_id):
        """Reject a pending friend request."""
        try:
            freq = FriendRequest.objects.select_for_update().get(id=request_id, receiver=receiver, status='pending')
        except FriendRequest.DoesNotExist:
            raise ValueError("Friend request not found or already processed.")

        sender_id = freq.sender_id
        freq.status = 'rejected'
        freq.save()

        return {
            'status': STATUS_REJECTED,
            'sender_id': sender_id,
            'receiver_id': receiver.id,
            'detail': 'Friend request declined'
        }

    @staticmethod
    @transaction.atomic
    def cancel_request(sender, request_id):
        """Cancel a pending friend request sent by sender."""
        try:
            freq = FriendRequest.objects.select_for_update().get(id=request_id, sender=sender, status='pending')
        except FriendRequest.DoesNotExist:
            raise ValueError("Friend request not found or already processed.")

        freq.delete()

        return {
            'status': STATUS_NONE,
            'detail': 'Friend request cancelled'
        }

    @staticmethod
    @transaction.atomic
    def remove_friend(user, friend_user):
        """Remove friendship between user and friend_user."""
        u1, u2 = (user, friend_user) if user.id < friend_user.id else (friend_user, user)
        deleted_count, _ = Friendship.objects.filter(user1=u1, user2=u2).delete()

        # Also reset any old accepted friend requests so relationship returns to none
        FriendRequest.objects.filter(
            Q(sender=user, receiver=friend_user) | Q(sender=friend_user, receiver=user)
        ).delete()

        return {
            'status': STATUS_NONE,
            'detail': 'Friend removed successfully'
        }
