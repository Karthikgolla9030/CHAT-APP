import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path
from websocket.middleware import JWTAuthMiddleware
from matchmaking.consumers import MatchmakingConsumer
from chat.consumers import ChatConsumer
from notifications.consumers import NotificationConsumer

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': JWTAuthMiddleware(
        URLRouter([
            path('ws/match/', MatchmakingConsumer.as_asgi()),
            path('ws/chat/<uuid:room_id>/', ChatConsumer.as_asgi()),
            path('ws/notifications/', NotificationConsumer.as_asgi()),
        ])
    ),
})
