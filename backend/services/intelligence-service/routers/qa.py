from fastapi import APIRouter, HTTPException
from datetime import datetime
from bson import ObjectId
from models.schemas import QARequest
from db import get_qa_collection, get_repositories_collection
from services.worker import repo_files_cache
from services.acquisition import acquire_repository
from services.file_reader import read_repository_files
from services.qa_service import answer_question

router = APIRouter(tags=["Q&A"])

def serialize_qa(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "repositoryId": str(doc.get("repositoryId")),
        "question": doc.get("question", ""),
        "answer": doc.get("answer", ""),
        "relevantFiles": doc.get("relevantFiles", []),
        "createdAt": doc.get("createdAt", datetime.utcnow())
    }

@router.post("/qa")
async def ask_codebase_question(req: QARequest):
    qa_col = get_qa_collection()
    repos_col = get_repositories_collection()
    if qa_col is None or repos_col is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    try:
        repo_oid = ObjectId(req.repositoryId)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid repository ID format")

    repo = await repos_col.find_one({"_id": repo_oid})
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    repo_id_key = str(repo_oid)

    repo_data = repo_files_cache.get(repo_id_key)
    if not repo_data or "files" not in repo_data:
        try:
            repo_path = await acquire_repository(repo)
            repo_data = read_repository_files(repo_path)
            repo_files_cache[repo_id_key] = repo_data
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to access repository files: {str(e)}")

    try:
        qa_result = await answer_question(repo_data["files"], req.question)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM Q&A inference failed: {str(e)}")
    doc = {
        "repositoryId": repo_id_key,
        "question": req.question,
        "answer": qa_result["answer"],
        "relevantFiles": qa_result["relevantFiles"],
        "createdAt": datetime.utcnow()
    }
    insert_res = await qa_col.insert_one(doc)
    doc["_id"] = insert_res.inserted_id
    return serialize_qa(doc)

@router.get("/repositories/{repo_id}/qa")
async def list_repo_qa(repo_id: str):
    qa_col = get_qa_collection()
    if qa_col is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    cursor = qa_col.find({"repositoryId": repo_id}).sort("createdAt", -1).limit(20)
    docs = await cursor.to_list(length=20)
    return [serialize_qa(d) for d in docs]