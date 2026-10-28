import logging
from typing import Dict, Any, List
from services import llm


logger = logging.getLogger(__name__)


SYSTEM_PROMPT = (
    "You are an expert Software Architect and Reverse Engineering AI assistant. "
    "Your task is to analyze real source code from a software project and generate clear, "
    "accurate, professional documentation. Always be factual, grounded strictly in the provided code, "
    "and use clean GitHub-flavored Markdown formatting."
)


def build_context_snippet(files: Dict[str, str], file_paths: List[str], max_chars: int = 16000) -> str:
    """
    Concatenates file contents with headers up to max_chars limit to fit in LLM context.
    """
    snippets = []
    total_len = 0
    for path in file_paths:
        content = files.get(path, "")
        snippet = f"--- File: {path} ---\n{content}\n"
        if total_len + len(snippet) > max_chars:
            # Add truncated snippet
            remaining = max_chars - total_len
            if remaining > 200:
                snippets.append(snippet[:remaining] + "\n... [truncated for length] ...\n")
            break
        snippets.append(snippet)
        total_len += len(snippet)
    return "\n".join(snippets)


async def generate_overview(repo_data: Dict[str, Any]) -> str:
    files = repo_data["files"]
    categories = repo_data["categories"]
    stats = repo_data["stats"]


    # Gather config files and key source files
    key_files = categories["config"] + categories["routes_api"][:3] + categories["models_data"][:3]
    context = build_context_snippet(files, key_files, max_chars=14000)


    prompt = f"""You are analyzing a software codebase. Here is the directory structure overview:


```text
{stats.get("directory_tree", "")}
```


Key configuration and entry point files:
{context}


Please generate a comprehensive **Codebase Overview**:
1. **Project Title & Core Purpose**: What problem does this application solve?
2. **Technology Stack**: Programming languages, frameworks, libraries, database, and tools identified.
3. **Architecture Summary**: High-level structural pattern (e.g. Microservices, MVC, Single Page Application, Monolith).
4. **Directory Structure & Organization**: Explain the role of key directories and modules.
5. **Key Capabilities**: Bullet points describing the core capabilities of the system.


Format your response in clean Markdown with clear headings and bullet points.
"""
    return await llm.generate(prompt, SYSTEM_PROMPT)


async def generate_requirements(repo_data: Dict[str, Any]) -> str:
    files = repo_data["files"]
    categories = repo_data["categories"]


    # Focus on routes, models, and UI components
    key_files = categories["routes_api"] + categories["models_data"] + categories["ui_components"][:4]
    context = build_context_snippet(files, key_files, max_chars=16000)


    prompt = f"""You are reverse-engineering functional specifications from the following source code:


{context}


Based purely on the actual routes, data models, and user interfaces shown above, generate a detailed **Functional Requirements Document (FRD)**:
1. **User Roles & Personas**: Who interacts with this system?
2. **Functional Requirements by Feature**:
   - For each feature, provide:
     - Requirement ID (e.g., FR-1, FR-2)
     - Feature Name
     - Description of the feature
     - Inputs, Processing, and Outputs
3. **User Stories**:
   - Write at least 4 realistic user stories in the format: *As a [role], I want to [action], so that [benefit]*.
   - Include Acceptance Criteria (Given / When / Then) for each.
4. **Validation & Business Rules**: Any field validations, authentication, or constraints found in the code.


Format in professional GitHub-flavored Markdown with tables where appropriate.
"""
    return await llm.generate(prompt, SYSTEM_PROMPT)


async def generate_design_doc(repo_data: Dict[str, Any]) -> str:
    files = repo_data["files"]
    categories = repo_data["categories"]


    # Focus on models, services, routes, and config
    key_files = categories["models_data"] + categories["services_logic"] + categories["routes_api"] + categories["config"][:2]
    context = build_context_snippet(files, key_files, max_chars=16000)


    prompt = f"""You are reverse-engineering a technical design specification from the following source code:


{context}


Generate a comprehensive **Software Design Document (SDD)**:
1. **System Architecture**:
   - Components & modules and their respective responsibilities.
   - Client-server or microservice interaction pattern.
2. **Data Models & Schema Design**:
   - Entities, collections/tables, fields, data types, and relationships inferred from the models.
3. **API & Interface Contracts**:
   - List key endpoints, HTTP methods, expected request payloads, and response structures.
4. **Data Flow & Processing Lifecycle**:
   - Step-by-step lifecycle of a primary user request from trigger to persistence.
5. **Security, Error Handling & Reliability**:
   - Observed error handling strategies, environment variables, authentication, and potential failure modes.


Format in professional Markdown with code blocks and tables.
"""
    return await llm.generate(prompt, SYSTEM_PROMPT)


async def generate_diagrams(repo_data: Dict[str, Any]) -> str:
    files = repo_data["files"]
    categories = repo_data["categories"]


    key_files = categories["routes_api"] + categories["models_data"] + categories["services_logic"][:3]
    context = build_context_snippet(files, key_files, max_chars=14000)


    prompt = f"""You are a technical diagram expert. Based on the following source code:


{context}


Generate valid **Mermaid Diagrams** representing this codebase. You MUST provide exactly 3 distinct diagrams in markdown ```mermaid ... ``` code blocks:


1. **System Architecture / Component Diagram** (using `graph TD` or `flowchart TD`):
   - Show frontend clients, API gateway / routers, services, database, and any external integrations.
2. **Sequence Diagram** (using `sequenceDiagram`):
   - Trace the primary user request lifecycle across components (e.g. Client -> Gateway -> Service -> Database).
3. **Data Model / Entity Relationship or State Flowchart** (using `classDiagram` or `flowchart LR`):
   - Illustrate the data entities and their connections or the state machine of the primary entity.


IMPORTANT: Ensure the Mermaid syntax is strictly valid and properly escaped. Do not use unescaped parentheses or special characters inside node names. Provide a brief explanation for each diagram.
"""
    return await llm.generate(prompt, SYSTEM_PROMPT)
