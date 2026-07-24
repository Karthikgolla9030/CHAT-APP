from django.urls import path
from reports import views
from reports.apis import ReportListAPI, ReportRetrieveUpdateAPI, BlockedWordListCreateAPI, BlockedWordDeleteAPI

app_name = 'reports'

urlpatterns = [
    path('', views.reports_list_view, name='reports_list'),
    path('api/submit/', views.api_submit_report, name='api_submit_report'),
    path('api/my-reports/', views.api_my_reports, name='api_my_reports'),
    path('api/reports/', ReportListAPI.as_view(), name='api_reports_list'),
    path('api/reports/<uuid:pk>/', ReportRetrieveUpdateAPI.as_view(), name='api_report_detail'),
    path('api/blocked-words/', BlockedWordListCreateAPI.as_view(), name='api_blocked_words'),
    path('api/blocked-words/<int:pk>/', BlockedWordDeleteAPI.as_view(), name='api_blocked_word_delete'),
]
