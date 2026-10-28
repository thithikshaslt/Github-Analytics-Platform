from fastapi import APIRouter
from db import get_database
from services.llm import check_ollama_health

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    db = get_database()
    mongo_status = "connected" if db is not None else "disconnected"
    ollama_info = await check_ollama_health()

    return {
        "status": "ok" if (mongo_status == "connected") else "degraded",
        "service": "intelligence-service",
        "mongodb": mongo_status,
        "ollama": ollama_info
    }