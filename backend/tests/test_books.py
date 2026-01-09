from app.core.security import create_access_token, hash_password
from app.models.user import User


def test_create_and_list_books(client, db_session):
    user = User(
        username="sophie",
        email="sophie@example.com",
        hashed_password=hash_password("secret123"),
    )
    db_session.add(user)
    db_session.commit()

    token = create_access_token({"sub": str(user.id)})
    headers = {"Authorization": f"Bearer {token}"}

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
