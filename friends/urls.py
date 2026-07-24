from django.urls import path
from friends import views
from friends.apis import FriendRequestListCreateAPI, FriendRequestRespondAPI, FriendRequestCancelAPI, RemoveFriendAPI, FriendListAPI, BlockUserAPI, UnblockUserAPI, BlockedListAPI

app_name = 'friends'

urlpatterns = [
    path('', views.friends_list_view, name='friends_list'),
    path('api/request/', views.api_send_request, name='api_send_request'),
    path('api/request/<uuid:request_id>/respond/', views.api_respond, name='api_respond'),
    path('api/block/', views.api_block, name='api_block'),
    path('api/unblock/<int:user_id>/', views.api_unblock, name='api_unblock'),
    path('api/friends/', views.api_friends, name='api_friends'),
    path('api/requests/', FriendRequestListCreateAPI.as_view(), name='api_requests'),
    path('api/requests/<uuid:request_id>/cancel/', FriendRequestCancelAPI.as_view(), name='api_cancel_request'),
    path('api/requests/<uuid:request_id>/', FriendRequestRespondAPI.as_view(), name='api_respond_request'),
    path('api/remove-friend/', RemoveFriendAPI.as_view(), name='api_remove_friend'),
    path('api/list/', FriendListAPI.as_view(), name='api_friends_list'),
    path('api/block/', BlockUserAPI.as_view(), name='api_block_user'),
    path('api/unblock/<int:pk>/', UnblockUserAPI.as_view(), name='api_unblock_user'),
    path('api/blocked/', BlockedListAPI.as_view(), name='api_blocked_list'),
]
