from __future__ import annotations

from collections import Counter
import re
import random

from sqlalchemy.orm import Session

from app.models.book import Book
from app.services.embeddings import (
    average_embeddings,
    build_book_text,
    cosine_similarity,
    embed_text,
)
from app.services.google_books import search_books

_STATUS_READ = "Lu"
_STOPWORDS = {
    "alors",
    "avec",
    "avoir",
    "cette",
    "comme",
    "dans",
    "des",
    "elle",
    "elles",
    "est",
    "etre",
    "être",
    "fait",
    "fois",
    "grand",
    "grands",
    "leur",
    "leurs",
    "mais",
    "meme",
    "même",
    "monde",
    "nous",
    "notre",
    "pour",
    "plus",
    "plusieurs",
    "quand",
    "que",
    "quel",
    "quelle",
    "qui",
    "roman",
    "sans",
    "ses",
    "son",
    "sont",
    "sur",
    "tout",
    "tous",
    "une",
    "votre",
    "vous",
    "the",
    "and",
    "with",
    "from",
    "into",
    "this",
    "that",
    "your",
    "their",
    "there",
    "where",
    "about",
}


def _normalize_title(title: str) -> str:
    if not title:
        return ""
    value = title.lower()
    value = re.sub(r"\(.*?\)", " ", value)
    value = re.sub(r"\[.*?\]", " ", value)
    value = re.sub(r"[:\-–—]\s*(tome|vol|volume|livre|édition|edition)\s*\d+", " ", value)
    value = re.sub(r"\b(tome|vol|volume|livre|édition|edition|integrale|intégrale)\b", " ", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def _pick_isbn(identifiers: list[dict] | None) -> str | None:
    if not identifiers:
        return None
    for isbn_type in ("ISBN_13", "ISBN_10"):
        for item in identifiers:
            if item.get("type") == isbn_type:
                return item.get("identifier")
    return identifiers[0].get("identifier")


def _format_candidate(item: dict) -> dict:
    volume = item.get("volumeInfo", {}) or {}
    authors = volume.get("authors") or []
    categories = volume.get("categories") or []
    image_links = volume.get("imageLinks") or {}
    return {
        "external_id": item.get("id"),
        "title": volume.get("title") or "Titre inconnu",
        "author": ", ".join(authors) if authors else "Auteur inconnu",
        "description": volume.get("description") or "",
        "publication_date": volume.get("publishedDate"),
        "isbn": _pick_isbn(volume.get("industryIdentifiers")),
        "cover_image": image_links.get("thumbnail") or image_links.get("smallThumbnail"),
        "genre": categories[0] if categories else None,
        "language": volume.get("language"),
    }


def _quote_term(value: str) -> str:
    return f"\"{value}\"" if " " in value else value


def _extract_keywords(books: list[Book], max_terms: int = 5) -> list[str]:
    words: list[str] = []
    for book in books:
        if not book.description:
            continue
        clean = re.sub(r"<[^>]*>", " ", book.description.lower())
        words.extend(re.findall(r"[a-zàâäéèêëîïôöùûüç'-]{4,}", clean))
    counts = Counter(
        word.strip("-'") for word in words if word not in _STOPWORDS
    )
    return [word for word, _ in counts.most_common(max_terms)]


def _build_query(books: list[Book]) -> str:
    genres = [book.genre for book in books if book.genre]
    authors = [book.author for book in books if book.author]
    titles = [book.title for book in books if book.title]
    keywords = _extract_keywords(books)

    parts: list[str] = []
    if genres:
        for genre, _ in Counter(genres).most_common(2):
            parts.append(f"subject:{_quote_term(genre)}")
    if authors:
        for author, _ in Counter(authors).most_common(2):
            parts.append(f"inauthor:{_quote_term(author)}")
    if not parts and titles:
        for title, _ in Counter(titles).most_common(2):
            parts.append(f"intitle:{_quote_term(title)}")
    if not parts and keywords:
        for keyword in keywords:
            parts.append(_quote_term(keyword))
    return " OR ".join(parts[:8]).strip()


def _build_queries(books: list[Book]) -> list[str]:
    genres = [book.genre for book in books if book.genre]
    authors = [book.author for book in books if book.author]
    titles = [book.title for book in books if book.title]
    keywords = _extract_keywords(books, max_terms=6)

    queries: list[str] = []
    for author, _ in Counter(authors).most_common(2):
        queries.append(f"inauthor:{_quote_term(author)}")
    for genre, _ in Counter(genres).most_common(2):
        queries.append(f"subject:{_quote_term(genre)}")
    for title, _ in Counter(titles).most_common(1):
        queries.append(f"intitle:{_quote_term(title)}")
    if keywords:
        keyword_query = " OR ".join(_quote_term(word) for word in keywords[:3])
        if keyword_query:
            queries.append(keyword_query)

    return queries


def _ensure_embedding(book: Book) -> tuple[list[float], bool]:
    if book.embedding:
        return list(book.embedding), False
    text = build_book_text(book.title, book.author, book.description, book.genre)
    embedding = embed_text(text)
    book.embedding = embedding or None
    return embedding, bool(embedding)


def recommend_books(db: Session, user_id: int, limit: int = 10) -> list[dict]:
    favorite_books = (
        db.query(Book)
        .filter(Book.user_id == user_id, Book.is_favorite.is_(True))
        .all()
    )
    seed_books = favorite_books
    if not seed_books:
        seed_books = (
            db.query(Book)
            .filter(Book.user_id == user_id, Book.status == _STATUS_READ)
            .all()
        )
    if not seed_books:
        return []

    vectors: list[list[float]] = []
    weights: list[float] = []
    needs_commit = False
    for book in seed_books:
        embedding, updated = _ensure_embedding(book)
        if embedding:
            vectors.append(embedding)
            weights.append(1.5 if book.is_favorite else 1.0)
        if updated:
            needs_commit = True

    if needs_commit:
        db.commit()

    if not vectors:
        return []

    profile = average_embeddings(vectors, weights)
    query = _build_query(seed_books)
    if not query:
        return []

    queries = _build_queries(seed_books)
    if not queries:
        queries = [query]

    candidates: list[dict] = []
    for q in queries[:2]:
        results = search_books(
            q,
            start_index=0,
            max_results=max(limit * 3, 40),
            extra_params={"printType": "books", "orderBy": "relevance", "langRestrict": "fr"},
        )
        candidates.extend(results.get("items", []))

    if not candidates:
        fallback_query = _build_query(seed_books[:3]) or query
        if fallback_query and fallback_query not in queries:
            results = search_books(
                fallback_query,
                start_index=0,
                max_results=max(limit * 3, 40),
                extra_params={"printType": "books", "orderBy": "relevance", "langRestrict": "fr"},
            )
            candidates = results.get("items", [])

    user_books = db.query(Book).filter(Book.user_id == user_id).all()
    existing_ids = {book.external_id for book in user_books if book.external_id}
    existing_pairs = {
        ((book.title or "").strip().lower(), (book.author or "").strip().lower())
        for book in user_books
    }
    existing_titles = {_normalize_title(book.title or "") for book in user_books}

    scored: list[tuple[float, dict]] = []
    fallback: list[dict] = []
    for item in candidates:
        candidate = _format_candidate(item)
        if candidate.get("language") and candidate["language"] not in {"fr", "en"}:
            continue
        title_lower = (candidate["title"] or "").strip().lower()
        if title_lower in {"kindle", "kindle edition"}:
            continue
        if not candidate["description"] and not candidate["cover_image"]:
            continue
        if candidate["external_id"] and candidate["external_id"] in existing_ids:
            continue
        candidate_key = (
            (candidate["title"] or "").strip().lower(),
            (candidate["author"] or "").strip().lower(),
        )
        if candidate_key in existing_pairs:
            continue
        if _normalize_title(candidate["title"] or "") in existing_titles:
            continue
        candidate_text = build_book_text(
            candidate["title"],
            candidate["author"],
            candidate["description"],
            candidate["genre"],
        )
        candidate_embedding = embed_text(candidate_text)
        if not candidate_embedding:
            fallback.append(candidate)
            continue
        score = cosine_similarity(profile, candidate_embedding)
        if candidate.get("language") == "fr":
            score *= 1.05
        candidate["score"] = score
        scored.append((score, candidate))

    if scored:
        scored.sort(key=lambda item: item[0], reverse=True)
        # Limit to 1 book per author
        unique_by_author: list[dict] = []
        seen_authors: set[str] = set()
        for _, candidate in scored:
            author_key = (candidate.get("author") or "").strip().lower()
            if not author_key:
                author_key = "auteur_inconnu"
            if author_key in seen_authors:
                continue
            seen_authors.add(author_key)
            unique_by_author.append(candidate)

        if not unique_by_author:
            unique_by_author = [item for _, item in scored]

        # Mix exploration: 70% top, 30% random from remaining
        top_count = max(1, int(limit * 0.7))
        top_slice = unique_by_author[:top_count]
        remaining_pool = unique_by_author[top_count:]
        if remaining_pool:
            random_count = min(limit - len(top_slice), len(remaining_pool))
            top_slice.extend(random.sample(remaining_pool, random_count))
        return top_slice[:limit]
    return fallback[:limit]
