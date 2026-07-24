from .models import ChatRoom, Message, TypingStatus


def create_chat_room(user1, user2):
    room, created = ChatRoom.objects.get_or_create(
        user1=min(user1, user2, key=lambda u: u.id),
        user2=max(user1, user2, key=lambda u: u.id),
        defaults={'status': 'active'}
    )
    return room


def get_recent_chats(user):
    return ChatRoom.objects.filter(Q(user1=user) | Q(user2=user)).order_by('-last_activity')[:50]


def get_room_messages(room, limit=200):
    return room.messages.filter(is_deleted=False).order_by('created_at')[:limit]


def delete_message(msg, user):
    if msg.sender == user:
        msg.is_deleted = True
        msg.save()
        return True
    return False


def is_user_in_room(user, room):
    return user in [room.user1, room.user2]
