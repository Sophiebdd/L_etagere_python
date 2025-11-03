from fastapi import APIRouter, Query
from app.services.google_books import search_books

router = APIRouter(prefix="/google", tags=["google-books"])

@router.get("/search")
def google_search(q: str = Query(...), start_index: int = 0, max_results: int = 10):
    return search_books(q, start_index, max_results)
