import pytest
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from accounts.models import Profile

User = get_user_model()


class AccountsModelTest(TestCase):
    def test_create_user(self):
        user = User.objects.create_user(username='testuser', password='TestPass123')
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_guest)

    def test_create_guest(self):
        user = User.objects.create_user(username='guestuser', password='GuestPass123', is_guest=True)
        self.assertTrue(user.is_guest)
        profile, created = Profile.objects.get_or_create(user=user, defaults={'username': user.username})
        self.assertEqual(profile.user, user)


class AuthViewsTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', password='TestPass123')

    def test_register_page(self):
        response = self.client.get('/accounts/register/')
        self.assertEqual(response.status_code, 200)

    def test_login_page(self):
        response = self.client.get('/accounts/login/')
        self.assertEqual(response.status_code, 200)

    def test_profile_requires_login(self):
        response = self.client.get('/accounts/profile/')
        self.assertNotEqual(response.status_code, 200)


class APITest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', password='TestPass123')

    def test_api_rooms_requires_auth(self):
        response = self.client.get('/api/chat/api/rooms/')
        self.assertNotEqual(response.status_code, 200)
