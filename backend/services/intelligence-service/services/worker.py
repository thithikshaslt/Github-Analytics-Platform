import asyncio
import logging
from datetime import datetime
from bson import ObjectId
from db import get_database, get_analyses_collection, get_repositories_collection
from services.acquisition import acquire_repository
from services.file_reader import read_repository_files
from services import generator

logger = logging.getLogger(__name__)

repo_files_cache = {}

analysis_queue: asyncio.Queue = asyncio.Queue()
_worker_task: asyncio.Task = None

async def enqueue_analysis(analysis_id: str):
    await analysis_queue.put(analysis_id)
    logger.info(f"Enqueued analysis job: {analysis_id}")

async def process_analysis(analysis_id_str: str):
    analyses_col = get_analyses_collection()
    repos_col = get_repositories_collection()
   
    if analyses_col is None or repos_col is None:
        logger.error("Database connection unavailable for processing analysis.")
        return

    analysis_oid = ObjectId(analysis_id_str)
    analysis = await analyses_col.find_one({"_id": analysis_oid})
    if not analysis:
        logger.error(f"Analysis {analysis_id_str} not found.")
        return

    repo_oid = ObjectId(analysis["repositoryId"])
    repo = await repos_col.find_one({"_id": repo_oid})
    if not repo:
        await analyses_col.update_one(
            {"_id": analysis_oid},
            {"$set": {"status": "failed", "errorMessage": "Associated repository not found."}}
        )
        return

    try:
        await analyses_col.update_one(
            {"_id": analysis_oid},
            {"$set": {"status": "cloning", "progressMessage": "Cloning repository source code..."}}
        )
        repo_path = await acquire_repository(repo)
        await analyses_col.update_one(
            {"_id": analysis_oid},
            {"$set": {"status": "reading", "progressMessage": "Scanning and categorizing source files..."}}
        )
        repo_data = read_repository_files(repo_path)
        stats = repo_data["stats"]

        repo_id_key = str(repo["_id"])
        repo_files_cache[repo_id_key] = repo_data

        if stats["file_count"] == 0:
            raise ValueError("No readable source files found in the repository.")

        await analyses_col.update_one(
            {"_id": analysis_oid},
            {"$set": {
                "status": "generating",
                "progressMessage": f"Generating architecture overview with local LLM ({stats['file_count']} files read)...",
                "fileCount": stats["file_count"],
                "totalSizeKb": stats["total_size_kb"]
            }}
        )
        overview = await generator.generate_overview(repo_data)
        await analyses_col.update_one(
            {"_id": analysis_oid},
            {"$set": {
                "progressMessage": "Reverse-engineering functional requirements...",
                "overview": overview
            }}
        )
        requirements = await generator.generate_requirements(repo_data)
        await analyses_col.update_one(
            {"_id": analysis_oid},
            {"$set": {
                "progressMessage": "Generating technical software design documentation...",
                "requirements": requirements
            }}
        )
        design_doc = await generator.generate_design_doc(repo_data)

        await analyses_col.update_one(
            {"_id": analysis_oid},
            {"$set": {
                "progressMessage": "Synthesizing Mermaid workflow and architecture diagrams...",
                "designDoc": design_doc
            }}
        )
        diagrams = await generator.generate_diagrams(repo_data)

        now = datetime.utcnow()
        await analyses_col.update_one(
            {"_id": analysis_oid},
            {"$set": {
                "status": "completed",
                "progressMessage": "Analysis completed successfully.",
                "diagrams": diagrams,
                "completedAt": now
            }}
        )
        await repos_col.update_one(
            {"_id": repo_oid},
            {"$set": {"lastAnalyzedAt": now, "updatedAt": now}}
        )
        logger.info(f"Analysis {analysis_id_str} completed successfully.")

    except Exception as e:
        logger.error(f"Analysis {analysis_id_str} failed: {e}", exc_info=True)
    await analyses_col.update_one(
            {"_id": analysis_oid},
            {"$set": {
                "status": "failed",
                "errorMessage": str(e),
                "progressMessage": f"Failed: {str(e)}"
            }}
        )

async def worker_loop():
    logger.info("Background analysis worker started.")
    while True:
        try:
            analysis_id = await analysis_queue.get()
            logger.info(f"Worker picked up job {analysis_id}")
            await process_analysis(analysis_id)
            analysis_queue.task_done()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Worker loop error: {e}")
            await asyncio.sleep(1)

def start_worker():
    global _worker_task
    if _worker_task is None or _worker_task.done():
        _worker_task = asyncio.create_task(worker_loop())

def stop_worker():
    global _worker_task
    if _worker_task and not _worker_task.done():
        _worker_task.cancel()