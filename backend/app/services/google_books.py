import os
import requests
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")


# Exemple correct de structure pour Google Books
def search_books(query: str, start_index: int = 0, max_results: int = 10):
    params = {
        "q": query,
        "startIndex": max(0, start_index),
        "maxResults": max(1, min(max_results, 40)),  # API limit
    }
    if GOOGLE_API_KEY:
        params["key"] = GOOGLE_API_KEY

    response = requests.get(
        "https://www.googleapis.com/books/v1/volumes",
        params=params,
        timeout=10,
    )
    data = response.json()

    books = []
    for item in data.get("items", []):
        volume = item.get("volumeInfo", {})
        books.append({
            "id": item.get("id"),
            "volumeInfo": {
                "title": volume.get("title"),
                "authors": volume.get("authors", []),
                "description": volume.get("description", ""),
                "imageLinks": volume.get("imageLinks", {}),
                "publishedDate": volume.get("publishedDate"),
                "industryIdentifiers": volume.get("industryIdentifiers", []),
            },
        })
    return books
