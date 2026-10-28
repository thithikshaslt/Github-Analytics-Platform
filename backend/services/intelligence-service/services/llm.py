import logging
import httpx
from typing import Dict, Any, Optional
from config import settings


logger = logging.getLogger(__name__)


async def check_ollama_health() -> Dict[str, Any]:
    """
    Checks if Ollama is reachable and whether the configured model is installed.
    """
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{settings.ollama_url}/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("name") for m in data.get("models", [])]
                configured_model = settings.ollama_model
                # Check if configured model exists (with or without :latest / tag)
                has_model = any(configured_model in m or m.startswith(configured_model.split(":")[0]) for m in models)
                return {
                    "connected": True,
                    "models": models,
                    "targetModelAvailable": has_model,
                    "configuredModel": configured_model
                }
    except Exception as e:
        logger.warning(f"Ollama health check failed: {e}")
    return {
        "connected": False,
        "models": [],
        "targetModelAvailable": False,
        "configuredModel": settings.ollama_model
    }


async def generate(prompt: str, system_prompt: Optional[str] = None) -> str:
    """
    Sends a generation request to the local Ollama instance.
    """
    url = f"{settings.ollama_url}/api/generate"
    payload = {
        "model": settings.ollama_model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.2,
            "top_p": 0.9,
        }
    }
    if system_prompt:
        payload["system"] = system_prompt


    try:
        # Code generation / reverse engineering can take 30-180 seconds depending on hardware
        async with httpx.AsyncClient(timeout=300.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                result = resp.json()
                return result.get("response", "").strip()
            else:
                err_text = resp.text
                logger.error(f"Ollama generation error {resp.status_code}: {err_text}")
                raise RuntimeError(f"Ollama returned HTTP {resp.status_code}: {err_text}")
    except httpx.ConnectError:
        raise ConnectionError(
            f"Could not connect to Ollama at {settings.ollama_url}. "
    "Please ensure Ollama is installed and running (`ollama serve`)."
        )
    except httpx.TimeoutException:
        raise TimeoutError("Ollama generation timed out after 300 seconds.")
    except Exception as e:
        logger.error(f"Unexpected error calling Ollama: {e}")
        raise