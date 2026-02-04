from functools import lru_cache
from typing import Iterable

import numpy as np
from sentence_transformers import SentenceTransformer

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


@lru_cache(maxsize=1)
def _get_model() -> SentenceTransformer:
    return SentenceTransformer(MODEL_NAME)


def build_book_text(
    title: str | None,
    author: str | None,
    description: str | None,
    genre: str | None,
) -> str:
    parts: list[str] = []
    if title:
        parts.append(title)
    if author:
        parts.append(f"Auteur: {author}")
    if genre:
        parts.append(f"Genre: {genre}")
    if description:
        parts.append(description)
    return ". ".join(parts).strip()


def embed_text(text: str) -> list[float]:
    if not text or not text.strip():
        return []
    model = _get_model()
    vector = model.encode([text], normalize_embeddings=True)[0]
    return vector.astype(float).tolist()


def cosine_similarity(vec_a: Iterable[float], vec_b: Iterable[float]) -> float:
    a = np.asarray(list(vec_a), dtype=float)
    b = np.asarray(list(vec_b), dtype=float)
    if a.size == 0 or b.size == 0:
        return 0.0
    denom = float(np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0.0:
        return 0.0
    return float(np.dot(a, b) / denom)


def average_embeddings(vectors: list[list[float]], weights: list[float]) -> list[float]:
    if not vectors:
        return []
    if not weights:
        weights = [1.0] * len(vectors)
    stacked = np.asarray(vectors, dtype=float)
    averaged = np.average(stacked, axis=0, weights=np.asarray(weights, dtype=float))
    norm = float(np.linalg.norm(averaged))
    if norm == 0.0:
        return averaged.tolist()
    return (averaged / norm).tolist()
