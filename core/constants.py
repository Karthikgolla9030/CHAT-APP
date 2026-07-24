from enum import Enum


class UserStatus(Enum):
    ONLINE = 'online'
    OFFLINE = 'offline'
    SEARCHING = 'searching'
    BUSY = 'busy'
    IN_CHAT = 'in_chat'

    @classmethod
    def choices(cls):
        return [(key.value, key.value.title()) for key in cls]


class Gender(Enum):
    MALE = 'male'
    FEMALE = 'female'
    NON_BINARY = 'non_binary'
    OTHER = 'other'
    PREFER_NOT_TO_SAY = 'prefer_not_to_say'

    @classmethod
    def choices(cls):
        return [(key.value, key.value.title()) for key in cls]


class LookingFor(Enum):
    FRIENDS = 'friends'
    CASUAL = 'casual'
    SERIOUS = 'serious'
    ANYTHING = 'anything'

    @classmethod
    def choices(cls):
        return [(key.value, key.value.title()) for key in cls]


class MatchMode(Enum):
    EXACT = 'exact'
    BALANCED = 'balanced'
    RANDOM = 'random'

    @classmethod
    def choices(cls):
        return [(key.value, key.value.title()) for key in cls]


class ReportReason(Enum):
    SPAM = 'spam'
    HARASSMENT = 'harassment'
    FAKE_PROFILE = 'fake_profile'
    ABUSE = 'abuse'
    ADULT_CONTENT = 'adult_content'
    OTHER = 'other'

    @classmethod
    def choices(cls):
        return [(key.value, key.value.replace('_', ' ').title()) for key in cls]


class ChatStatus(Enum):
    ACTIVE = 'active'
    ENDED = 'ended'
    REPORTED = 'reported'
    BLOCKED = 'blocked'

    @classmethod
    def choices(cls):
        return [(key.value, key.value.title()) for key in cls]


class FriendStatus(Enum):
    PENDING = 'pending'
    ACCEPTED = 'accepted'
    REJECTED = 'rejected'
    BLOCKED = 'blocked'

    @classmethod
    def choices(cls):
        return [(key.value, key.value.title()) for key in cls]


class NotificationType(Enum):
    FRIEND_REQUEST = 'friend_request'
    FRIEND_ACCEPTED = 'friend_accepted'
    NEW_MESSAGE = 'new_message'
    SYSTEM_MESSAGE = 'system_message'
    CHAT_INVITE = 'chat_invite'

    @classmethod
    def choices(cls):
        return [(key.value, key.value.replace('_', ' ').title()) for key in cls]


THEME_CHOICES = [
    ('light', 'Light'),
    ('dark', 'Dark'),
    ('auto', 'Auto'),
]

BAD_WORDS = [
    'spam', 'scam', 'hate', 'abuse', 'kill', 'threat',
]

CONVERSATION_STARTERS = [
    "What's your dream destination?",
    "If money wasn't an issue, what would you learn?",
    "What's your favorite movie of all time?",
    "If you could meet any historical figure, who would it be?",
    "What's the most adventurous thing you've ever done?",
    "What's your hidden talent?",
    "If you could live in any era, which would you choose?",
    "What's your idea of a perfect weekend?",
    "What's a book that changed your perspective?",
    "What's your go-to karaoke song?",
]
