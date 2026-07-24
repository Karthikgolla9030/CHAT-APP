from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.http import JsonResponse
from .models import ChatRoom, Message, TypingStatus
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


@login_required
def chat_view(request, room_id):
    room = get_object_or_404(ChatRoom, id=room_id)
    if request.user not in [room.user1, room.user2]:
        return redirect('home')
    other = room.user2 if room.user1 == request.user else room.user1
    common_interests = []
    try:
        my_interests = set(x.lower() for x in request.user.profile.interests) if request.user.profile.interests else set()
        other_interests = set(x.lower() for x in other.profile.interests) if other.profile.interests else set()
        common_interests = list(my_interests & other_interests)[:8]
    except Exception:
        pass
    return render(request, 'chat/room.html', {'room': room, 'other': other, 'common_interests': common_interests})


@login_required
def api_rooms(request):
    user = request.user
    rooms = ChatRoom.objects.filter(Q(user1=user) | Q(user2=user), status='active').order_by('-last_activity')[:50]
    data = []
    for room in rooms:
        other = room.user2 if room.user1 == user else room.user1
        last_msg = room.messages.filter(is_deleted=False).last()
        unread = room.messages.filter(is_deleted=False, status='sent').exclude(sender=user).count()
        data.append({
            'id': str(room.id),
            'other_user': {'username': other.username, 'display_name': getattr(other.profile, 'display_name', '')},
            'status': room.status,
            'last_activity': room.last_activity,
            'last_message': last_msg.content if last_msg else '',
            'unread_count': unread,
        })
    return JsonResponse({'rooms': data})


@login_required
def api_room_detail(request, room_id):
    room = get_object_or_404(ChatRoom, id=room_id)
    if request.user not in [room.user1, room.user2]:
        return JsonResponse({'detail': 'Forbidden'}, status=403)
    messages_qs = room.messages.filter(is_deleted=False).order_by('created_at')[:200]
    messages = [
        {'id': str(m.id), 'sender': m.sender.username, 'content': m.content, 'status': m.status, 'created_at': m.created_at}
        for m in messages_qs
    ]
    return JsonResponse({'messages': messages})


@login_required
def api_disconnect(request, room_id):
    room = get_object_or_404(ChatRoom, id=room_id)
    if request.user not in [room.user1, room.user2]:
        return JsonResponse({'detail': 'Forbidden'}, status=403)
    room.status = 'ended'
    room.ended_at = timezone.now()
    room.save()
    return JsonResponse({'detail': 'Disconnected'})


@login_required
def api_clear_chat(request, room_id):
    room = get_object_or_404(ChatRoom, id=room_id)
    if request.user not in [room.user1, room.user2]:
        return JsonResponse({'detail': 'Forbidden'}, status=403)
    room.messages.filter(sender=request.user).update(is_deleted=True)
    return JsonResponse({'detail': 'Chat cleared'})
