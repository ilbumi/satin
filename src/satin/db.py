from pymongo import AsyncMongoClient

from .config import config

# instantiate mongo client
client = AsyncMongoClient(str(config.mongo_dsn))
db = client.get_default_database()
