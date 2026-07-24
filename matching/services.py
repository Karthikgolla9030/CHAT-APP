from .models import MatchQueue, MatchRequest, MatchHistory
from accounts.models import Profile
from django.db.models import Q


def get_queue(user):
    return MatchQueue.objects.filter(user=user, is_active=True).first()


def leave_queue(user):
    MatchQueue.objects.filter(user=user).delete()


def get_recent_matches(user):
    return MatchHistory.objects.filter(Q(user1=user) | Q(user2=user)).order_by('-matched_at')[:20]


def get_active_requests(user):
    return MatchRequest.objects.filter(receiver=user, status='pending')


def get_sent_requests(user):
    return MatchRequest.objects.filter(sender=user, status='pending')
