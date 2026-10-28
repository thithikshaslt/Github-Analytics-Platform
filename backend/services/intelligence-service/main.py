import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from db import connect_to_mongo, close_mongo_connection
from services.worker import start_worker, stop_worker
from routers import health, repositories, analyses, qa

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("intelligence-service")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Codebase Intelligence Service")
    await connect_to_mongo()
    start_worker()
    yield
    logger.info("Shutting down Codebase Intelligence Service...")
    stop_worker()
    await close_mongo_connection()

app = FastAPI(
    title="Codebase Intelligence & Reverse Documentation Service",
    description="Locally hosted LLM-powered codebase intelligence for GitHub Analytics Platform",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for prefix in ["", "/intelligence"]:
    app.include_router(health.router, prefix=prefix)
    app.include_router(repositories.router, prefix=prefix)
    app.include_router(analyses.router, prefix=prefix)
    app.include_router(qa.router, prefix=prefix)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.port, reload=True)