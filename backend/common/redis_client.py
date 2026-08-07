import os
import time
import logging
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

_redis_client = None

_redis_pool = None

def get_redis_client():
    global _redis_client, _redis_pool
    if _redis_client is not None:
        return _redis_client

    redis_url = getattr(settings, 'REDIS_URL', None) or os.getenv('REDIS_URL')
    if redis_url:
        try:
            import redis
            if _redis_pool is None:
                _redis_pool = redis.ConnectionPool.from_url(
                    redis_url,
                    decode_responses=True,
                    max_connections=50,
                    socket_keepalive=True,
                    health_check_interval=30,
                    socket_timeout=10.0,
                    socket_connect_timeout=5.0,
                    retry_on_timeout=True
                )
            _redis_client = redis.Redis(connection_pool=_redis_pool)
            _redis_client.ping()
            return _redis_client
        except Exception as e:
            logger.warning(f"Failed to connect to Redis at {redis_url}: {e}. Falling back to InMemory/Cache wrapper.")
            _redis_client = None

    # Fallback to InMemory/Cache wrapper if Redis URL is not set or failed
    _redis_client = InMemoryRedisAdapter()
    return _redis_client


class InMemoryRedisAdapter:
    """
    Fallback in-memory Redis adapter for development/testing environments when Redis server is unavailable.
    Implements key Redis operations (get, set, delete, zadd, zrem, zrange, hset, hget, lock).
    """
    def __init__(self):
        self._data = {}
        self._expirations = {}
        self._zsets = {}

    def _clean_expired(self, key):
        if key in self._expirations and time.time() > self._expirations[key]:
            self._data.pop(key, None)
            self._zsets.pop(key, None)
            self._expirations.pop(key, None)

    def ping(self):
        return True

    def get(self, key):
        self._clean_expired(key)
        val = self._data.get(key)
        return str(val) if val is not None else None

    def set(self, key, value, ex=None, px=None, nx=False, xx=False):
        self._clean_expired(key)
        if nx and key in self._data:
            return False
        if xx and key not in self._data:
            return False
        self._data[key] = str(value)
        if ex:
            self._expirations[key] = time.time() + ex
        elif px:
            self._expirations[key] = time.time() + (px / 1000.0)
        return True

    def delete(self, *keys):
        count = 0
        for k in keys:
            self._clean_expired(k)
            if k in self._data or k in self._zsets:
                self._data.pop(k, None)
                self._zsets.pop(k, None)
                self._expirations.pop(k, None)
                count += 1
        return count

    def hset(self, name, key=None, value=None, mapping=None):
        self._clean_expired(name)
        if name not in self._data or not isinstance(self._data[name], dict):
            self._data[name] = {}
        target = self._data[name]
        count = 0
        if mapping:
            for k, v in mapping.items():
                target[str(k)] = str(v)
                count += 1
        elif key is not None:
            target[str(key)] = str(value)
            count = 1
        return count

    def hget(self, name, key):
        self._clean_expired(name)
        h = self._data.get(name)
        if isinstance(h, dict):
            val = h.get(str(key))
            return str(val) if val is not None else None
        return None

    def hgetall(self, name):
        self._clean_expired(name)
        h = self._data.get(name)
        if isinstance(h, dict):
            return {k: str(v) for k, v in h.items()}
        return {}

    def hdel(self, name, *keys):
        self._clean_expired(name)
        h = self._data.get(name)
        count = 0
        if isinstance(h, dict):
            for k in keys:
                if str(k) in h:
                    del h[str(k)]
                    count += 1
        return count

    def expire(self, key, seconds):
        self._clean_expired(key)
        if key in self._data or key in self._zsets:
            self._expirations[key] = time.time() + seconds
            return True
        return False

    def lock(self, name, timeout=None, sleep=0.1, blocking_timeout=None):
        from threading import Lock
        class DummyLock:
            def __init__(self, name):
                self.name = name
            def __enter__(self):
                return self
            def __exit__(self, exc_type, exc_val, exc_tb):
                pass
            def acquire(self, blocking=True, blocking_timeout=None):
                return True
            def release(self):
                pass
        return DummyLock(name)
