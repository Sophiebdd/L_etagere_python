from datetime import datetime, timedelta, timezone

from app.routes import auth as auth_routes
from app.models.user import User
from app.core.security import hash_password


def test_forgot_password_sets_reset_token(client, db_session, monkeypatch):
    user = User(
        username="sophie",
        email="sophie@example.com",
        hashed_password=hash_password("secret123"),
    )
    db_session.add(user)
    db_session.commit()

    def fake_send_email(**_kwargs):
        return None

    monkeypatch.setattr(auth_routes, "send_email", fake_send_email)

    response = client.post("/auth/forgot-password", json={"email": "sophie@example.com"})

    assert response.status_code == 202
    db_session.refresh(user)
    assert user.reset_token_hash is not None
    assert user.reset_token_expires_at is not None


def test_reset_password_clears_token_and_allows_login(client, db_session):
    raw_token = "test-token"
    user = User(
        username="sophie",
        email="sophie@example.com",
        hashed_password=hash_password("oldpassword123"),
        reset_token_hash=auth_routes._hash_reset_token(raw_token),
        reset_token_expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=10),
    )
    db_session.add(user)
    db_session.commit()

    response = client.post(
        "/auth/reset-password",
        json={"token": raw_token, "new_password": "newpassword123"},
    )

    assert response.status_code == 200
    db_session.refresh(user)
    assert user.reset_token_hash is None
    assert user.reset_token_expires_at is None

    login = client.post(
        "/auth/login",
        json={"email": "sophie@example.com", "password": "newpassword123"},
    )
    assert login.status_code == 200
