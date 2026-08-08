import os
import sys
import django
import asyncio

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from matchmaking.models import MatchQueue
from common.services.matchmaking import MatchmakingService
from asgiref.sync import sync_to_async

User = get_user_model()

async def test_matchmaking():
    # Create test users
    user1, _ = await sync_to_async(User.objects.get_or_create)(username='test1', email='test1@test.com')
    user2, _ = await sync_to_async(User.objects.get_or_create)(username='test2', email='test2@test.com')

    print("Users created.")
    
    # User 1 joins
    print("User 1 joining...")
    filters1 = {'gender': 'male', 'looking_for': 'female', 'interests': ['coding']}
    partner1, score1, common1, room1 = await sync_to_async(MatchmakingService.find_and_execute_match)(user1, filters1)
    print("User 1 match result:", partner1, score1, room1)

    # User 2 joins
    print("User 2 joining...")
    filters2 = {'gender': 'female', 'looking_for': 'male', 'interests': ['gaming']}
    partner2, score2, common2, room2 = await sync_to_async(MatchmakingService.find_and_execute_match)(user2, filters2)
    print("User 2 match result:", partner2, score2, room2)

if __name__ == '__main__':
    asyncio.run(test_matchmaking())
