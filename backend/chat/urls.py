from django.urls import path
from .views import RoomMessagesView, GetOrCreateFriendRoomView, RoomDetailView

urlpatterns = [
    path('rooms/<uuid:room_id>/', RoomDetailView.as_view(), name='room-detail'),
    path('rooms/<uuid:room_id>/messages/', RoomMessagesView.as_view(), name='room-messages'),
    path('friends/chat/', GetOrCreateFriendRoomView.as_view(), name='friends-chat'),
]
