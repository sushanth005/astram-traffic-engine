import os
import time
import requests
import numpy as np

# ==========================================
# HUGGING FACE INFERENCE API EMBEDDER
# ==========================================
# Replaces local SentenceTransformer("all-MiniLM-L6-v2") to avoid loading
# PyTorch at runtime, which exceeds Render's free-tier 512MB memory limit.
# Uses the same model via HF Inference API — embeddings are identical.

HF_API_URL = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"
HF_TOKEN = os.getenv("HF_TOKEN", "")

_headers = {"Authorization": f"Bearer {HF_TOKEN}"} if HF_TOKEN else {}


def get_embedding(text: str, retries: int = 3, wait: float = 5.0) -> np.ndarray:
    """
    Get a 384-dimensional embedding for `text` using the HF Inference API.
    Retries up to `retries` times on model-loading (503) responses.
    Returns a zero vector on unrecoverable failure so the app stays alive.
    """
    payload = {"inputs": text, "options": {"wait_for_model": True}}

    for attempt in range(retries):
        try:
            response = requests.post(HF_API_URL, headers=_headers, json=payload, timeout=30)

            if response.status_code == 200:
                data = response.json()
                # HF returns List[List[float]] for batched or List[float] for single
                if isinstance(data[0], list):
                    return np.array(data[0], dtype=np.float32)
                return np.array(data, dtype=np.float32)

            if response.status_code == 503:
                # Model is loading — wait and retry
                print(f"[embedder] HF model loading, retrying in {wait}s... (attempt {attempt + 1}/{retries})")
                time.sleep(wait)
                continue

            print(f"[embedder] Unexpected status {response.status_code}: {response.text[:200]}")
            break

        except requests.exceptions.RequestException as e:
            print(f"[embedder] Request error on attempt {attempt + 1}: {e}")
            if attempt < retries - 1:
                time.sleep(wait)

    # Fallback: return a zero vector (384 dims matches all-MiniLM-L6-v2)
    print("[embedder] WARNING: Returning zero vector as fallback.")
    return np.zeros(384, dtype=np.float32)
