import logging
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

logger = logging.getLogger(__name__)

client: AsyncIOMotorClient =None
db = None
async def connect_to_mongo():
    global client, db
    try:
        client = AsyncIOMotorClient(settings.mongo_uri, serverSelectionTimeoutMS=5000)
        db = client.get_default_database("github-analytics")
        await client.admin.command('ping')
        logger.info("Connected to MongoDB successfully")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        db = None

async def close_mongo_connection():
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed")

def get_database():
    return db

def get_repositories_collection():
    return db["intelligence_repositories"] if db is not None else None

def get_analyses_collection():
    return db["intelligence_analyses"] if db is not None else None

def get_qa_collection():
    return db["intelligence_qa"] if db is not None else None