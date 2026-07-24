from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Profile, Interest, UserInterest
from common.utils import generate_random_username

User = get_user_model()

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

def create_guest_user(nickname=None):
    base_name = nickname.strip() if nickname and nickname.strip() else "Guest"
    username = generate_random_username(prefix=f"{base_name}_")
    guest_email = f"{username.lower()}@guest.omniroute.local"
    user = User.objects.create_user(username=username, email=guest_email, is_guest=True)
    Profile.objects.create(user=user, display_name=base_name)
    return user

def update_user_interests(user, interest_names):
    UserInterest.objects.filter(user=user).delete()
    new_links = []
    for name in interest_names:
        clean_name = name.strip()
        if clean_name:
            interest_obj, _ = Interest.objects.get_or_create(name=clean_name)
            new_links.append(UserInterest(user=user, interest=interest_obj))
    UserInterest.objects.bulk_create(new_links)

def claim_guest_account(user, new_username, new_email, password):
    if not user.is_guest:
        raise ValueError("This account is already permanent and cannot be claimed again.")

    clean_username = new_username.strip()
    clean_email = new_email.strip().lower()

    if User.objects.filter(username__iexact=clean_username).exclude(id=user.id).exists():
        raise ValueError("Username is already taken by another user.")

    if User.objects.filter(email__iexact=clean_email).exclude(id=user.id).exists():
        raise ValueError("Email address is already registered.")

    user.username = clean_username
    user.email = clean_email
    user.set_password(password)
    user.is_guest = False
    user.save()

    if hasattr(user, 'profile'):
        user.profile.display_name = clean_username
        user.profile.save()

    return user
