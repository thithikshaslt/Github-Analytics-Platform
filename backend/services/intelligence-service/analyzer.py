import os
import json
import logging
import httpx
from pathlib import Path
from config import settings

logger = logging.getLogger(__name__)

EXCLUDED_DIRS = {"node_modules", ".git", ".github", "__pycache__", ".venv", "venv", "env", ".next", "dist", "build", ".pytest_cache", ".idea", ".vscode"}

EXCLUDED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".mp4", ".zip", ".tar",".gz", ".pdf", ".exe", ".bin", ".pyc",".lock", ".min.js", ".min.css"}

def is_text_file(filename: str) -> bool:
    ext = Path(filename).suffix.lower()
    return ext not in EXCLUDED_EXTENSIONS

def filter_and_format_files(files: list[dict], max_chars: int = 35000) -> tuple[str, int, int, bool]:
    filtered = []
    for f in files:
        rel_path = f.get("path", "").replace("\\", "/")
        parts = rel_path.split("/")
        
        if any(p in EXCLUDED_DIRS for p in parts):
            continue
        if not is_text_file(rel_path):
            continue
            
        content = f.get("content", "")
        if not content.strip():
            continue
            
        filtered.append((rel_path, content))

    def priority_score(item):
        path, _ = item
        p_lower = path.lower()
        if "readme" in p_lower:
            return 0
        if any(k in p_lower for k in ["package.json", "requirements.txt"]):
            return 1
        if any(k in p_lower for k in ["main", "index", "app", "server"]):
            return 2
        if any(k in p_lower for k in ["routes", "router", "controller", "api"]):
            return 3
        if any(k in p_lower for k in ["model", "schema", "entity"]):
            return 4
        if any(k in p_lower for k in ["service", "util", "helper"]):
            return 5
        return 10

    filtered.sort(key=priority_score)

    context_parts = []
    current_chars = 0
    accepted_count = 0
    is_truncated = False

    for rel_path, content in filtered:
        file_text = content[:5000]
        block = f"--- File: {rel_path} ---\n{file_text}\n\n"
        
        if current_chars + len(block) > max_chars:
            is_truncated = True
            break
            
        context_parts.append(block)
        current_chars += len(block)
        accepted_count += 1

    if len(filtered) > accepted_count:
        is_truncated = True

    context_str = "".join(context_parts)
    return context_str, accepted_count, len(filtered), is_truncated

def build_prompt(repo_name: str, context: str, is_truncated: bool, total_files: int, accepted_files: int) -> str:
    coverage_note = ""
    if is_truncated:
        coverage_note = (
            f"> [!NOTE]\n"
            f"> **Scope Notice:** This repository has {total_files} source files. "
            f"Due to analysis context limits, this analysis is based on the top {accepted_files} "
            f"core architectural and entry-point files.\n\n"
        )

    return f"""You are an expert software architect and technical writer.
Analyze the following source code for project "{repo_name}" and reverse-engineer a clear, comprehensive, and professional documentation file.

SOURCE CODE CONTEXT:
{context}

INSTRUCTIONS:
Generate a single, well-structured Markdown document adhering strictly to this layout:

{coverage_note}# {repo_name} - Technical Documentation & Requirements

## 1. Project Overview
Provide a concise executive summary explaining what this application does, its core purpose, target audience, and primary technology stack.

## 2. Functional Requirements (FRD)
List the core functional requirements and business capabilities implemented in this codebase as concise bullet points.

## 3. Software Architecture & Design (SDD)
Describe the architectural pattern (e.g. MVC, microservices, layered, SPA), data flow, and external dependencies/integrations.

## 4. Key Modules & Responsibilities
Create a clean markdown table or list summarizing the major directories/modules found in the code and what each handles.

## 5. Major Workflows
Describe the primary end-to-end execution flow.
Include a simple, valid Mermaid diagram (e.g. sequenceDiagram or flowchart TD) representing the primary workflow ONLY if directly supported by the provided source code. Ensure the Mermaid syntax is 100% valid with no special unescaped characters.

Output ONLY the markdown document. Do not prepend any conversational filler like "Here is the document".
"""

async def call_ollama(prompt: str) -> str:
    """
    Calls Ollama local generate API with streaming chunk consumption so timeouts never trigger.
    """
    url = f"{settings.ollama_url}/api/generate"
    payload = {
        "model": settings.ollama_model,
        "prompt": prompt,
        "stream": True,
        "options": {
            "temperature": 0.2,
            "num_predict": 2500
        }
    }
    
    timeout = httpx.Timeout(300.0, connect=10.0, read=300.0)
    tokens = []

    async with httpx.AsyncClient(timeout=timeout) as client:
        async with client.stream("POST", url, json=payload) as response:
            if response.status_code != 200:
                err_body = await response.aread()
                raise RuntimeError(
                    f"Ollama returned HTTP {response.status_code}: {err_body.decode('utf-8', errors='replace')}"
                )
            
            async for raw_line in response.aiter_lines():
                line = raw_line.strip()
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    tok = data.get("response", "")
                    if tok:
                        tokens.append(tok)
                    if data.get("done", False):
                        break
                except Exception:
                    continue

    return "".join(tokens).strip()