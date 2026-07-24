from django.urls import re_path
from chat.consumers import MatchConsumer, ChatConsumer

websocket_urlpatterns = [
    re_path(r'ws/match/$', MatchConsumer.as_asgi()),
    re_path(r'ws/chat/(?P<room_id>[^/]+)/$', ChatConsumer.as_asgi()),
]
