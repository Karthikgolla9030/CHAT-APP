from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.db.models import Q
from django.contrib.auth import get_user_model
from .models import Report
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


@login_required
def reports_list_view(request):
    return render(request, 'reports/reports_list.html')


@login_required
def api_submit_report(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        reason = request.POST.get('reason')
        description = request.POST.get('description', '')
        user = User.objects.filter(username=username).first()
        if not user:
            return JsonResponse({'detail': 'User not found'}, status=404)
        Report.objects.create(reporter=request.user, reported_user=user, reason=reason, description=description)
        return JsonResponse({'detail': 'Report submitted'})
    return JsonResponse({'detail': 'Method not allowed'}, status=405)


@login_required
def api_my_reports(request):
    reports = Report.objects.filter(reporter=request.user).order_by('-created_at')[:50]
    data = []
    for r in reports:
        data.append({'id': str(r.id), 'reported_user': r.reported_user.username, 'reason': r.reason, 'status': r.status, 'created_at': r.created_at})
    return JsonResponse({'reports': data})
