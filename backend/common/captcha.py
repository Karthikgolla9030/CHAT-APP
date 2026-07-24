import random
import string
import time
import hmac
import hashlib
from django.conf import settings

SECRET_KEY = getattr(settings, 'SECRET_KEY', 'captcha-secret-key-12345').encode('utf-8')

def generate_captcha_challenge():
    num1 = random.randint(1, 19)
    num2 = random.randint(1, 19)
    answer = str(num1 + num2)
    timestamp = str(int(time.time()))
    
    # Create signed verification token for the answer
    msg = f"{answer}:{timestamp}".encode('utf-8')
    token = hmac.new(SECRET_KEY, msg, hashlib.sha256).hexdigest()
    
    return {
        'question': f"What is {num1} + {num2}?",
        'timestamp': timestamp,
        'token': token
    }

def verify_captcha_challenge(answer, timestamp, token, max_age_seconds=300):
    try:
        current_time = int(time.time())
        token_time = int(timestamp)
        if current_time - token_time > max_age_seconds:
            return False
        
        msg = f"{str(answer).strip()}:{timestamp}".encode('utf-8')
        expected_token = hmac.new(SECRET_KEY, msg, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected_token, token)
    except Exception:
        return False
