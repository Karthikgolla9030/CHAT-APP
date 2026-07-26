from django.urls import path
from .views import RoomMessagesView

urlpatterns = [
    path('rooms/<uuid:room_id>/messages/', RoomMessagesView.as_view(), name='room-messages'),
]
