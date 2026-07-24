from django.urls import path
from core import views

app_name = 'core'

urlpatterns = [
    path('', views.home, name='home'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('search/', views.search_page, name='search'),
    path('settings/', views.settings_page, name='settings'),
    path('blocked/', views.blocked_users, name='blocked_users'),
    path('reports/', views.reports_list, name='reports'),
]
