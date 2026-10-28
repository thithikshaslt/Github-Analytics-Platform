from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    port: int = 5006
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "qwen3:8b"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()