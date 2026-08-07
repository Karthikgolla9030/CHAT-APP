from common.services.matchmaking import MatchmakingService

def calculate_match_score(user1, user2, prefs1):
    u1_data = {'gender': prefs1.get('gender'), 'looking_for': prefs1.get('looking_for'), 'interests': str(prefs1.get('interests') or [])}
    u2_data = {'gender': getattr(getattr(user2, 'profile', None), 'gender', 'prefer_not_to_say'), 'looking_for': getattr(getattr(user2, 'profile', None), 'looking_for', 'anyone')}
    return MatchmakingService.calculate_score(u1_data, u2_data)

def find_match_for_user(user, prefs):
    partner, score, common_interests, _ = MatchmakingService.find_and_execute_match(user, prefs)
    return partner, score, common_interests

def execute_match(user1, user2, match_score):
    from common.services.session import SessionService
    return SessionService.create_session(user1, user2, match_score)
