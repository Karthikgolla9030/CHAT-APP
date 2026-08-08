import time
import json
import logging
from django.db.models import Q
from django.utils import timezone
from accounts.models import Profile, UserInterest, User
from matchmaking.models import MatchQueue, MatchHistory, SkippedUser
from friends.models import BlockedUser, Friendship
from common.redis_client import get_redis_client
from common.services.session import SessionService
from common.services.presence import PresenceService, STATUS_SEARCHING

logger = logging.getLogger(__name__)

MAX_MATCH_ENCOUNTERS = 3  # Requirement 8: Maximum 3 encounters between same pair in random chat

class MatchmakingService:
    @staticmethod
    def join_queue(user, filters):
        """
        Add or update user entry in matchmaking queue in both DB and Redis.
        Sets user presence to 'searching'.
        """
        redis_c = get_redis_client()
        user_id = user.id
        now = time.time()

        payload = {
            'user_id': str(user_id),
            'username': user.username,
            'gender': filters.get('gender') or getattr(getattr(user, 'profile', None), 'gender', 'prefer_not_to_say'),
            'looking_for': filters.get('looking_for') or getattr(getattr(user, 'profile', None), 'looking_for', 'anyone'),
            'interests': json.dumps(filters.get('interests') or []),
            'language': getattr(getattr(user, 'profile', None), 'language', 'English'),
            'country': getattr(getattr(user, 'profile', None), 'country', ''),
            'entered_at': str(now)
        }

        # Save to Redis hash
        redis_c.hset(f"queue_entry:{user_id}", mapping=payload)
        redis_c.expire(f"queue_entry:{user_id}", 600)  # 10 min TTL

        # Update MatchQueue model in DB for persistence & backward compatibility
        MatchQueue.objects.update_or_create(
            user=user,
            defaults={'preferences': filters, 'is_active': True}
        )

        PresenceService.set_presence(user_id, STATUS_SEARCHING)
        return payload

    @staticmethod
    def leave_queue(user):
        """Remove user from matchmaking queue."""
        redis_c = get_redis_client()
        user_id = user.id if hasattr(user, 'id') else user
        redis_c.delete(f"queue_entry:{user_id}")
        MatchQueue.objects.filter(user_id=user_id).delete()

    @staticmethod
    def calculate_score(user1_data, user2_data, elapsed_seconds=0):
        """
        Calculates similarity score between two users.
        Primary: Shared interests ratio
        Secondary: Waiting time bonus
        Tertiary: Language match
        Fourth: Country match
        """
        score = 0.5

        # 1. Gender / Looking For hard check
        p1_g = user1_data.get('gender')
        p1_lf = user1_data.get('looking_for')
        p2_g = user2_data.get('gender')
        p2_lf = user2_data.get('looking_for')

        if p1_lf and p1_lf != 'anyone' and p1_lf != p2_g:
            return 0.0
        if p2_lf and p2_lf != 'anyone' and p2_lf != p1_g:
            return 0.0

        # 2. Interest Overlap (Primary)
        try:
            raw1 = user1_data.get('interests', '[]')
            ints1 = set(json.loads(raw1) if isinstance(raw1, str) else raw1)
        except Exception:
            ints1 = set()

        try:
            raw2 = user2_data.get('interests', '[]')
            ints2 = set(json.loads(raw2) if isinstance(raw2, str) else raw2)
        except Exception:
            ints2 = set()

        overlap = ints1 & ints2
        if overlap:
            score += min(0.35, len(overlap) * 0.12)

        # 3. Language Match (Tertiary)
        l1 = (user1_data.get('language') or '').lower()
        l2 = (user2_data.get('language') or '').lower()
        if l1 and l2 and l1 == l2:
            score += 0.08

        # 4. Country Match (Fourth)
        c1 = (user1_data.get('country') or '').lower()
        c2 = (user2_data.get('country') or '').lower()
        if c1 and c2 and c1 in c2:
            score += 0.05

        # Secondary: Waiting time boost (relaxes score criteria over time)
        wait_bonus = min(0.20, (elapsed_seconds / 10.0) * 0.05)
        score += wait_bonus

        return max(0.1, min(1.0, score))

    @staticmethod
    def find_and_execute_match(user, filters):
        """
        Thread-safe match search using Redis Lock to prevent duplicate matching.
        Enforces MAX_MATCH_ENCOUNTERS limit (Req 8).
        Returns (partner_user, score, common_interests, room) or (None, 0, [], None).
        """
        redis_c = get_redis_client()
        user_id = user.id
        my_payload = MatchmakingService.join_queue(user, filters)

        # Acquire atomic Redis lock
        acquired = redis_c.set("lock:matchmaking", str(user_id), nx=True, ex=5)

        try:
            # Check if user was already matched by a parallel process while waiting
            existing_room = SessionService.get_user_active_room_id(user_id)
            if existing_room:
                return None, 0, [], None

            # Efficient bulk query for candidate users in MatchQueue
            candidates_qs = list(MatchQueue.objects.filter(is_active=True).exclude(user_id=user_id).select_related('user', 'user__profile'))
            if not candidates_qs:
                return None, 0, [], None

            # Exclusion 1: Blocked Users
            blocked_ids = set(BlockedUser.objects.filter(blocker_id=user_id).values_list('blocked_id', flat=True)) | \
                          set(BlockedUser.objects.filter(blocked_id=user_id).values_list('blocker_id', flat=True))

            my_interests_list = filters.get('interests') or list(UserInterest.objects.filter(user=user).values_list('interest__name', flat=True))
            my_interests_set = set(x.lower() for x in my_interests_list)

            try:
                my_entered_at = float(my_payload.get('entered_at', time.time()))
            except Exception:
                my_entered_at = time.time()
            elapsed = time.time() - my_entered_at

            # Evaluate all available candidates
            best_partner = None
            best_score = -1.0
            best_common = []
            
            scored_candidates = []
            for candidate in candidates_qs:
                candidate_id = candidate.user_id
                candidate_user = candidate.user

                # Do not match if blocked
                if candidate_id in blocked_ids:
                    continue

                # Check if candidate is already in an active session
                if SessionService.get_user_active_room_id(candidate_id):
                    continue

                # Fetch candidate's matching payload
                cand_data = redis_c.hgetall(f"queue_entry:{candidate_id}")
                if not cand_data:
                    # Stale DB entry, payload expired from Redis
                    MatchQueue.objects.filter(user_id=candidate_id).update(is_active=False)
                    continue

                # Requirement 8: Check encounter limit (max 3 times unless friends)
                u1, u2 = (user_id, candidate_id) if user_id < candidate_id else (candidate_id, user_id)
                encounter_count = MatchHistory.objects.filter(user1_id=u1, user2_id=u2).count()
                
                from django.conf import settings
                if encounter_count >= MAX_MATCH_ENCOUNTERS and not getattr(settings, 'DEBUG', False):
                    is_friend = Friendship.objects.filter(user1_id=u1, user2_id=u2).exists()
                    if not is_friend:
                        logger.info(f"Skipping candidate {candidate_id} for user {user_id} — encounter count {encounter_count} >= {MAX_MATCH_ENCOUNTERS}")
                        continue

                cand_data = redis_c.hgetall(f"queue_entry:{candidate_id}")
                if not cand_data:
                    cand_profile = getattr(candidate_user, 'profile', None)
                    cand_prefs = cand_obj.preferences or {}
                    cand_data = {
                        'user_id': str(candidate_id),
                        'username': candidate_user.username,
                        'gender': cand_prefs.get('gender') or getattr(cand_profile, 'gender', 'prefer_not_to_say'),
                        'looking_for': cand_prefs.get('looking_for') or getattr(cand_profile, 'looking_for', 'anyone'),
                        'interests': json.dumps(cand_prefs.get('interests') or []),
                        'language': getattr(cand_profile, 'language', 'English'),
                        'country': getattr(cand_profile, 'country', ''),
                        'entered_at': str(time.time())
                    }

                score = MatchmakingService.calculate_score(my_payload, cand_data, elapsed)
                if score > 0.0:
                    scored_candidates.append((candidate_user, cand_data, score))

            if not scored_candidates:
                return None, 0, [], None

            # Sort by highest similarity score
            scored_candidates.sort(key=lambda x: x[2], reverse=True)
            best_partner, best_data, best_score = scored_candidates[0]

            # Compute common interests
            try:
                raw_p_ints = best_data.get('interests', '[]')
                partner_interests_list = json.loads(raw_p_ints) if isinstance(raw_p_ints, str) else raw_p_ints
            except Exception:
                partner_interests_list = list(UserInterest.objects.filter(user=best_partner).values_list('interest__name', flat=True))

            partner_interests_set = set(x.lower() for x in partner_interests_list)
            common_interests = list(my_interests_set & partner_interests_set)

            # Atomically remove both users from Queue
            MatchmakingService.leave_queue(user)
            MatchmakingService.leave_queue(best_partner)

            # Record match encounter in MatchHistory (Req 8)
            u1, u2 = (user, best_partner) if user.id < best_partner.id else (best_partner, user)
            MatchHistory.objects.create(user1=u1, user2=u2, match_score=best_score)

            # Create single active random chat session
            room = SessionService.create_session(user, best_partner, match_score=best_score, room_type='random')

            return best_partner, best_score, common_interests, room

        finally:
            if acquired:
                redis_c.delete("lock:matchmaking")
