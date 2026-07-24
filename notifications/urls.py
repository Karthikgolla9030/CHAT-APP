from django.urls import path
from notifications import views
from notifications.apis import NotificationListAPI, NotificationMarkReadAPI, NotificationMarkAllReadAPI, NotificationPreferenceAPI

app_name = 'notifications'

urlpatterns = [
    path('', views.notifications_view, name='notifications'),
    path('api/', views.api_notifications, name='api_notifications'),
    path('api/<uuid:notification_id>/mark-read/', views.api_mark_read, name='api_mark_read'),
    path('api/mark-all-read/', views.api_mark_all_read, name='api_mark_all_read'),
    path('api/list/', NotificationListAPI.as_view(), name='api_list'),
    path('api/<uuid:notification_id>/read/', NotificationMarkReadAPI.as_view(), name='api_mark_read_rest'),
    path('api/mark-all/', NotificationMarkAllReadAPI.as_view(), name='api_mark_all'),
    path('api/preferences/', NotificationPreferenceAPI.as_view(), name='api_preferences'),
]
