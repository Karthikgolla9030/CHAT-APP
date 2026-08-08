import os
import sys
import django
import asyncio
import requests
import json
import websockets
from asgiref.sync import sync_to_async

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

from rest_framework_simplejwt.tokens import RefreshToken

@sync_to_async
def get_token(username, email, password):
    # Ensure user exists
    user, created = User.objects.get_or_create(username=username, email=email)
    user.set_password(password)
    user.save()
    
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)

async def simulate_user(username, token, delay):
    await asyncio.sleep(delay)
    print(f"[{username}] Connecting...")
    uri = f"ws://127.0.0.1:8000/ws/match/?token={token}"
    try:
        async with websockets.connect(uri) as websocket:
            print(f"[{username}] Connected.")
            
            # Send join_queue
            filters = {'gender': 'prefer_not_to_say', 'looking_for': 'anyone', 'interests': []}
            await websocket.send(json.dumps({
                'type': 'join_queue',
                'filters': filters
            }))
            
            # Listen for messages
            while True:
                try:
                    msg = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                    data = json.loads(msg)
                    print(f"[{username}] Received: {data['type']}")
                    if data['type'] == 'match_found':
                        print(f"[{username}] Match found with {data['partner']['username']} in room {data['room_id']}")
                        return
                except asyncio.TimeoutError:
                    print(f"[{username}] Timeout waiting for match.")
                    return
    except Exception as e:
        print(f"[{username}] Error: {e}")

async def main():
    token1 = await get_token('test1', 'test1@test.com', 'Password123!')
    token2 = await get_token('test2', 'test2@test.com', 'Password123!')
    
    if not token1 or not token2:
        return
        
    await asyncio.gather(
        simulate_user('test1', token1, 0),
        simulate_user('test2', token2, 2)
    )

if __name__ == '__main__':
    asyncio.run(main())
