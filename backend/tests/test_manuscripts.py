from app.core.security import hash_password
from app.models.user import User


def _auth_headers_for_user(client, db_session, email="writer@example.com", username="writer"):
    user = User(
        username=username,
        email=email,
        hashed_password=hash_password("secret123"),
    )
    db_session.add(user)
    db_session.commit()
    login_response = client.post(
        "/auth/login",
        json={"email": email, "password": "secret123"},
    )
    return {"X-CSRF-Token": login_response.cookies["csrf_token"]}


def test_create_chapter_and_list_recent_chapters(client, db_session):
    headers = _auth_headers_for_user(client, db_session)

    manuscript_response = client.post(
        "/manuscripts/",
        headers=headers,
        json={"title": "Roman", "description": "Synopsis"},
    )
    assert manuscript_response.status_code == 201
    manuscript_id = manuscript_response.json()["id"]

    chapter_response = client.post(
        f"/manuscripts/{manuscript_id}/chapters",
        headers=headers,
        json={"title": "Chapitre 1", "content": "<p>Texte</p>"},
    )
    assert chapter_response.status_code == 201
    chapter_data = chapter_response.json()
    assert chapter_data["manuscript_id"] == manuscript_id
    assert "user_id" not in chapter_data

    recent_response = client.get("/manuscripts/chapters/recent", headers=headers)
    assert recent_response.status_code == 200
    recent_data = recent_response.json()
    assert len(recent_data) == 1
    assert recent_data[0]["id"] == chapter_data["id"]
    assert recent_data[0]["manuscript"]["id"] == manuscript_id


def test_user_cannot_access_another_users_chapter(client, db_session):
    owner_headers = _auth_headers_for_user(
        client,
        db_session,
        email="owner@example.com",
        username="owner",
    )

    manuscript_response = client.post(
        "/manuscripts/",
        headers=owner_headers,
        json={"title": "Projet secret", "description": ""},
    )
    manuscript_id = manuscript_response.json()["id"]

    chapter_response = client.post(
        f"/manuscripts/{manuscript_id}/chapters",
        headers=owner_headers,
        json={"title": "Chapitre secret", "content": "<p>Confidentiel</p>"},
    )
    chapter_id = chapter_response.json()["id"]

    intruder_headers = _auth_headers_for_user(
        client,
        db_session,
        email="intruder@example.com",
        username="intruder",
    )

    intruder_update = client.patch(
        f"/manuscripts/chapters/{chapter_id}",
        headers=intruder_headers,
        json={"title": "Intrusion"},
    )
    assert intruder_update.status_code == 404
