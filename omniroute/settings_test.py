"""
Test settings for OmniRoute.
"""
from omniroute.settings import *

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'test_db.sqlite3',
    }
}

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
