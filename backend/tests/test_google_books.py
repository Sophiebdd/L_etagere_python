from app.services import google_books


def test_search_books_filters_non_french_items(monkeypatch):
    def fake_fetch_page(query, start_index, max_results, extra_params=None):
        return {
            "items": [
                {
                    "id": "fr-book",
                    "volumeInfo": {
                        "title": "Livre FR",
                        "authors": ["Auteur FR"],
                        "language": "fr",
                        "publishedDate": "2020-01-01",
                    },
                },
                {
                    "id": "en-book",
                    "volumeInfo": {
                        "title": "English Book",
                        "authors": ["English Author"],
                        "language": "en",
                        "publishedDate": "2020-01-01",
                    },
                },
            ],
            "totalItems": 2,
        }

    monkeypatch.setattr(google_books, "_fetch_page", fake_fetch_page)

    results = google_books.search_books(
        "roman",
        start_index=0,
        max_results=10,
        extra_params={"langRestrict": "fr"},
    )

    assert results["total_items"] == 2
    assert len(results["items"]) == 1
    assert results["items"][0]["id"] == "fr-book"
    assert results["items"][0]["volumeInfo"]["language"] == "fr"
