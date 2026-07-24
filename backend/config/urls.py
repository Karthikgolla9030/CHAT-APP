from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def root_api_status(request):
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
    path('', root_api_status, name='root-status'),
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/friends/', include('friends.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
