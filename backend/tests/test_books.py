from app.core.security import create_access_token, hash_password
from app.models.user import User


def _auth_headers_for_user(db_session):
    user = User(
        username="sophie",
        email="sophie@example.com",
        hashed_password=hash_password("secret123"),
    )
    db_session.add(user)
    db_session.commit()
    token = create_access_token({"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


def test_create_and_list_books(client, db_session):
    headers = _auth_headers_for_user(db_session)

    create_response = client.post(
        "/books/",
        headers=headers,
        json={
            "title": "Le Petit Prince",
            "author": "Antoine de Saint-Exupery",
            "description": "Un classique.",
            "status": "to_read",
            "is_favorite": False,
        },
    )

    assert create_response.status_code == 200

    list_response = client.get("/books/mine", headers=headers)
    assert list_response.status_code == 200
    data = list_response.json()
    assert data["total_items"] == 1
    assert len(data["items"]) == 1


def test_create_book_accepts_year_only_publication_date(client, db_session):
    headers = _auth_headers_for_user(db_session)

    response = client.post(
        "/books/",
        headers=headers,
        json={
            "title": "Dune",
            "author": "Frank Herbert",
            "description": "SF.",
            "status": "to_read",
            "publication_date": "1965",
        },
    )

    assert response.status_code == 200
    assert response.json()["publication_date"] == "1965-01-01"


def test_create_book_accepts_year_month_only_publication_date(client, db_session):
    headers = _auth_headers_for_user(db_session)

    response = client.post(
        "/books/",
        headers=headers,
        json={
            "title": "Foundation",
            "author": "Isaac Asimov",
            "description": "SF.",
            "status": "to_read",
            "publication_date": "1951-06",
        },
    )

    assert response.status_code == 200
    assert response.json()["publication_date"] == "1951-06-01"


def test_create_book_accepts_datetime_publication_date(client, db_session):
    headers = _auth_headers_for_user(db_session)

    response = client.post(
        "/books/",
        headers=headers,
        json={
            "title": "Neuromancer",
            "author": "William Gibson",
            "description": "Cyberpunk.",
            "status": "to_read",
            "publication_date": "1984-07-01T13:45:00Z",
        },
    )

    assert response.status_code == 200
    assert response.json()["publication_date"] == "1984-07-01"
