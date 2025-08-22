import logging

from pymongo import AsyncMongoClient
from pymongo.errors import ServerSelectionTimeoutError

logger = logging.getLogger(__name__)


def get_database_client(mongo_dsn: str) -> AsyncMongoClient:
    """Get MongoDB async client."""
    return AsyncMongoClient(mongo_dsn, serverSelectionTimeoutMS=5000)


async def check_database_health(client: AsyncMongoClient) -> bool:
    """Check if database is healthy."""
    try:
        await client.admin.command("ping")
    except ServerSelectionTimeoutError:
        logger.exception("Database connection failed: Server selection timeout")
        return False
    except Exception:
        logger.exception("Unexpected error checking database health")
        return False
    else:
        return True
