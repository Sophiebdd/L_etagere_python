# L'Étagère — Guide Docker + VPS (OVH)

Ce guide explique la dockerisation du projet, le déploiement en production sur un VPS OVH, et l'utilisation en local.

## Structure du projet

- `backend/` API FastAPI
- `frontend/` App Vite servie par Nginx
- `docker-compose.yml` environnement local (frontend + backend + MySQL)
- `docker-compose.prod.yml` production (frontend + backend + MySQL + Caddy)
- `backend/Dockerfile` image API
- `frontend/Dockerfile` build du frontend + Nginx
- `frontend/nginx.conf` sert le build et gère le routing SPA
- `Caddyfile` reverse proxy + HTTPS automatique (Let's Encrypt)

## Rôle des conteneurs

- **db** : MySQL, données persistées dans le volume Docker `db_data`.
- **backend** : API FastAPI, se connecte à MySQL via `DATABASE_URL`.
- **frontend** : build Vite servi par Nginx.
- **caddy** (prod seulement) : reverse proxy, gère HTTPS et route :
  - `/api/*` -> backend
  - `/` -> frontend

---

# Développement local

Le projet **n'est pas containerisé par défaut en dev**. Utilise :

## Backend (venv)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Frontend (Vite)

```bash
cd frontend
npm install
npm run dev
```

Le frontend lit `VITE_API_BASE_URL` au build ou au runtime. En dev :

```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

# Conteneurs en local (optionnel)

```bash
docker compose up --build
```

- Frontend : http://localhost:5173
- API : http://localhost:8000

---

# Production (VPS OVH)

## 1) Accès VPS (SSH)

```bash
ssh ubuntu@IP_DU_VPS
sudo -i
```

## 2) Installer Docker + Compose

```bash
apt update
apt install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

## 3) Cloner le repo

```bash
apt install -y git
git clone https://github.com/Sophiebdd/L_etagere_python.git
cd L_etagere_python
```

## 4) Créer `backend/.env` sur le VPS

Exemple :
```
DATABASE_URL=mysql+pymysql://root:password@db:3306/l_etagere_python
SECRET_KEY=change-moi
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=120
MAILJET_API_KEY=...
MAILJET_SECRET_KEY=...
MAILJET_SENDER_EMAIL=...
MAILJET_SENDER_NAME=...
RESET_TOKEN_EXPIRE_MINUTES=60
FRONTEND_BASE_URL=https://letagere.app
API_BASE_URL=https://letagere.app/api
GOOGLE_BOOKS_API_KEY=...
```

## 5) Lancer les conteneurs (prod)

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## 6) Lancer les migrations (une seule fois)

```bash
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

---

# DNS (OVH)

Dans l'espace client OVH :

1. Domaine -> **Zone DNS**
2. Enregistrements A vers l'IP du VPS :
   - `letagere.app` -> IP_DU_VPS
   - `www.letagere.app` -> IP_DU_VPS (ou CNAME vers `letagere.app`)

Caddy génère ensuite automatiquement les certificats HTTPS.

---

# Déploiement (après modifications)

Sur le VPS :

```bash
cd L_etagere_python
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Si migrations ajoutées :

```bash
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

---

# Accès base de données

## Dans le VPS

```bash
docker compose -f docker-compose.prod.yml exec db mysql -u root -p
```

## HeidiSQL (tunnel SSH recommandé)

1. Créer un tunnel depuis ton PC :

```bash
ssh -L 3307:127.0.0.1:3306 ubuntu@IP_DU_VPS
```

2. Dans HeidiSQL :
- Host : `127.0.0.1`
- Port : `3307`
- User : `root`
- Password : `password`
- Database : `l_etagere_python`

---

# Git sans token (SSH)

Pour éviter de retaper un token à chaque `git pull` :

1. Sur le VPS :

```bash
ssh-keygen -t ed25519 -C "vps"
cat ~/.ssh/id_ed25519.pub
```

2. Ajouter la clé publique dans GitHub :
- GitHub -> Settings -> SSH keys -> New key

3. Passer le remote en SSH :

```bash
git remote set-url origin git@github.com:Sophiebdd/L_etagere_python.git
```

---

# Pourquoi HTTPS

- Protège les identifiants et cookies
- Évite les blocages "Mixed Content"
- Indispensable en production

Caddy gère HTTPS automatiquement via Let's Encrypt.

---

# Dépannage rapide

## Erreur Mixed Content
- Vérifier que le frontend pointe vers `/api` ou `https://letagere.app/api`
- Rebuild du frontend si besoin :

```bash
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d --force-recreate frontend
```

## Statut des conteneurs

```bash
docker compose -f docker-compose.prod.yml ps
```

## Logs backend

```bash
docker compose -f docker-compose.prod.yml logs -f backend
```

---

# Notes importantes

- Ne jamais commit les secrets.
- Si un token GitHub est partagé, le révoquer immédiatement.
- Les données MySQL sont stockées dans le volume Docker `db_data`.

