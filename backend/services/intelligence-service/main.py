import os
import json
import asyncio
import logging
import tempfile
import shutil
import stat
import subprocess
import re
from pathlib import Path
from typing import Optional, List
from urllib.parse import urlsplit
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

OWNER_PATTERN = re.compile(r"^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$")
REPO_PATTERN = re.compile(r"^[a-zA-Z0-9_.-]{1,100}$")

MAX_REPO_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB
MAX_REPO_FILES = 5000
CLONE_TIMEOUT_SECONDS = 60

def parse_and_validate_github_url(raw_url: str) -> tuple[str, str, str]:
    """
    Validates a public GitHub repository URL strictly.
    Returns: (canonical_clone_url, owner, repo)
    """
    if not raw_url or not isinstance(raw_url, str):
        raise ValueError("GitHub repository URL must be provided.")

    url = raw_url.strip()
    if not url:
        raise ValueError("GitHub repository URL cannot be empty.")

    try:
        parsed = urlsplit(url)
    except Exception:
        raise ValueError("Invalid URL format.")

    if parsed.scheme.lower() != "https":
        raise ValueError("Only secure HTTPS GitHub URLs are supported (e.g. https://github.com/owner/repository).")

    hostname = (parsed.hostname or "").lower()
    if hostname != "github.com":
        raise ValueError("Only repositories hosted on github.com are supported.")

    if parsed.username or parsed.password or "@" in (parsed.netloc or ""):
        raise ValueError("Embedded credentials in GitHub URLs are not permitted.")

    if parsed.port is not None:
        raise ValueError("Custom ports in GitHub URLs are not permitted.")
    if parsed.query:
        raise ValueError("Query parameters are not permitted in GitHub repository URLs.")
    if parsed.fragment:
        raise ValueError("URL fragments are not permitted in GitHub repository URLs.")
    path = parsed.path.strip("/")
    segments = [s for s in path.split("/") if s]

    if len(segments) < 2:
        raise ValueError("Invalid GitHub repository URL: expected format https://github.com/owner/repository.")
    if len(segments) > 2:
        raise ValueError("Invalid GitHub repository URL: subpaths, branches, commits, issues, and PRs are not supported.")

    owner = segments[0]
    raw_repo = segments[1]
    if raw_repo.lower().endswith(".git"):
        repo = raw_repo[:-4]
    else:
        repo = raw_repo

    if not repo or repo in (".", ".."):
        raise ValueError("Invalid repository name in GitHub URL.")

    if not OWNER_PATTERN.match(owner):
        raise ValueError(f"Invalid GitHub owner/organization name: '{owner}'.")

    if not REPO_PATTERN.match(repo):
        raise ValueError(f"Invalid GitHub repository name: '{repo}'.")

    canonical_url = f"https://github.com/{owner}/{repo}.git"
    return canonical_url, owner, repo

def remove_readonly(func, path, excinfo):
    try:
        os.chmod(path, stat.S_IWRITE)
        func(path)
    except Exception:
        pass

def cleanup_directory(directory_path: str):
    if directory_path and os.path.exists(directory_path):
        try:
            shutil.rmtree(directory_path, onerror=remove_readonly)
        except Exception as e:
            logger.warning(f"Failed to remove temp dir {directory_path}: {e}")

def check_cloned_repo_limits(clone_dir: str):
    total_size = 0
    total_files = 0
    for root, _, filenames in os.walk(clone_dir):
        total_files += len(filenames)
        if total_files > MAX_REPO_FILES:
            raise ValueError(f"Repository exceeds file count limit ({MAX_REPO_FILES} files).")
        for fname in filenames:
            fpath = os.path.join(root, fname)
            try:
                total_size += os.path.getsize(fpath)
            except OSError:
                pass
            if total_size > MAX_REPO_SIZE_BYTES:
                raise ValueError("Repository exceeds size limit for analysis (maximum 100MB).")

