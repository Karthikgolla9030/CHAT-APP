from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q
from .models import MatchQueue, MatchRequest, MatchHistory
from chat.models import ChatRoom
from accounts.models import Profile
from accounts.services import get_online_status
import random
import logging

logger = logging.getLogger(__name__)


@login_required
def search_chat_view(request):
    return render(request, 'matching/search.html')


@login_required
def matched_user_demo(request):
    return render(request, 'matching/matched_user.html')


@login_required
def api_join_queue(request):
    if request.method == 'POST':
        try:
            prefs = json.loads(request.body) if request.body else {}
        except Exception:
            prefs = {}
        queue, created = MatchQueue.objects.get_or_create(
            user=request.user,
            defaults={'preferences': prefs, 'match_mode': prefs.get('match_mode', 'random'), 'is_active': True}
        )
        if not created:
            queue.preferences = prefs
            queue.match_mode = prefs.get('match_mode', 'random')
            queue.is_active = True
            queue.save()
        return JsonResponse({'status': 'joined'})
    return JsonResponse({'detail': 'Method not allowed'}, status=405)


@login_required
def api_leave_queue(request):
    if request.method == 'POST':
        MatchQueue.objects.filter(user=request.user).delete()
        return JsonResponse({'status': 'left'})
    return JsonResponse({'detail': 'Method not allowed'}, status=405)


@login_required
def api_search_status(request):
    queue = MatchQueue.objects.filter(user=request.user, is_active=True).first()
    return JsonResponse({'active': bool(queue), 'mode': queue.match_mode if queue else None})


@login_required
def api_find_match(request):
    user = request.user
    queue = MatchQueue.objects.filter(user=user, is_active=True).first()
    if not queue:
        return JsonResponse({'status': 'not_in_queue'})

    prefs = queue.preferences

    candidates = MatchQueue.objects.filter(is_active=True).exclude(user=user)
    if not candidates.exists():
        return JsonResponse({'status': 'searching', 'phase': 'waiting'})

    scored = []
    for c in candidates:
        score = calculate_match_score(user, c.user, prefs)
        scored.append((c, score))

    scored.sort(key=lambda x: x[1], reverse=True)

    best_queue, best_score = scored[0]
    mode = queue.match_mode
    threshold = 0.0 if mode == 'random' else (0.1 if mode == 'balanced' else 0.3)
    if best_score >= threshold:
        partner = best_queue.user
        MatchHistory.objects.create(user1=user, user2=partner, match_score=best_score)
        MatchQueue.objects.filter(user__in=[user, partner]).delete()

        user1 = min(user, partner, key=lambda u: u.id)
        user2 = max(user, partner, key=lambda u: u.id)
        room, _ = ChatRoom.objects.get_or_create(user1=user1, user2=user2, defaults={'status': 'active'})

        return JsonResponse({
            'status': 'matched',
            'room_id': str(room.id),
            'partner_id': str(partner.id),
            'partner_name': partner.username,
            'score': best_score,
        })

    if queue.entered_at < timezone.now() - timedelta(seconds=getattr(settings, 'chat_config', {}).get('MATCH_TIMEOUT', 30)):
        queue.match_mode = 'balanced'
        queue.save()
        return JsonResponse({'status': 'searching', 'phase': 'relaxing_filters'})

    return JsonResponse({'status': 'searching', 'phase': 'finding'})


def calculate_match_score(user1, user2, prefs):
    profile1 = user1.profile
    profile2 = user2.profile
    score = 0.0

    my_looking_for = prefs.get('looking_for', '')
    partner_gender = profile2.gender
    my_location = prefs.get('location', '')
    partner_location = getattr(profile2, 'state', '') or ''
    partner_country = profile2.country or ''
    my_interests = prefs.get('interests', '')

    if my_looking_for and my_looking_for != 'anyone':
        if my_looking_for != partner_gender:
            score -= 0.8
        else:
            score += 0.3

    if my_location:
        if my_location.lower() in partner_location.lower() or partner_location.lower() in my_location.lower():
            score += 0.3
        elif partner_country and profile1.country and partner_country.lower() == profile1.country.lower():
            score += 0.1

    if my_interests:
        interests_list = [x.strip().lower() for x in my_interests.split(',') if x.strip()]
        partner_interests = [x.lower() for x in profile2.interests] if profile2.interests else []
        if partner_interests:
            overlap = len(set(interests_list) & set(partner_interests))
            if overlap > 0:
                score += min(0.4, overlap * 0.15)

    return max(0.0, min(1.0, score + random.uniform(-0.05, 0.05)))
