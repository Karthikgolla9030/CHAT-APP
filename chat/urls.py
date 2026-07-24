from django.urls import path, re_path
from chat import views
from chat.apis import ChatRoomAPI, MessageListAPI, TypingStatusAPI

app_name = 'chat'

urlpatterns = [
    path('room/<uuid:room_id>/', views.chat_view, name='chat_room'),
    path('api/rooms/', views.api_rooms, name='api_rooms'),
    path('api/rooms/<uuid:room_id>/', views.api_room_detail, name='api_room_detail'),
    path('api/rooms/<uuid:room_id>/disconnect/', views.api_disconnect, name='api_disconnect'),
    path('api/rooms/<uuid:room_id>/clear/', views.api_clear_chat, name='api_clear_chat'),
    path('api/rooms/<uuid:room_id>/typing/', TypingStatusAPI.as_view(), name='api_typing'),
]
