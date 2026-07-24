import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from chat.models import ChatRoom, Message

User = get_user_model()


class ChatModelsTest(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='u1', password='Pass123')
        self.user2 = User.objects.create_user(username='u2', password='Pass123')

    def test_chat_room_creation(self):
        room = ChatRoom.objects.create(user1=self.user1, user2=self.user2)
        self.assertEqual(room.user1, self.user1)
        self.assertEqual(room.user2, self.user2)
        self.assertEqual(room.status, 'active')

    def test_message_creation(self):
        room = ChatRoom.objects.create(user1=self.user1, user2=self.user2)
        msg = Message.objects.create(room=room, sender=self.user1, content='Hello')
        self.assertEqual(msg.content, 'Hello')
        self.assertEqual(msg.status, 'sent')
