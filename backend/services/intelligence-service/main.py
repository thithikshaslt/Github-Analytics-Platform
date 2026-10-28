import os
import json
import asyncio
import logging
from pathlib import Path
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import httpx

from config import settings
from analyzer import filter_and_format_files, build_prompt, call_ollama, is_text_file, EXCLUDED_DIRS

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("intelligence-service")

app = FastAPI(
    title="Codebase Intelligence Service",
    description="Minimal local LLM-powered codebase analysis service",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FileItem(BaseModel):
    path: str
    content: str

class AnalyzeRequest(BaseModel):
    folder_name: Optional[str] = "Repository"
    folder_path: Optional[str] = None
    files: Optional[List[FileItem]] = None

@app.get("/health")
@app.get("/intelligence/health")
async def health_check():
    ollama_ok = False
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{settings.ollama_url}/api/tags")
            if resp.status_code == 200:
                ollama_ok = True
    except Exception:
        ollama_ok = False

    return {
        "status": "ok",
        "ollama_ready": ollama_ok,
        "model": settings.ollama_model
    }

def read_files_from_disk(disk_path: str) -> tuple[str, list[dict]]:
    path = Path(disk_path).resolve()
    if not path.exists() or not path.is_dir():
        raise ValueError(f"Directory does not exist: {disk_path}")
        
    folder_name = path.name
    files = []
    
    for root, dirs, filenames in os.walk(path):
        # Exclude directories in-place
        dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS and not d.startswith(".")]
        
        for fname in filenames:
            if not is_text_file(fname):
                continue
            full_path = os.path.join(root, fname)
            rel_path = os.path.relpath(full_path, path).replace("\\", "/")
            try:
                # Skip files larger than 200KB
                if os.path.getsize(full_path) > 200 * 1024:
                    continue
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                files.append({"path": rel_path, "content": content})
            except Exception:
                continue
                
    return folder_name, files

async def analysis_stream_generator(req: AnalyzeRequest):
    try:
        # Stage 1: Reading files
        yield json.dumps({
            "stage": "reading",
            "message": "Reading and validating repository files...",
            "progress": 20
        }) + "\n"
        await asyncio.sleep(0.05)

        folder_name = req.folder_name or "Repository"
        raw_files = []

        if req.folder_path:
            folder_name, raw_files = read_files_from_disk(req.folder_path)
        elif req.files:
            raw_files = [{"path": f.path, "content": f.content} for f in req.files]
        else:
            raise ValueError("No files or folder path provided for analysis.")

        if not raw_files:
            raise ValueError("No readable text source files were found in the selected folder.")

        # Stage 2: Preparing context
        yield json.dumps({
            "stage": "context",
            "message": f"Filtering and prioritizing {len(raw_files)} files...",
            "progress": 40
        }) + "\n"
        await asyncio.sleep(0.05)

        context, accepted_count, total_count, is_truncated = filter_and_format_files(raw_files)
        
        if not context.strip():
            raise ValueError("All source files were empty or excluded by filters.")

        # Stage 3: Analyzing with Ollama
        yield json.dumps({
            "stage": "analyzing",
            "message": f"Analyzing {accepted_count} files with Ollama ({settings.ollama_model})...",
            "progress": 65
        }) + "\n"
        await asyncio.sleep(0.05)

        prompt = build_prompt(folder_name, context, is_truncated, total_count, accepted_count)

        # Stage 4: Generating document
        yield json.dumps({
            "stage": "generating",
            "message": "Generating requirements, architecture, and diagrams...",
            "progress": 85
        }) + "\n"
        await asyncio.sleep(0.05)

        markdown_doc = await call_ollama(prompt)

        # Stage 5: Complete
        yield json.dumps({
            "stage": "complete",
            "message": "Documentation generated successfully.",
            "progress": 100,
            "markdown": markdown_doc,
            "stats": {
                "folder_name": folder_name,
                "total_files": total_count,
                "analyzed_files": accepted_count,
                "truncated": is_truncated
            }
        }) + "\n"

    except Exception as e:
        logger.error(f"Analysis error: {e}", exc_info=True)
        yield json.dumps({
            "stage": "error",
            "message": str(e),
            "progress": 0
        }) + "\n"

@app.post("/analyze")
@app.post("/intelligence/analyze")
async def analyze_repository(req: AnalyzeRequest):
    return StreamingResponse(
        analysis_stream_generator(req),
        media_type="application/x-ndjson"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.port, reload=True)