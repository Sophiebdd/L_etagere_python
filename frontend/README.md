📚 L’Étagère — Application de gestion de bibliothèque personnelle

L’Étagère est une application web moderne qui permet aux utilisateurs de :
- créer un compte et se connecter via un système d’authentification JWT sécurisée ;
- rechercher des ouvrages via l’API Google Books, puis les ajouter à leur bibliothèque ;
- consulter leur bibliothèque personnelle depuis un tableau de bord réactif ;
- préparer la phase suivante du projet : écriture et partage de manuscrits assistés par IA.

⚙️ Technologies utilisées
Côté	Outils
Backend	FastAPI, SQLAlchemy, Alembic, PyMySQL, Passlib (Argon2), JOSE (JWT), python-dotenv, Requests
Frontend	React (Vite), Tailwind CSS, React Router DOM
Base de données	MySQL
Déploiement futur	AWS (EC2 + RDS + S3)

🧩 Architecture du projet
L_etagere_python/
├── backend/             # API FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── book.py
│   │   │   └── user.py
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── book.py
│   │   │   └── google_books.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── book.py
│   │   │   └── user.py
│   │   ├── core/
│   │   │   └── security.py
│   │   ├── services/
│   │   │   └── google_books.py
│   ├── alembic/         # migrations automatiques
│   ├── .env
│   └── requirements.txt
│
└── frontend/            # Interface React
    ├── src/
    │   ├── App.jsx
    │   ├── index.css
    │   ├── components/
    │   │   ├── BookCard.jsx
    │   │   └── ProtectedRoute.jsx
    │   └── pages/
    │       ├── BookSearch.jsx
    │       ├── Dashboard.jsx
    │       ├── Login.jsx
    │       └── Signup.jsx
    ├── package.json
    ├── postcss.config.js
    └── tailwind.config.js

🚀 Installation & exécution du projet
🔹 1. Cloner le projet
git clone https://github.com/<ton-utilisateur>/L_etagere_python.git
cd L_etagere_python

🐍 BACKEND (FastAPI)
📦 2. Créer et activer l’environnement virtuel
cd backend
python3 -m venv .venv
source .venv/bin/activate

📦 3. Installer les dépendances
pip install -r requirements.txt


Exemple minimal du requirements.txt :

fastapi
uvicorn
sqlalchemy
pymysql
python-dotenv
passlib[bcrypt]
python-jose
alembic
email-validator
requests

⚙️ 4. Configurer les variables d’environnement

Crée un fichier .env dans backend/ :

DATABASE_URL=mysql+pymysql://root:password@localhost/l_etagere_python
SECRET_KEY=ma_super_clef_ultra_secrete
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
GOOGLE_API_KEY=ta_clef_api_google_books   # Optionnel, mais recommandé pour augmenter les quotas

🗄️ 5. Créer la base de données
mysql -u root -p
CREATE DATABASE l_etagere_python;

🔄 6. Générer et appliquer les migrations
alembic revision --autogenerate -m "create users table"
alembic revision --autogenerate -m "create books table"
alembic upgrade head

▶️ 7. Lancer le serveur API
uvicorn app.main:app --reload --port 8001


➡️ Accès à la documentation interactive :

http://127.0.0.1:8001/docs

⚛️ FRONTEND (React + Tailwind)
📦 1. Installation des dépendances
cd ../frontend
npm install

🎨 2. Installer Tailwind CSS

Déjà configuré, mais en cas de réinstallation :

npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

🧭 3. Lancer le serveur de développement
npm run dev


➡️ Le site est disponible sur :

http://localhost:5173/

🔐 Fonctionnalités principales
✅ Authentification
- Inscription (`/signup`), connexion (`/login`) et déconnexion depuis le dashboard.
- Protection des routes sensibles (`/dashboard`, `/search`) via `ProtectedRoute` et jetons JWT.

📚 Gestion de bibliothèque (nouveauté)
- Page `/search` protégée permettant de chercher des ouvrages via Google Books.
- Carte livre (`BookCard`) avec aperçu, description nettoyée et ajout en un clic.
- API FastAPI : `POST /books/` enregistre le livre pour l’utilisateur courant, `GET /books/mine` récupère la bibliothèque.
- Tableau de bord `/dashboard` affichant la bibliothèque de l’utilisateur connecté (couverture, titre, auteur, description).

🧱 Fonctionnalités à venir
- Catégorisation (à lire, en cours, lu) et édition de statut personnalisée.
- Suggestion de livres en fonction des livres lus.
- Notes privées et historiques de lecture.
- Éditeur de manuscrits avec assistance IA et partage sécurisé.

🔌 Endpoints principaux
- `POST /auth/signup` — inscription utilisateur.
- `POST /auth/login` — récupération du JWT.
- `GET /books/mine` — liste des livres de l’utilisateur connecté.
- `POST /books/` — ajout d’un livre issu d’une recherche ou manuel.
- `GET /google/search` — proxy vers l’API Google Books avec pagination (`start_index`, `max_results`).

🧭 Routage React
- `/` redirige vers `/login`.
- `/login` et `/signup` accessibles librement.
- `/dashboard` et `/search` nécessitent un JWT valide.

☁️ Déploiement (prévu)
Service	Usage
AWS EC2	hébergement du backend FastAPI
AWS RDS	base MySQL
AWS S3	stockage des fichiers et couvertures de livres
AWS Route53	gestion du nom de domaine

🧠 Commandes utiles de résumé
Backend
# Activer venv
source .venv/bin/activate

# Lancer API
uvicorn app.main:app --reload --port 8001

# Créer migration
alembic revision --autogenerate -m "message"

# Appliquer migration
alembic upgrade head

Frontend
# Démarrer le serveur
npm run dev

# Installer dépendances
npm install

✨ Auteur

Sophie Bodard — Projet personnel réalisé dans le cadre du titre professionnel CDA (Concepteur Développeur d’Applications, spécialisation IA).
