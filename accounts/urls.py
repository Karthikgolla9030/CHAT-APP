from django.urls import path
from accounts import views
from accounts.apis import change_password, delete_account

app_name = 'accounts'

urlpatterns = [
    path('register/', views.register_view, name='register'),
    path('guest-login/', views.guest_login_view, name='guest-login'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile_view, name='profile'),
    path('profile/edit/', views.edit_profile, name='edit_profile'),
    path('convert-guest/', views.convert_guest, name='convert_guest'),
    path('api/convert-guest/', views.api_convert_guest, name='api_convert_guest'),
    path('api/change-password/', change_password, name='api_change_password'),
    path('api/delete-account/', delete_account, name='api_delete_account'),
]
