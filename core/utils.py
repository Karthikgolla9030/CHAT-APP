import logging
import uuid
from typing import Dict, Any
from django.conf import settings
from rest_framework.exceptions import APIException
from django.core.exceptions import PermissionDenied

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    from rest_framework.views import exception_handler
    response = exception_handler(exc, context)
    if response is not None:
        response.data['status_code'] = response.status_code
        if response.status_code == 500:
            logger.error(f"Server Error: {exc}", exc_info=True)
    elif settings.DEBUG:
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return response


def log_user_action(user, action, details=''):
    logger.info(f"User {user.username if user and user.is_authenticated else 'Anonymous'} - {action}: {details}")


def generate_guest_username():
    adjectives = ['Shadow', 'Silent', 'Night', 'Swift', 'Bright', 'Dark', 'Golden', 'Silver', 'Gentle', 'Wild']
    nouns = ['Tiger', 'Wolf', 'Fox', 'Eagle', 'Hawk', 'Dragon', 'Phoenix', 'Panda', 'Lion', 'Raven']
    adj = adjectives[int(uuid.uuid4()) % len(adjectives)]
    noun = nouns[int(uuid.uuid4()) % len(nouns)]
    num = (int(uuid.uuid4()) % 100)
    return f"{adj}{noun}{num}"


def calculate_profile_completion(profile):
    fields = [
        'username', 'display_name', 'age', 'gender', 'country',
        'languages', 'interests', 'bio', 'profile_picture', 'looking_for'
    ]
    filled = 0
    for field in fields:
        val = getattr(profile, field, None)
        if val and str(val).strip():
            filled += 1
    return round((filled / len(fields)) * 100)


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def is_rate_limited(key, limit, window):
    from django.core.cache import cache
    count = cache.get(key, 0)
    if count >= limit:
        return True
    cache.set(key, count + 1, window)
    return False


def sanitize_text(text):
    if not text:
        return ''
    from bleach import clean
    return clean(text, tags=[], strip=True)


def truncate_text(text, length=100):
    if len(text) > length:
        return text[:length].rsplit(' ', 1)[0] + '...'
    return text


def get_user_badges(user):
    badges = []
    from accounts.models import Profile
    from django.db.models import Q
    from friends.models import FriendRequest
    from friends.constants import FriendStatus
    from chat.models import Message

    profile = Profile.objects.filter(user=user).first()
    if not profile:
        return badges

    messages_sent = Message.objects.filter(sender=user).count()
    if messages_sent >= 1000:
        badges.append('chatterbox')
    if messages_sent >= 100:
        badges.append('social')

    friends_count = FriendRequest.objects.filter(
        Q(sender=user) | Q(receiver=user),
        status=FriendStatus.ACCEPTED
    ).count()
    if friends_count >= 10:
        badges.append('friendly')

    completion = calculate_profile_completion(profile)
    if completion >= 80:
        badges.append('complete')
    return badges
