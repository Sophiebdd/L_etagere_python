from app.services import google_books


def test_google_search_returns_items(client, monkeypatch):
    def fake_fetch_page(query: str, start_index: int, max_results: int):
        assert query == "python"
        assert start_index == 0
        assert max_results == 2
        return {
            "totalItems": 2,
            "items": [
                {"id": "1", "volumeInfo": {"title": "Book A", "authors": ["A"]}},
                {"id": "2", "volumeInfo": {"title": "Book B", "authors": ["B"]}},
            ],
        }

    monkeypatch.setattr(google_books, "_fetch_page", fake_fetch_page)

    response = client.get("/google/search?q=python&start_index=0&max_results=2")

    assert response.status_code == 200
    data = response.json()
    assert data["total_items"] == 2
    assert len(data["items"]) == 2
    assert data["items"][0]["id"] == "1"
