import os
from pathlib import Path
from typing import Dict, List, Any
from config import settings

SKIP_DIRS = {
    ".git", "node_modules", "__pycache__", ".venv", "venv", "env",
    "dist", "build", ".next", ".vite", "coverage", "bower_components",
    ".idea", ".vscode", "vendor", "target", "bin", "obj"
}

SKIP_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp",
    ".woff", ".woff2", ".ttf", ".eot", ".otf",
    ".lock", "-lock.json", ".min.js", ".min.css", ".map",
    ".exe", ".dll", ".so", ".bin", ".zip", ".tar", ".gz", ".7z",
    ".pdf", ".mp4", ".mp3", ".wav", ".avi", ".mov",
    ".pyc", ".pyo", ".pyd", ".class", ".jar"
}

MAX_SINGLE_FILE_BYTES = 100 * 1024  # 100 KB

def categorize_file(rel_path: str) -> str:
    path_lower = rel_path.lower().replace("\\", "/")
    filename = Path(rel_path).name.lower()

    if filename in ["package.json", "requirements.txt", "pom.xml", "dockerfile", "docker-compose.yml", "docker-compose.yaml", "cargo.toml", "go.mod", "tsconfig.json", "vite.config.js", "vite.config.ts"]:
        return "config"
   
    parts = path_lower.split("/")
    if any(p in ["routes", "controllers", "api", "endpoints"] for p in parts):
        return "routes_api"
    if any(p in ["models", "schemas", "entities", "db", "database"] for p in parts):
        return "models_data"
    if any(p in ["components", "pages", "views", "templates", "ui"] for p in parts):
        return "ui_components"
    if any(p in ["services", "utils", "lib", "helpers", "core"] for p in parts):
        return "services_logic"
   
    return "other_source"

def read_repository_files(repo_path: Path) -> Dict[str, Any]:
    """
    Recursively scans and reads text files from the repository directory.
    Enforces size and file count caps. Returns categorized files and metadata.
    """
    files: Dict[str, str] = {}
    categories: Dict[str, List[str]] = {
        "config": [],
        "routes_api": [],
        "models_data": [],
        "ui_components": [],
        "services_logic": [],
        "other_source": []
    }
    total_bytes = 0
    tree_lines = []

    for root, dirs, filenames in os.walk(repo_path):
        # Prune skipped directories
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith(".")]

        rel_root = os.path.relpath(root, repo_path)
        if rel_root != ".":
            depth = rel_root.count(os.sep)
            indent = "  " * depth
            folder_name = os.path.basename(root)
            tree_lines.append(f"{indent}📁 {folder_name}/")

        for f in filenames:
            ext = os.path.splitext(f)[1].lower()
            if ext in SKIP_EXTENSIONS or f.endswith("-lock.json"):
                continue

            full_path = Path(root) / f
            try:
                file_size = full_path.stat().st_size
                if file_size > MAX_SINGLE_FILE_BYTES:
                    continue

                if total_bytes + file_size > settings.max_repo_size_mb * 1024 * 1024:
                    break

                if len(files) >= settings.max_repo_files:
                    break

                with open(full_path, "r", encoding="utf-8", errors="ignore") as fp:
                    content = fp.read()

                rel_path = str(full_path.relative_to(repo_path)).replace("\\", "/")
                files[rel_path] = content
                total_bytes += file_size

                cat = categorize_file(rel_path)
                categories[cat].append(rel_path)

                depth = rel_path.count("/")
                indent = "  " * depth
                tree_lines.append(f"{indent}📄 {f}")

            except Exception:
                continue

    return {
        "files": files,
        "categories": categories,
        "stats": {
            "file_count": len(files),
            "total_size_kb": round(total_bytes / 1024, 2),
            "directory_tree": "\n".join(tree_lines[:200])  # limit tree preview
        }
    }