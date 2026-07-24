from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.db.models import Q
from .models import FriendRequest, BlockedUser, Friendship
from accounts.models import User
import logging

logger = logging.getLogger(__name__)


@login_required
def friends_list_view(request):
    return render(request, 'friends/friends_list.html')


@login_required
def api_send_request(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        user = get_object_or_404(User, username=username)
        if user == request.user:
            return JsonResponse({'detail': 'Cannot send request to yourself'}, status=400)
        if FriendRequest.objects.filter(sender=request.user, receiver=user, status='pending').exists():
            return JsonResponse({'detail': 'Request already pending'}, status=400)
        FriendRequest.objects.create(sender=request.user, receiver=user, message=request.POST.get('message', ''))
        return JsonResponse({'detail': 'Friend request sent'})
    return JsonResponse({'detail': 'Method not allowed'}, status=405)


@login_required
def api_respond(request, request_id):
    if request.method == 'POST':
        req = get_object_or_404(FriendRequest, id=request_id, receiver=request.user)
        action = request.POST.get('action')
        if action == 'accept':
            req.status = 'accepted'
            req.save()
            user1 = min(req.sender, req.receiver, key=lambda u: u.id)
            user2 = max(req.sender, req.receiver, key=lambda u: u.id)
            Friendship.objects.get_or_create(user1=user1, user2=user2)
            return JsonResponse({'detail': 'Accepted'})
        elif action == 'reject':
            req.status = 'rejected'
            req.save()
            return JsonResponse({'detail': 'Rejected'})
        return JsonResponse({'detail': 'Invalid action'}, status=400)
    return JsonResponse({'detail': 'Method not allowed'}, status=405)


@login_required
def api_block(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        user = get_object_or_404(User, username=username)
        BlockedUser.objects.get_or_create(blocker=request.user, blocked=user)
        return JsonResponse({'detail': 'User blocked'})
    return JsonResponse({'detail': 'Method not allowed'}, status=405)


@login_required
def api_unblock(request, user_id):
    if request.method == 'POST':
        user = get_object_or_404(User, id=user_id)
        BlockedUser.objects.filter(blocker=request.user, blocked=user).delete()
        return JsonResponse({'detail': 'User unblocked'})
    return JsonResponse({'detail': 'Method not allowed'}, status=405)


@login_required
def api_friends(request):
    user = request.user
    friendships = Friendship.objects.filter(Q(user1=user) | Q(user2=user))
    friends = []
    for f in friendships:
        friend = f.user2 if f.user1 == user else f.user1
        friends.append({'username': friend.username, 'display_name': getattr(friend.profile, 'display_name', ''), 'online': friend.profile.online_status})
    return JsonResponse({'friends': friends})
