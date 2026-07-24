import random
import uuid
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Profile

User = get_user_model()


def generate_guest_user(nickname=''):
    adjectives = ['Shadow', 'Silent', 'Night', 'Swift', 'Bright', 'Golden', 'Silver', 'Gentle', 'Wild', 'Cosmic']
    nouns = ['Tiger', 'Wolf', 'Fox', 'Eagle', 'Hawk', 'Dragon', 'Phoenix', 'Panda', 'Lion', 'Raven']
    adj = random.choice(adjectives)
    noun = random.choice(nouns)
    num = random.randint(10, 99)
    username = f"{adj}{noun}{num}"

    if User.objects.filter(username=username).exists():
        username = f"{username}{random.randint(100,999)}"

    user = User.objects.create_user(
        username=username,
        password=uuid.uuid4().hex,
        is_guest=True,
    )
    profile, created = Profile.objects.get_or_create(
        user=user,
        defaults={
            'username': username,
            'display_name': nickname or username,
        }
    )
    if not created:
        profile.username = username
        profile.display_name = nickname or username
        profile.save()
    return user


def convert_guest_to_user(guest_user, data):
    email = data.get('email')
    password = data.get('password')
    display_name = data.get('display_name', '')
    if not email or not password:
        return {'error': 'Email and password are required'}
    if User.objects.filter(email=email).exclude(id=guest_user.id).exists():
        return {'error': 'Email already exists'}
    guest_user.email = email
    guest_user.is_guest = False
    guest_user.set_password(password)
    guest_user.save()
    if display_name:
        profile = guest_user.profile
        profile.display_name = display_name
        profile.save()
    from accounts.models import GuestConversion
    GuestConversion.objects.filter(guest_user=guest_user).update(converted=True)
    return {'success': True}


def set_user_online(user):
    Profile.objects.filter(user=user).update(online_status='online')


def set_user_offline(user):
    Profile.objects.filter(user=user).update(online_status='offline')


def get_online_status(user):
    profile = getattr(user, 'profile', None)
    return profile.online_status if profile else 'offline'
