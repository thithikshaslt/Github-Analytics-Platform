from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class RepositoryRegisterRequest(BaseModel):
    sourceType: str = Field(..., description="'github' or 'local'")
    fullName: str = Field(..., description="e.g. 'octocat/Hello-World' or local project name")
    name: str = Field(..., description="Repository name")
    owner: str = Field(..., description="GitHub owner or local user")
    cloneUrl: Optional[str] = Field(None, description="HTTPS clone URL for GitHub repos")
    defaultBranch: str = Field("main", description="Default git branch")
    localPath: Optional[str] = Field(None, description="Absolute local path if sourceType is 'local'")

class RepositoryResponse(BaseModel):
    id: str
    sourceType: str
    fullName: str
    name: str
    owner: str
    cloneUrl: Optional[str] = None
    defaultBranch: str = "main"
    localPath: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    lastAnalyzedAt: Optional[datetime] = None

class AnalysisCreateRequest(BaseModel):
    repositoryId: str

class AnalysisResponse(BaseModel):
    id: str
    repositoryId: str
    status: str  # "queued", "cloning", "reading", "generating", "completed", "failed"
    progressMessage: Optional[str] = None
    errorMessage: Optional[str] = None
    overview: Optional[str] = None
    requirements: Optional[str] = None
    designDoc: Optional[str] = None
    diagrams: Optional[str] = None
    fileCount: Optional[int] = None
    totalSizeKb: Optional[float] = None
    createdAt: datetime
    completedAt: Optional[datetime] = None

class QARequest(BaseModel):
    repositoryId: str
    question: str

class QAResponse(BaseModel):
    id: str
    repositoryId: str
    question: str
    answer: str
    relevantFiles: List[str] = []
    createdAt: datetime