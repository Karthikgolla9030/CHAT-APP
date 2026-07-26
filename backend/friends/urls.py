from django.urls import path
from .views import (
    FriendListView, FriendRequestListCreateView,
    AcceptFriendRequestView, RejectFriendRequestView,
    BlockUserView, RelationshipStatusView
)

app_name = 'friends'

urlpatterns = [
    path('', FriendListView.as_view(), name='friend-list'),
    path('relationship/', RelationshipStatusView.as_view(), name='relationship-status'),
    path('requests/', FriendRequestListCreateView.as_view(), name='friend-request-list-create'),
    path('requests/<uuid:pk>/accept/', AcceptFriendRequestView.as_view(), name='friend-request-accept'),
    path('requests/<uuid:pk>/reject/', RejectFriendRequestView.as_view(), name='friend-request-reject'),
    path('block/', BlockUserView.as_view(), name='block-user'),
]
