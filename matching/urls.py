from django.urls import path
from matching import views
from matching.apis import JoinQueueAPI, LeaveQueueAPI, MatchRequestAPI, RespondRequestAPI, MatchHistoryAPI, current_queue_status

app_name = 'matching'

urlpatterns = [
    path('search/', views.search_chat_view, name='search_chat'),
    path('matched-demo/', views.matched_user_demo, name='matched_user_demo'),
    path('api/join/', views.api_join_queue, name='api_join_queue'),
    path('api/leave/', views.api_leave_queue, name='api_leave_queue'),
    path('api/status/', views.api_search_status, name='api_search_status'),
    path('api/find/', views.api_find_match, name='api_find_match'),
    path('api/join-queue/', JoinQueueAPI.as_view(), name='api_join_queue_rest'),
    path('api/leave-queue/', LeaveQueueAPI.as_view(), name='api_leave_queue_rest'),
    path('api/request/', MatchRequestAPI.as_view(), name='api_match_request'),
    path('api/request/<uuid:request_id>/respond/', RespondRequestAPI.as_view(), name='api_respond_request'),
    path('api/history/', MatchHistoryAPI.as_view(), name='api_match_history'),
    path('api/queue/', current_queue_status, name='api_queue_status'),
]
