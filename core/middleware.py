from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import logout
from django.shortcuts import redirect
from django.urls import reverse
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class OnlineStatusMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if request.user.is_authenticated:
            from accounts.services import set_user_online
            set_user_online(request.user)


class RateLimitMiddleware(MiddlewareMixin):
    def process_request(self, request):
        from core.utils import is_rate_limited
        path = request.path
        ip = request.META.get('REMOTE_ADDR')

        if path.startswith('/api/chat/') or path.startswith('/api/auth/'):
            key = f"rl:{ip}:{path.split('/')[-1] if path.endswith('/') else path.split('/')[-1]}"
            limit = getattr(settings, 'chat_config', {}).get('RATE_LIMIT_REQUESTS', 30)
            window = getattr(settings, 'chat_config', {}).get('RATE_LIMIT_WINDOW', 60)
            if is_rate_limited(key, limit, window):
                from django.http import JsonResponse
                return JsonResponse({'detail': 'Rate limit exceeded. Please try again later.'}, status=429)
