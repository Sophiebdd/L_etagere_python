# CI/CD - L_etagere_python

Ce document récapitule tout ce qui a été mis en place pour les tests automatisés (CI) et le déploiement manuel (CD) via GitHub Actions, ainsi que les commandes et actions à effectuer.

## 1) Fichiers de configuration ajoutés

### CI
- `.github/workflows/ci.yml`
  - Lance les tests backend (pytest) si un dossier de tests existe.
  - Lance `npm run lint` et `npm run build` côté frontend.
  - Installe `httpx` pour TestClient.

### CD (manuel)
- `.github/workflows/deploy.yml`
  - Déploiement manuel via SSH sur le VPS.
  - `git pull` + `docker compose up -d --build`.
  - Backup MySQL **avant** migration (si migrations en attente).
  - Migrations Alembic si besoin.
  - Garde les 2 derniers backups.

## 2) Tests ajoutés (backend)

Dossier: `backend/tests/`
- `conftest.py` : setup DB SQLite en mémoire + TestClient
- `test_auth.py` : login
- `test_auth_password_reset.py` : forgot/reset password
- `test_books.py` : create/list
- `test_google_books.py` : mock Google Books
- `test_users.py` : création user

Commandes locales pour lancer les tests:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt pytest httpx
python -m pytest -vv
```

## 3) Ajustements backend (Pydantic + datetime)

- Pydantic v2: `.dict()` -> `.model_dump()`
- Schémas: `Config` -> `model_config = ConfigDict(from_attributes=True)`
- Datetime: abandon de `utcnow()` et comparaison naive/aware corrigée

## 4) Ajustements frontend (lint)

- `frontend/src/pages/Signup.jsx` : log erreur pour éviter variable inutilisée
- `frontend/src/components/Header.jsx` : suppression import inutilisé
- `frontend/src/components/RichTextEditor.jsx` : useCallback pour useEffect deps

## 5) Secrets GitHub (obligatoires)

À créer dans: **Settings -> Secrets and variables -> Actions -> New repository secret**

- `VPS_HOST` = IP du VPS (ex: `54.37.159.136`)
- `VPS_USER` = utilisateur SSH (ex: `ubuntu`)
- `VPS_SSH_KEY` = **clé privée** (voir section suivante)
- `DEPLOY_PATH` = chemin du repo sur le VPS (ex: `/home/ubuntu/L_etagere_python`)

Note: GitHub n'affiche jamais les valeurs. Il faut recoller la clé complète si on veut la mettre à jour.

## 6) Clé SSH pour GitHub Actions (connexion VPS)

Créer une clé dédiée:
```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
```

Ajouter la clé publique sur le VPS:
```bash
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub ubuntu@54.37.159.136
```

Ajouter la clé privée dans GitHub:
```bash
cat ~/.ssh/github_actions_deploy
```
Copier **tout** le contenu (avec BEGIN/END) dans `VPS_SSH_KEY`.

## 7) Deploiement manuel (CD)

1) Pousser le code sur `main`.
2) Aller sur GitHub -> Actions -> **Deploy (Manual)**.
3) Cliquer sur **Run workflow**.

Le workflow:
- `git pull`
- `docker compose -f docker-compose.prod.yml up -d --build`
- Vérifie si migrations Alembic en attente
- Si oui:
  - Backup MySQL gzip dans `/home/ubuntu/backups`
  - Garde seulement les 2 derniers backups
  - `alembic upgrade head`

## 8) Backup MySQL (details)

- Fichier: `/home/ubuntu/backups/letagere_YYYYmmdd_HHMMSS.sql.gz`
- Garde 2 derniers:
  - `ls -1t /home/ubuntu/backups/letagere_*.sql.gz | tail -n +3 | xargs -r rm -f`

## 9) Verification deployment

Sur GitHub Actions, le job doit finir par:
- containers recreated
- DB healthy
- backend/frontend started
- Alembic OK (ou "No pending migrations")
- "Successfully executed commands"

## 10) Fichier .env

- `backend/.env` doit être **exclu** du git (`.gitignore`).
- Versionner un `backend/.env.example` si besoin.
- Sur le VPS, le vrai `.env` reste local.

Voir le .env prod:
```bash
ssh ubuntu@54.37.159.136
cd /home/ubuntu/L_etagere_python
cat backend/.env
```

## 11) Rappel: build + dependencies

Le build Docker installe les deps:
- `backend/Dockerfile` fait `pip install -r requirements.txt`.
- `frontend/Dockerfile` fait `npm ci` + `npm run build`.
- Le cache Docker evite de tout reinstaller si `requirements.txt` ne change pas.

