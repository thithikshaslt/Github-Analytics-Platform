import os
import shutil
import asyncio
import logging
from pathlib import Path
from config import settings

logger = logging.getLogger(__name__)

async def acquire_repository(repo_doc: dict) -> Path:
    """
    Acquires repository source files either via shallow git clone or local folder validation.
    Returns the Path to the directory containing source files.
    """
    repo_id = str(repo_doc["_id"])
    source_type = repo_doc.get("sourceType", "github")
   
    dest_dir = Path(settings.snapshots_dir) / repo_id
    dest_dir.parent.mkdir(parents=True, exist_ok=True)

    if source_type == "local":
        local_path = repo_doc.get("localPath")
        if not local_path or not os.path.exists(local_path):
            raise ValueError(f"Local path does not exist: {local_path}")
       
        if settings.allowed_local_paths:
            allowed = [p.strip() for p in settings.allowed_local_paths.split(",") if p.strip()]
            resolved = str(Path(local_path).resolve())
            if not any(resolved.startswith(str(Path(a).resolve())) for a in allowed):
                raise PermissionError(f"Local path {local_path} is not in the allowed paths list.")
       
        return Path(local_path)

    clone_url = repo_doc.get("cloneUrl")
    if not clone_url:
        full_name = repo_doc.get("fullName")
        if full_name:
            clone_url = f"https://github.com/{full_name}.git"
        else:
            raise ValueError("No clone URL or repository full name provided")

    if dest_dir.exists():
        shutil.rmtree(dest_dir, ignore_errors=True)
   
    branch = repo_doc.get("defaultBranch", "main")
    cmd = ["git", "clone", "--depth=1", "--single-branch", "-b", branch, clone_url, str(dest_dir)]
    logger.info(f"Cloning {clone_url} into {dest_dir}...")

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    stdout, stderr = await proc.communicate()


    if proc.returncode != 0:
        fallback_cmd = ["git", "clone", "--depth=1", "--single-branch", clone_url, str(dest_dir)]
        logger.info(f"Retrying clone without branch flag: {clone_url}")
        proc = await asyncio.create_subprocess_exec(
            *fallback_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await proc.communicate()
        if proc.returncode != 0:
            err_msg = stderr.decode(errors="replace")
            logger.error(f"Git clone failed: {err_msg}")
            raise RuntimeError(f"Git clone failed: {err_msg}")

    return dest_dir