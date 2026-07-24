import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from matching.models import MatchQueue, MatchHistory

User = get_user_model()


class MatchingEngineTest(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='user1', password='Pass123')
        self.user2 = User.objects.create_user(username='user2', password='Pass123')

    def test_match_queue_creation(self):
        queue = MatchQueue.objects.create(user=self.user1, preferences={'gender': 'male'}, match_mode='random')
        self.assertEqual(queue.user, self.user1)
        self.assertTrue(queue.is_active)

    def test_match_history_creation(self):
        history = MatchHistory.objects.create(user1=self.user1, user2=self.user2, match_score=0.8)
        self.assertEqual(history.user1, self.user1)
        self.assertEqual(history.user2, self.user2)
        self.assertEqual(history.match_score, 0.8)
