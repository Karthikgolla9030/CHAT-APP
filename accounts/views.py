from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .forms import RegisterForm, GuestLoginForm, LoginForm, ProfileForm
from .services import generate_guest_user
import logging

logger = logging.getLogger(__name__)


def register_view(request):
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, 'Account created successfully!')
            return redirect('dashboard')
    else:
        form = RegisterForm()
    return render(request, 'accounts/register.html', {'form': form})


def guest_login_view(request):
    if request.method == 'POST':
        form = GuestLoginForm(request.POST)
        if form.is_valid():
            user = generate_guest_user(nickname=form.cleaned_data.get('nickname', ''))
            login(request, user)
            messages.info(request, f'Welcome, {user.username}!')
            return redirect('core:dashboard')
    else:
        form = GuestLoginForm()
    return render(request, 'accounts/guest_login.html', {'form': form})


def login_view(request):
    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            login(request, form.get_user())
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'detail': 'Logged in', 'redirect': '/dashboard/'})
            messages.success(request, f'Welcome back, {request.user.username}!')
            return redirect('dashboard')
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'detail': form.errors}, status=400)
    else:
        form = LoginForm()
    return render(request, 'accounts/login.html', {'form': form})


def logout_view(request):
    from django.contrib.auth import logout
    logout(request)
    messages.info(request, 'You have been logged out.')
    return redirect('home')


@login_required
def profile_view(request):
    profile = request.user.profile
    return render(request, 'accounts/profile.html', {'profile': profile})


@login_required
def edit_profile(request):
    profile = request.user.profile
    if request.method == 'POST':
        form = ProfileForm(request.POST, request.FILES, instance=profile)
        if form.is_valid():
            form.save()
            messages.success(request, 'Profile updated successfully!')
            return redirect('profile')
    else:
        form = ProfileForm(instance=profile)
    return render(request, 'accounts/edit_profile.html', {'form': form})


@login_required
def convert_guest(request):
    if not request.user.is_guest:
        messages.error(request, 'Only guest accounts can convert.')
        return redirect('dashboard')
    return render(request, 'accounts/convert_guest.html')


@login_required
def api_convert_guest(request):
    if request.method == 'POST':
        data = {'email': request.POST.get('email'), 'password': request.POST.get('password'), 'display_name': request.POST.get('display_name', '')}
        try:
            from accounts.services import convert_guest_to_user
            result = convert_guest_to_user(request.user, data)
            if result.get('success'):
                from django.contrib.auth import update_session_auth_hash
                update_session_auth_hash(request, request.user)
                return JsonResponse({'detail': 'Account converted successfully'})
            return JsonResponse({'detail': result.get('error', 'Conversion failed')}, status=400)
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=500)
    return JsonResponse({'detail': 'Method not allowed'}, status=405)
