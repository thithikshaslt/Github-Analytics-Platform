from fastapi import APIRouter, HTTPException
from datetime import datetime
from bson import ObjectId
from models.schemas import AnalysisCreateRequest
from db import get_analyses_collection, get_repositories_collection
from services.worker import enqueue_analysis

router = APIRouter(tags=["Analyses"])

def serialize_analysis(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "repositoryId": str(doc.get("repositoryId")),
        "status": doc.get("status", "queued"),
        "progressMessage": doc.get("progressMessage",  "Job created"),
        "errorMessage": doc.get("errorMessage"),
        "overview": doc.get("overview"),
        "requirements": doc.get("requirements"),
        "designDoc": doc.get("designDoc"),
        "diagrams": doc.get("diagrams"),
        "fileCount": doc.get("fileCount"),
        "totalSizeKb": doc.get("totalSizeKb"),
        "createdAt": doc.get("createdAt", datetime.utcnow()),
        "completedAt": doc.get("completedAt")
    }

@router.post("/analyses")
async def create_analysis(req: AnalysisCreateRequest):
    analyses_col = get_analyses_collection()
    repos_col = get_repositories_collection()
    if analyses_col is None or repos_col is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    try:
        repo_oid = ObjectId(req.repositoryId)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid repository ID format")

    repo = await repos_col.find_one({"_id": repo_oid})
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    active = await analyses_col.find_one({
        "repositoryId": str(repo_oid),
        "status": {"$in": ["queued", "cloning", "reading", "generating"]}
    })
    if active:
        return serialize_analysis(active)

    new_doc = {
        "repositoryId": str(repo_oid),
        "status": "queued",
        "progressMessage": "Analysis queued in worker pool...",
        "errorMessage": None,
        "overview": None,
        "requirements": None,
        "designDoc": None,
        "diagrams": None,
        "fileCount": None,
        "totalSizeKb": None,
        "createdAt": datetime.utcnow(),
        "completedAt": None
    }
    result = await analyses_col.insert_one(new_doc)
    new_doc["_id"] = result.inserted_id

    await enqueue_analysis(str(result.inserted_id))
    return serialize_analysis(new_doc)

@router.get("/analyses/{analysis_id}")
async def get_analysis(analysis_id: str):
    col = get_analyses_collection()
    if col is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    try:
        oid = ObjectId(analysis_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid analysis ID format")

    doc = await col.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return serialize_analysis(doc)

@router.get("/repositories/{repo_id}/analyses")
async def list_repo_analyses(repo_id: str):
    col = get_analyses_collection()
    if col is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    cursor = col.find({"repositoryId": repo_id}).sort("createdAt", -1).limit(10)
    docs = await cursor.to_list(length=10)
    return [serialize_analysis(d) for d in docs]

@router.get("/repositories/{repo_id}/analyses/latest")
async def get_latest_repo_analysis(repo_id: str):
    col = get_analyses_collection()
    if col is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    doc = await col.find_one({"repositoryId": repo_id}, sort=[("createdAt", -1)])
    if not doc:
        raise HTTPException(status_code=404, detail="No analyses found for this repository")
    return serialize_analysis(doc)