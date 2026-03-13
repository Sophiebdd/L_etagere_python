from app.core.security import hash_password, hash_token
from app.models.user import User


def test_login_sets_auth_cookies(client, db_session):
    user = User(
        username="sophie",
        email="sophie@example.com",
        hashed_password=hash_password("Secret123"),
    )
    db_session.add(user)
    db_session.commit()

    response = client.post(
        "/auth/login",
        json={"email": "sophie@example.com", "password": "Secret123"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Connexion réussie"
    assert response.cookies.get("access_token")
    assert response.cookies.get("refresh_token")
    assert response.cookies.get("csrf_token")

    db_session.refresh(user)
    assert user.refresh_token_hash == hash_token(response.cookies["refresh_token"])
    assert user.refresh_token_expires_at is not None


def test_refresh_rotates_refresh_token(client, db_session):
    user = User(
        username="sophie",
        email="sophie@example.com",
        hashed_password=hash_password("Secret123"),
    )
    db_session.add(user)
    db_session.commit()

    login_response = client.post(
        "/auth/login",
        json={"email": "sophie@example.com", "password": "Secret123"},
    )
    first_refresh_token = login_response.cookies.get("refresh_token")
    csrf_token = login_response.cookies.get("csrf_token")

    refresh_response = client.post(
        "/auth/refresh",
        headers={"X-CSRF-Token": csrf_token},
    )

    assert refresh_response.status_code == 200
    assert refresh_response.json()["message"] == "Session rafraîchie"
    assert refresh_response.cookies.get("access_token")
    assert refresh_response.cookies.get("refresh_token")
    assert refresh_response.cookies["refresh_token"] != first_refresh_token

    db_session.refresh(user)
    assert user.refresh_token_hash == hash_token(refresh_response.cookies["refresh_token"])


def test_logout_clears_refresh_token(client, db_session):
    user = User(
        username="sophie",
        email="sophie@example.com",
        hashed_password=hash_password("Secret123"),
    )
    db_session.add(user)
    db_session.commit()

    client.post(
        "/auth/login",
        json={"email": "sophie@example.com", "password": "Secret123"},
    )
    csrf_token = client.cookies.get("csrf_token")

    response = client.post(
        "/auth/logout",
        headers={"X-CSRF-Token": csrf_token},
    )

    assert response.status_code == 204
    db_session.refresh(user)
    assert user.refresh_token_hash is None
    assert user.refresh_token_expires_at is None
