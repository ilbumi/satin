import logging

from pymongo import AsyncMongoClient
from pymongo.errors import ConfigurationError

from .config import config

# Error messages
NO_AUTH_NON_LOCAL_ERROR = (
    "MongoDB connection string must include authentication credentials for non-localhost connections. "
    "Format: mongodb://username:password@host:port/database"
)
NO_DATABASE_NAME_ERROR = "MongoDB connection string must specify a database name"

logger = logging.getLogger(__name__)


def _raise_auth_error() -> None:
    """Raise authentication configuration error."""
    raise ConfigurationError(NO_AUTH_NON_LOCAL_ERROR)


def _raise_database_name_error() -> None:
    """Raise database name configuration error."""
    raise ConfigurationError(NO_DATABASE_NAME_ERROR)


# Validate MongoDB connection string has authentication if not localhost
def validate_mongo_connection(dsn: str) -> None:
    """Validate MongoDB connection string has proper authentication."""
    dsn_str = str(dsn)
    # Skip validation for local development without auth
    if "localhost" in dsn_str or "127.0.0.1" in dsn_str:
        if "@" not in dsn_str:
            logger.warning("MongoDB connection does not use authentication. This should only be used in development.")
    # For non-local connections, require authentication
    elif "@" not in dsn_str:
        _raise_auth_error()


# Validate connection string
validate_mongo_connection(str(config.mongo_dsn))

# instantiate mongo client with connection validation
try:
    client: AsyncMongoClient = AsyncMongoClient(
        str(config.mongo_dsn),
        serverSelectionTimeoutMS=5000,  # 5 second timeout for initial connection
        connectTimeoutMS=10000,  # 10 second connection timeout
    )
    db = client.get_default_database()

    # Validate database name is specified
    if db.name is None:
        _raise_database_name_error()

except Exception:
    logger.exception("Failed to connect to MongoDB")
    raise
