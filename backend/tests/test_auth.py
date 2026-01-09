from app.core.security import hash_password
from app.models.user import User


def test_login_returns_token(client, db_session):
    user = User(
        username="sophie",
        email="sophie@example.com",
        hashed_password=hash_password("secret123"),
    )
    db_session.add(user)
    db_session.commit()

    response = client.post(
        "/auth/login",
        json={"email": "sophie@example.com", "password": "secret123"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
