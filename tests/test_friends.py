import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from friends.models import FriendRequest, BlockedUser, Friendship

User = get_user_model()


class FriendsTest(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='u1', password='Pass123')
        self.user2 = User.objects.create_user(username='u2', password='Pass123')

    def test_send_friend_request(self):
        req = FriendRequest.objects.create(sender=self.user1, receiver=self.user2)
        self.assertEqual(req.sender, self.user1)
        self.assertEqual(req.status, 'pending')

    def test_block_user(self):
        block = BlockedUser.objects.create(blocker=self.user1, blocked=self.user2)
        self.assertEqual(block.blocker, self.user1)
        self.assertEqual(block.blocked, self.user2)
