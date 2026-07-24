from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponseNotFound, HttpResponseServerError
from django.contrib.auth.decorators import login_required
import logging

logger = logging.getLogger(__name__)


def home(request):
    return render(request, 'core/home.html')


def dashboard(request):
    if not request.user.is_authenticated:
        return redirect('accounts:login')
    profile = getattr(request.user, 'profile', None)
    if not profile:
        from accounts.models import Profile
        profile = Profile.objects.create(user=request.user, username=request.user.username)
    return render(request, 'core/dashboard.html', {'profile': profile})


def handler404(request, exception=None):
    return render(request, 'core/404.html', status=404)


def handler500(request):
    return render(request, 'core/500.html', status=500)


def handler403(request, exception=None):
    return render(request, 'core/403.html', status=403)


@login_required
def search_page(request):
    return render(request, 'matching/search.html')


@login_required
def settings_page(request):
    return render(request, 'accounts/settings.html')


@login_required
def blocked_users(request):
    return render(request, 'accounts/blocked_users.html')


@login_required
def reports_list(request):
    return render(request, 'reports/reports_list.html')
