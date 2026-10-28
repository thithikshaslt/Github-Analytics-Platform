import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    port: int = 5006
    mongo_uri: str = "mongodb://localhost:27017/github-analytics"
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "qwen3:8b"
    allowed_local_paths: str = ""
    snapshots_dir: str = str(Path(__file__).parent /"data" /"snapshots")
    max_repo_files: int = 500
    max_repo_size_mb: int = 50
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()