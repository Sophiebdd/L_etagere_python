import logging
import os
import time

import requests
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_BOOKS_API_KEY")
logger = logging.getLogger(__name__)
_CACHE_TTL_SECONDS = 300
_CACHE: dict[tuple, dict] = {}


def _format_book(item):
    volume = item.get("volumeInfo", {})
    return {
        "id": item.get("id"),
        "volumeInfo": {
            "title": volume.get("title"),
            "authors": volume.get("authors", []),
            "categories": volume.get("categories", []),
            "description": volume.get("description", ""),
            "imageLinks": volume.get("imageLinks", {}),
            "publishedDate": volume.get("publishedDate"),
            "industryIdentifiers": volume.get("industryIdentifiers", []),
            "language": volume.get("language"),
        },
    }


def _matches_language(item: dict, expected_language: str | None) -> bool:
    if not expected_language:
        return True
    volume = item.get("volumeInfo", {}) or {}
    return (volume.get("language") or "").lower() == expected_language.lower()


def _fetch_page(query: str, start_index: int, max_results: int, extra_params: dict | None = None):
    params = {
        "q": query,
        "startIndex": start_index,
        "maxResults": max_results,
    }
    if extra_params:
        params.update(extra_params)
    if GOOGLE_API_KEY:
        params["key"] = GOOGLE_API_KEY

    url = "https://www.googleapis.com/books/v1/volumes"
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            response = requests.get(url, params=params, timeout=10)
            if response.status_code in {429, 500, 502, 503, 504} and attempt < 2:
                time.sleep(0.5 * (2 ** attempt))
                continue
            response.raise_for_status()
            return response.json()
        except requests.RequestException as exc:
            last_error = exc
            if attempt < 2:
                time.sleep(0.5 * (2 ** attempt))
                continue
            break
    logger.warning("Google Books API request failed: %s", last_error)
    return {"items": [], "totalItems": 0}


# Exemple correct de structure pour Google Books
def search_books(
    query: str,
    start_index: int = 0,
    max_results: int = 10,
    extra_params: dict | None = None,
):
    safe_start = max(0, start_index)
    safe_max = max(1, min(max_results, 100))
    cache_key = (
        query,
        safe_start,
        safe_max,
        tuple(sorted((extra_params or {}).items())),
    )
    cached = _CACHE.get(cache_key)
    if cached and (time.time() - cached["ts"] < _CACHE_TTL_SECONDS):
        return cached["data"]

    expected_language = (extra_params or {}).get("langRestrict")
    target_count = safe_start + safe_max + 1
    collected_items: list[dict] = []
    raw_start = 0
    total_items = None

    # Boucle de surcollecte : appels successifs à Google Books + double filtrage par langue
    while len(collected_items) < target_count:
        batch_size = min(40, target_count - len(collected_items))
        if extra_params:
            data = _fetch_page(
                query,
                raw_start,
                batch_size,
                extra_params=extra_params,
            )
        else:
            data = _fetch_page(query, raw_start, batch_size)

        if total_items is None:
            total_items = data.get("totalItems", 0)

        raw_items = data.get("items", [])
        if not raw_items:
            break

        if expected_language:
            raw_items = [item for item in raw_items if _matches_language(item, expected_language)]

        collected_items.extend(raw_items)
        raw_start += batch_size

        if total_items is not None and raw_start >= total_items:
            break

    page_items = collected_items[safe_start:safe_start + safe_max]
    books = [_format_book(item) for item in page_items]
    has_more = len(collected_items) > safe_start + safe_max

    result = {
        "items": books,
        "total_items": len(books),
        "start_index": safe_start,
        "max_results": safe_max,
        "has_more": has_more,
    }
    _CACHE[cache_key] = {"ts": time.time(), "data": result}
    return result
