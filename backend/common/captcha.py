import random
import time
import hmac
import hashlib
from django.conf import settings

def _get_secret_key():
    key = getattr(settings, 'SECRET_KEY', 'captcha-secret-key-12345')
    if isinstance(key, str):
        return key.encode('utf-8')
    return key

def generate_captcha_challenge():
    num1 = random.randint(1, 19)
    num2 = random.randint(1, 19)
    answer = str(num1 + num2)
    timestamp = str(int(time.time()))
    
    secret_key = _get_secret_key()
    msg = f"{answer}:{timestamp}".encode('utf-8')
    token = hmac.new(secret_key, msg, hashlib.sha256).hexdigest()
    
    return {
        'question': f"What is {num1} + {num2}?",
        'timestamp': timestamp,
        'token': token
    }

def verify_captcha_challenge(answer, timestamp, token, max_age_seconds=600):
    try:
        if answer is None or timestamp is None or token is None:
            return False
        
        current_time = int(time.time())
        token_time = int(timestamp)
        if current_time - token_time > max_age_seconds:
            return False
        
        clean_answer = str(answer).strip()
        secret_key = _get_secret_key()
        msg = f"{clean_answer}:{timestamp}".encode('utf-8')
        expected_token = hmac.new(secret_key, msg, hashlib.sha256).hexdigest()
        
        return hmac.compare_digest(expected_token, str(token).strip())
    except Exception:
        return False
