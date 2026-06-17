import os
import redis
from datetime import timedelta

# Initialize Redis client for blocklist
redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
redis_client = redis.from_url(redis_url)

def add_token_to_blocklist(jti):
    """Add a token JTI to the Redis blocklist with a 30-day expiration."""
    # Assuming token max lifespan is 30 days (from remember_me), we expire it then
    # to avoid filling up Redis indefinitely.
    redis_client.setex(f"blocklist:{jti}", timedelta(days=30), "revoked")


def is_token_revoked(jti):
    """Check if a token JTI exists in the Redis blocklist."""
    try:
        return redis_client.exists(f"blocklist:{jti}") > 0
    except redis.RedisError:
        # Fail open or closed? Typically fail open to not block users if Redis blips, 
        # but fail closed for security. We'll fail open (allow) if Redis is down 
        # to prevent complete system outage, or we could raise an error.
        # Given this is a critical check, let's log and allow, or raise.
        # We will allow.
        return False
