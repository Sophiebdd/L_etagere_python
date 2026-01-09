def test_create_user(client):
    response = client.post(
        "/users/",
        json={
            "username": "sophie",
            "email": "sophie@example.com",
            "password": "secret123",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "sophie"
    assert data["email"] == "sophie@example.com"
    assert "id" in data
