import os
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.http import JsonResponse

def api_status_view(request):
    return JsonResponse({
        'status': 'online',
        'service': 'OmniRoute Backend API & WebSockets Engine',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/v1/auth/',
            'friends': '/api/v1/friends/',
            'admin': '/admin/',
            'websockets': {
                'matchmaking': '/ws/match/',
                'chat': '/ws/chat/<room_id>/',
                'notifications': '/ws/notifications/'
            }
        }
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/status/', api_status_view, name='api-status'),
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/friends/', include('friends.urls')),
    path('api/v1/chat/', include('chat.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# React SPA Fallback Route (Serves index.html for all frontend routes)
urlpatterns += [
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html'), name='spa'),
]
