from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, GuestLoginView, ProfileView, InterestListView,
    ClaimAccountView, CaptchaGenerateView, CaptchaVerifyView
)

app_name = 'accounts'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('guest-login/', GuestLoginView.as_view(), name='guest-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('profile/me/', ProfileView.as_view(), name='profile-me'),
    path('interests/', InterestListView.as_view(), name='interest-list'),
    path('claim-account/', ClaimAccountView.as_view(), name='claim-account'),
    path('captcha/generate/', CaptchaGenerateView.as_view(), name='captcha-generate'),
    path('captcha/verify/', CaptchaVerifyView.as_view(), name='captcha-verify'),
]
