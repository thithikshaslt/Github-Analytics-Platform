from fastapi import APIRouter, HTTPException
from datetime import datetime
from bson import ObjectId
from typing import List
from models.schemas import RepositoryRegisterRequest
from db import get_repositories_collection

router = APIRouter(tags=["Repositories"])

def serialize_repo(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "sourceType": doc.get("sourceType", "github"),
        "fullName": doc.get("fullName", ""),
        "name": doc.get("name", ""),
        "owner": doc.get("owner", ""),
        "cloneUrl": doc.get("cloneUrl"),
        "defaultBranch": doc.get("defaultBranch", "main"),
        "localPath": doc.get("localPath"),
        "createdAt": doc.get("createdAt", datetime.utcnow()),
        "updatedAt": doc.get("updatedAt", datetime.utcnow()),
        "lastAnalyzedAt": doc.get("lastAnalyzedAt")
    }

@router.post("/repositories")
async def register_repository(req: RepositoryRegisterRequest):
    col = get_repositories_collection()
    if col is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    now = datetime.utcnow()
    existing = await col.find_one({"fullName": req.fullName})
    if existing:
        update_data = {
            "sourceType": req.sourceType,
            "name": req.name,
            "owner": req.owner,
            "defaultBranch": req.defaultBranch,
            "updatedAt": now
        }
        if req.cloneUrl:
            update_data["cloneUrl"] = req.cloneUrl
        if req.localPath:
            update_data["localPath"] = req.localPath
        await col.update_one({"_id": existing["_id"]}, {"$set": update_data})
        updated = await col.find_one({"_id": existing["_id"]})
        return serialize_repo(updated)

    new_doc = {
        "sourceType": req.sourceType,
        "fullName": req.fullName,
        "name": req.name,
        "owner": req.owner,
        "cloneUrl": req.cloneUrl or f"https://github.com/{req.fullName}.git",
        "defaultBranch": req.defaultBranch,
        "localPath": req.localPath,
        "createdAt": now,
        "updatedAt": now,
        "lastAnalyzedAt": None
    }
    result = await col.insert_one(new_doc)
    new_doc["_id"] = result.inserted_id
    return serialize_repo(new_doc)

@router.get("/repositories")
async def list_repositories():
    col = get_repositories_collection()
    if col is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    cursor = col.find().sort("updatedAt", -1).limit(50)
    repos = await cursor.to_list(length=50)
    return [serialize_repo(r) for r in repos]

@router.get("/repositories/{repo_id}")
async def get_repository(repo_id: str):
    col = get_repositories_collection()
    if col is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    try:
        oid = ObjectId(repo_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid repository ID format")

    repo = await col.find_one({"_id": oid})
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    return serialize_repo(repo)