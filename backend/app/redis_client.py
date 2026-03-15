"""
Redis client singleton per l'app.
Usa REDIS_URL dall'environment; fallback a localhost per sviluppo.

Se il modulo 'redis' non è installato o Redis non è raggiungibile,
usa un dizionario in-memory come fallback (solo per sviluppo locale).
"""
import os

_redis_client = None


class _InMemoryRedis:
    """Fallback in-memory per sviluppo locale senza Redis."""
    def __init__(self):
        self._store: dict = {}

    def get(self, key):
        return self._store.get(key)

    def incr(self, key):
        val = int(self._store.get(key) or 0) + 1
        self._store[key] = str(val)
        return val

    def expire(self, key, seconds):
        pass  # no TTL in memory fallback

    def pipeline(self):
        return _InMemoryPipeline(self)


class _InMemoryPipeline:
    def __init__(self, store: _InMemoryRedis):
        self._store = store
        self._cmds = []

    def incr(self, key):
        self._cmds.append(('incr', key))
        return self

    def expire(self, key, seconds):
        self._cmds.append(('expire', key, seconds))
        return self

    def execute(self):
        for cmd in self._cmds:
            if cmd[0] == 'incr':
                self._store.incr(cmd[1])


def get_redis():
    global _redis_client
    if _redis_client is not None:
        return _redis_client

    try:
        import redis as redis_lib
        url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        client = redis_lib.from_url(url, decode_responses=True)
        # Verifica connessione
        client.ping()
        _redis_client = client
        print("✅ Redis connesso:", url)
    except Exception as e:
        print(f"⚠️  Redis non disponibile ({e}). Uso fallback in-memory (solo sviluppo).")
        _redis_client = _InMemoryRedis()

    return _redis_client
