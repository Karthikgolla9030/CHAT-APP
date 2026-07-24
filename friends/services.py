from .models import FriendRequest, Friendship, BlockedUser
from django.db.models import Q


def are_friends(user1, user2):
    return Friendship.objects.filter(user1=min(user1, user2, key=lambda u: u.id), user2=max(user1, user2, key=lambda u: u.id)).exists()


def get_friends(user):
    friendships = Friendship.objects.filter(Q(user1=user) | Q(user2=user))
    friends = []
    for f in friendships:
        friend = f.user2 if f.user1 == user else f.user1
        friends.append(friend)
    return friends


def get_pending_requests(user):
    return FriendRequest.objects.filter(receiver=user, status='pending')


def get_sent_requests(user):
    return FriendRequest.objects.filter(sender=user, status='pending')


def get_blocked(user):
    return BlockedUser.objects.filter(blocker=user)
