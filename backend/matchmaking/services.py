import random
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from accounts.models import Profile, UserInterest
from accounts.services import update_user_interests
from .models import MatchQueue, MatchHistory, SkippedUser
from chat.models import ChatRoom
from friends.models import BlockedUser

def calculate_match_score(user1, user2, prefs1):
    p1 = getattr(user1, 'profile', None)
    p2 = getattr(user2, 'profile', None)
    if not p1 or not p2:
        return 0.0

    score = 0.5  # Base match compatibility score

    # 1. Interest Overlap (Normalized)
    req_interests = prefs1.get('interests')
    if req_interests and isinstance(req_interests, list) and len(req_interests) > 0:
        ui1 = set(x.lower() for x in req_interests)
    else:
        ui1 = set(UserInterest.objects.filter(user=user1).values_list('interest__name', flat=True))
        ui1 = set(x.lower() for x in ui1)

    ui2 = set(UserInterest.objects.filter(user=user2).values_list('interest__name', flat=True))
    ui2 = set(x.lower() for x in ui2)

    overlap = ui1 & ui2
    if overlap:
        score += min(0.35, len(overlap) * 0.15)

    # 2. Gender & Looking For Preference
    my_gender = prefs1.get('gender') or p1.gender
    looking_for = prefs1.get('looking_for') or p1.looking_for
    partner_gender = p2.gender

    if looking_for and looking_for != 'anyone':
        if looking_for == partner_gender:
            score += 0.20
        else:
            return 0.0  # Incompatible gender preference

    # Check partner's looking_for preference against my_gender
    partner_queue = MatchQueue.objects.filter(user=user2).first()
    partner_looking_for = (partner_queue.preferences.get('looking_for') if partner_queue and partner_queue.preferences else None) or p2.looking_for
    if partner_looking_for and partner_looking_for != 'anyone':
        if partner_looking_for == my_gender:
            score += 0.20
        else:
            return 0.0  # Partner's preference excludes me

    # 3. Language Match
    req_lang = prefs1.get('language') or p1.language
    if req_lang and p2.language and req_lang.lower() == p2.language.lower():
        score += 0.10

    # 4. Country Match
    req_country = prefs1.get('country') or p1.country
    if req_country and p2.country and req_country.lower() in p2.country.lower():
        score += 0.10

    return max(0.1, min(1.0, score + random.uniform(-0.02, 0.02)))


def find_match_for_user(user, prefs):
    profile = getattr(user, 'profile', None)
    if profile:
        updated = False
        if prefs.get('gender') and profile.gender != prefs.get('gender'):
            profile.gender = prefs.get('gender')
            updated = True
        if prefs.get('looking_for') and profile.looking_for != prefs.get('looking_for'):
            profile.looking_for = prefs.get('looking_for')
            updated = True
        if updated:
            profile.save()

    if prefs.get('interests') and isinstance(prefs.get('interests'), list) and len(prefs.get('interests')) > 0:
        update_user_interests(user, prefs.get('interests'))

    # Exclusion 1: Blocked Users (Hard requirement)
    blocked_ids = set(BlockedUser.objects.filter(blocker=user).values_list('blocked_id', flat=True)) | \
                  set(BlockedUser.objects.filter(blocked=user).values_list('blocker_id', flat=True))

    # Exclusion 2: Skipped Users in last 15 minutes (Soft requirement for testing & small queues)
    skipped_ids = set(SkippedUser.objects.filter(user=user, created_at__gte=timezone.now() - timedelta(minutes=15)).values_list('skipped_user_id', flat=True))

    exclude_ids = blocked_ids | skipped_ids | {user.id}

    # 1. First try unskipped active candidates
    candidates = MatchQueue.objects.filter(is_active=True).exclude(user_id__in=exclude_ids)
    
    # 2. Fallback: If no unskipped candidates exist, allow re-matching active users (excluding blocked and self)
    if not candidates.exists():
        candidates = MatchQueue.objects.filter(is_active=True).exclude(user_id__in=(blocked_ids | {user.id}))

    if not candidates.exists():
        return None, 0.0, []

    scored = []
    my_interests = set(UserInterest.objects.filter(user=user).values_list('interest__name', flat=True))

    for candidate in candidates:
        candidate_user = candidate.user
        score = calculate_match_score(user, candidate_user, prefs)
        if score > 0.0:
            scored.append((candidate_user, score))

    if not scored:
        return None, 0.0, []

    scored.sort(key=lambda x: x[1], reverse=True)
    best_partner, best_score = scored[0]

    # Calculate common interest list to return to frontend
    partner_interests = set(UserInterest.objects.filter(user=best_partner).values_list('interest__name', flat=True))
    common_interests = list(my_interests & partner_interests)

    return best_partner, best_score, common_interests


def execute_match(user1, user2, match_score):
    # Remove both from MatchQueue
    MatchQueue.objects.filter(user__in=[user1, user2]).delete()

    # Log Match History
    u1, u2 = (user1, user2) if user1.id < user2.id else (user2, user1)
    MatchHistory.objects.create(user1=u1, user2=u2, match_score=match_score)

    # Create active ChatRoom
    room, _ = ChatRoom.objects.get_or_create(user1=u1, user2=u2, defaults={'status': 'active'})
    if room.status != 'active':
        room.status = 'active'
        room.save()

    return room
