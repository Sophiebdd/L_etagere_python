def test_create_user(client):
    response = client.post(
        "/users/",
        json={
            "username": "sophie",
            "email": "sophie@example.com",
            "password": "Secret123",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "sophie"
    assert data["email"] == "sophie@example.com"
    assert "id" in data


def test_create_user_rejects_weak_password(client):
    response = client.post(
        "/users/",
        json={
            "username": "sophie",
            "email": "sophie@example.com",
            "password": "123",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "Le mot de passe doit contenir au moins 8 caracteres, une minuscule, une majuscule et un chiffre"
    )
