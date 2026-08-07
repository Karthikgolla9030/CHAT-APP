from django.urls import path
from .views import RoomMessagesView, GetOrCreateFriendRoomView, RoomDetailView, SkipRoomView

urlpatterns = [
    path('rooms/<uuid:room_id>/', RoomDetailView.as_view(), name='room-detail'),
    path('rooms/<uuid:room_id>/messages/', RoomMessagesView.as_view(), name='room-messages'),
    path('rooms/<uuid:room_id>/skip/', SkipRoomView.as_view(), name='room-skip'),
    path('friends/chat/', GetOrCreateFriendRoomView.as_view(), name='friends-chat'),
]
