from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .models import Notification


@login_required
def notifications_view(request):
    return render(request, 'notifications/notifications.html')


@login_required
def api_notifications(request):
    notes = Notification.objects.filter(recipient=request.user).order_by('-created_at')[:50]
    data = []
    for n in notes:
        data.append({'id': str(n.id), 'type': n.notification_type, 'title': n.title, 'message': n.message, 'is_read': n.is_read, 'created_at': n.created_at})
    return JsonResponse({'notifications': data})


@login_required
def api_mark_read(request, notification_id):
    if request.method == 'POST':
        Notification.objects.filter(id=notification_id, recipient=request.user).update(is_read=True)
        return JsonResponse({'detail': 'Marked as read'})
    return JsonResponse({'detail': 'Method not allowed'}, status=405)


@login_required
def api_mark_all_read(request):
    if request.method == 'POST':
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return JsonResponse({'detail': 'All marked as read'})
    return JsonResponse({'detail': 'Method not allowed'}, status=405)
