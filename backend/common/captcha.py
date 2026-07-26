import os
import random
import time
import hmac
import hashlib
import requests
from django.conf import settings
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.core.cache import cache

PROOF_SIGNER_SALT = 'omniroute-captcha-proof-token'

def _get_secret_key():
    key = getattr(settings, 'SECRET_KEY', 'captcha-secret-key-12345')
    if isinstance(key, str):
        return key.encode('utf-8')
    return key

def generate_captcha_challenge():
    site_key = os.getenv('VITE_CAPTCHA_SITE_KEY', '') or os.getenv('CAPTCHA_SITE_KEY', '')
    
    num1 = random.randint(1, 19)
    num2 = random.randint(1, 19)
    answer = str(num1 + num2)
    timestamp = str(int(time.time()))
    
    secret_key = _get_secret_key()
    msg = f"{answer}:{timestamp}".encode('utf-8')
    token = hmac.new(secret_key, msg, hashlib.sha256).hexdigest()
    
    return {
        'site_key': site_key,
        'question': f"What is {num1} + {num2}?",
        'timestamp': timestamp,
        'token': token
    }

def generate_proof_token():
    signer = TimestampSigner(salt=PROOF_SIGNER_SALT)
    raw_payload = f"captcha_verified:{int(time.time())}"
    return signer.sign(raw_payload)

def verify_captcha_challenge(answer, timestamp, token, max_age_seconds=600):
    try:
        if answer is None or timestamp is None or token is None:
            return False, None
        
        current_time = int(time.time())
        token_time = int(timestamp)
        if current_time - token_time > max_age_seconds:
            return False, None
        
        clean_answer = str(answer).strip()
        secret_key = _get_secret_key()
        msg = f"{clean_answer}:{timestamp}".encode('utf-8')
        expected_token = hmac.new(secret_key, msg, hashlib.sha256).hexdigest()
        
        if hmac.compare_digest(expected_token, str(token).strip()):
            proof_token = generate_proof_token()
            return True, proof_token
        return False, None
    except Exception:
        return False, None

def verify_external_captcha_token(response_token, remote_ip=None):
    secret_key = os.getenv('CAPTCHA_SECRET_KEY') or os.getenv('HCAPTCHA_SECRET_KEY') or os.getenv('RECAPTCHA_SECRET_KEY') or os.getenv('TURNSTILE_SECRET_KEY')
    if not secret_key:
        return False, None
    
    verify_url = "https://hcaptcha.com/siteverify"
    data = {
        'secret': secret_key,
        'response': response_token
    }
    if remote_ip:
        data['remoteip'] = remote_ip
        
    try:
        resp = requests.post(verify_url, data=data, timeout=5)
        res_json = resp.json()
        if res_json.get('success'):
            proof_token = generate_proof_token()
            return True, proof_token
        return False, None
    except Exception:
        return False, None

def verify_and_consume_proof_token(captcha_proof_token, max_age_seconds=300):
    if not captcha_proof_token or not isinstance(captcha_proof_token, str):
        return False, "CAPTCHA verification token is missing."
    
    signer = TimestampSigner(salt=PROOF_SIGNER_SALT)
    try:
        unsigned_value = signer.unsign(captcha_proof_token, max_age=max_age_seconds)
        if not unsigned_value.startswith("captcha_verified:"):
            return False, "Invalid CAPTCHA proof signature."
    except SignatureExpired:
        return False, "CAPTCHA verification token has expired. Please complete CAPTCHA again."
    except BadSignature:
        return False, "Invalid CAPTCHA proof token."
    
    cache_key = f"captcha_used:{hashlib.sha256(captcha_proof_token.encode('utf-8')).hexdigest()}"
    if cache.get(cache_key):
        return False, "CAPTCHA verification token has already been used. Please solve CAPTCHA again."
    
    cache.set(cache_key, True, timeout=max_age_seconds)
    return True, "Success"