def clone_github_repo(canonical_url: str, target_dir: str):
    """
    Shallow-clones a public GitHub repo into target_dir safely using git CLI.
    """
    cmd = [
        "git",
        "-c", "credential.helper=",
        "-c", "http.followRedirects=false",
        "-c", "protocol.allow=never",
        "-c", "protocol.https.allow=always",
        "clone",
        "--depth", "1",
        "--single-branch",
        canonical_url,
        target_dir
    ]

    env = dict(os.environ, GIT_TERMINAL_PROMPT="0", GIT_ASKPASS="")

    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            env=env,
            timeout=CLONE_TIMEOUT_SECONDS
        )
    except subprocess.TimeoutExpired:
        raise ValueError(f"Cloning repository timed out after {CLONE_TIMEOUT_SECONDS} seconds.")

    if proc.returncode != 0:
        err_msg = (proc.stderr or proc.stdout or "").strip()
        logger.warning(f"Git clone failed (code {proc.returncode}): {err_msg}")

        lower_err = err_msg.lower()
        if "could not read username" in lower_err or "terminal prompts disabled" in lower_err or "authentication failed" in lower_err:
            raise ValueError("Repository not found, is private, or requires authentication. Only public repositories are supported.")
        elif "repository not found" in lower_err or "not found" in lower_err:
            raise ValueError("Repository not found on GitHub. Please check the URL.")
        elif "could not resolve host" in lower_err or "getaddrinfo" in lower_err:
            raise ValueError("Failed to connect to GitHub. Please check network connectivity.")
        else:
            first_err_line = err_msg.splitlines()[-1] if err_msg else "Unknown clone error"
            raise ValueError(f"Failed to clone repository: {first_err_line}")

class FileItem(BaseModel):
    path: str
    content: str

class AnalyzeRequest(BaseModel):
    folder_name: Optional[str] = "Repository"
    folder_path: Optional[str] = None
    files: Optional[List[FileItem]] = None
    github_url: Optional[str] = None

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
    temp_dir = None
    try:
        folder_name = req.folder_name or "Repository"
        raw_files = []

        if req.github_url:
            yield json.dumps({
                "stage": "validating",
                "message": "Validating GitHub URL...",
                "progress": 5
            }) + "\n"
            await asyncio.sleep(0.05)

            canonical_url, owner, repo = parse_and_validate_github_url(req.github_url)
            folder_name = repo

            yield json.dumps({
                "stage": "cloning",
                "message": f"Cloning {owner}/{repo} (shallow clone)...",
                "progress": 15
            }) + "\n"
            await asyncio.sleep(0.05)

            temp_dir = tempfile.mkdtemp(prefix=f"gh_{repo}_")

            await asyncio.to_thread(clone_github_repo, canonical_url, temp_dir)
            await asyncio.to_thread(check_cloned_repo_limits, temp_dir)

            yield json.dumps({
                "stage": "reading",
                "message": "Reading files...",
                "progress": 30
            }) + "\n"
            await asyncio.sleep(0.05)

            _, raw_files = read_files_from_disk(temp_dir)

        elif req.folder_path:
            yield json.dumps({
                "stage": "reading",
                "message": "Reading files...",
                "progress": 20
            }) + "\n"
            await asyncio.sleep(0.05)

            folder_name, raw_files = read_files_from_disk(req.folder_path)

        elif req.files:
            # Stage 1: Reading files
            yield json.dumps({
                "stage": "reading",
                "message": "Reading files...",
                "progress": 20
            }) + "\n"
            await asyncio.sleep(0.05)

            raw_files = [{"path": f.path, "content": f.content} for f in req.files]

        else:
            raise ValueError("No files or GitHub repository URL provided for analysis.")

        if not raw_files:
            raise ValueError("No readable text source files were found in the selected repository or folder.")

        # Stage 2: Preparing context
        progress_context = 45 if req.github_url else 40
        yield json.dumps({
            "stage": "context",
            "message": f"Preparing context ({len(raw_files)} files)...",
            "progress": progress_context
        }) + "\n"
        await asyncio.sleep(0.05)

        context, accepted_count, total_count, is_truncated = filter_and_format_files(raw_files)
        
        if not context.strip():
            raise ValueError("All source files were empty or excluded by filters.")

        # Stage 3: Analyzing with Ollama
        progress_analyzing = 70 if req.github_url else 65
        yield json.dumps({
            "stage": "analyzing",
            "message": f"Analyzing with Ollama ({settings.ollama_model})...",
            "progress": progress_analyzing
        }) + "\n"
        await asyncio.sleep(0.05)

        prompt = build_prompt(folder_name, context, is_truncated, total_count, accepted_count)

        # Stage 4: Generating document
        progress_generating = 88 if req.github_url else 85
        yield json.dumps({
            "stage": "generating",
            "message": "Generating document...",
            "progress": progress_generating
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

    finally:
        if temp_dir and os.path.exists(temp_dir):
            cleanup_directory(temp_dir)

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