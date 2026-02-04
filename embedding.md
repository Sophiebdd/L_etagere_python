# Documentation des suggestions (embeddings)

Ce document décrit ce qui a été mis en place pour générer des suggestions de lecture, les fichiers impactés, et les dépendances ajoutées.

## Objectif
Proposer des suggestions personnalisées à partir des livres **lus** et/ou **aimés** de l'utilisateur, en comparant le contenu sémantique de ces livres avec des résultats Google Books.

## Qu'est-ce qu'un embedding ?
Un **embedding** est une représentation vectorielle (liste de nombres) d'un texte.  
L'idée : des textes proches en sens ont des vecteurs proches (mesurable via une similarité).

Exemple d'usage ici :
- On transforme le texte d’un livre (titre + auteur + genre + description) en vecteur.
- On calcule un vecteur “profil utilisateur” en moyennant les livres lus/aimés.
- On compare ce profil aux livres candidats (Google Books) pour classer les suggestions.

## Lien avec l’IA
Oui, c’est de l’IA : on utilise un **modèle de langage pré‑entraîné** (SentenceTransformers)
pour convertir du texte en vecteur sémantique.  
Ce n’est **pas** de la génération, juste de la **représentation sémantique**.
On n’utilise **pas** OpenAI.  
OpenAPI ici signifie uniquement la **documentation automatique** de l’API via FastAPI (Swagger).

### OpenAPI et la doc (clarification)
- **OpenAPI** = la spécification (format JSON) qui décrit toutes les routes.
- **FastAPI** génère ce fichier automatiquement à partir du code.
- **Swagger UI** affiche ce fichier dans `/docs`.
Donc la “doc” visible est juste une interface qui **lit** le document OpenAPI.

## Pourquoi c’est utile
- Comprendre des phrases “avec les mots” plutôt qu’un simple mot‑clé.
- Éviter que “roman fantastique” et “fantasy” soient considérés comme différents.
- Recommander par **proximité de sens**, pas seulement par auteur exact.

## Comment on calcule un embedding
1. Construire un texte “profil livre” :
   - `"Titre. Auteur: ... Genre: ... Description ..."`
2. Passer ce texte dans un modèle d’embedding (`SentenceTransformer`).
3. Obtenir un vecteur (liste de floats).
4. Stocker ce vecteur en base (JSON).

## Pipeline de suggestion (résumé)
1. Charger les livres favoris (sinon les livres lus).
2. Générer ou récupérer leurs embeddings.
3. Calculer un vecteur **profil utilisateur** (moyenne pondérée).
4. Interroger Google Books (requêtes auteur/genre/titre, ordre pertinence).
5. Filtrer des résultats peu pertinents.
6. Re‑classer par similarité sémantique.
7. Ajouter de la diversité (1 livre par auteur + part d’exploration).

## Détails des étapes (pédagogique)
### 1) Profil utilisateur
- Pour chaque livre “source”, on obtient son embedding.
- On fait une **moyenne pondérée** : les favoris comptent plus.

### 2) Recherche de candidats
- On interroge Google Books par **auteur / genre / titre**.
- On ajoute une requête “mots‑clés” (issus des descriptions) pour varier les thèmes.
- On récupère des candidats (ex: 20–30).

### 3) Re‑ranking
- On calcule l’embedding de chaque candidat.
- On mesure la similarité cosinus avec le profil utilisateur.
- On garde les meilleurs scores.

### 4) Diversité
- On limite à **1 livre par auteur**.
- On mélange **70% pertinents / 30% exploration** pour éviter les répétitions.

## Similarité cosinus (intuitif)
Le cosinus compare “l’angle” entre deux vecteurs :
- 1.0 = très proche
- 0.0 = sans relation
- -1.0 = opposé

Dans notre cas, on vise des valeurs proches de 1.

## Dépendances ajoutées (backend/requirements.txt)
- `sentence-transformers` : modèle d’embedding (local, gratuit).
- `numpy` : calculs numériques (moyennes, cosinus, normes).

Pourquoi :
- `sentence-transformers` fournit les embeddings.
- `numpy` sert à la similarité cosinus et la moyenne de vecteurs.

## Fichiers créés
- `backend/app/services/embeddings.py`
  - Chargement du modèle, création de texte, embedding, similarité cosinus.
- `backend/app/services/recommendations.py`
  - Logique principale des recommandations.
- `backend/alembic/versions/b2f4a1c9d7e8_add_book_embeddings.py`
  - Ajout de la colonne `embedding` en base.

## Fichiers modifiés
- `backend/app/models/book.py`
  - Ajout colonne `embedding` (JSON).
- `backend/app/routes/book.py`
  - Calcul embeddings à la création / mise à jour.
  - Endpoint `GET /books/recommendations`.
- `backend/app/schemas/book.py`
  - Nouveau schéma `BookRecommendation` + champ `language`.
- `backend/app/schemas/__init__.py`
  - Export du schéma `BookRecommendation`.
- `backend/app/services/google_books.py`
  - Ajout de paramètres optionnels (langue, type, tri).
- `backend/requirements.txt`
  - Ajout `sentence-transformers`, `numpy`.
- `frontend/src/pages/Dashboard.jsx`
  - Nouveau carousel “Suggestions” + bouton “Ajouter”.
  - Carte de suggestion (visuel, taille fixe).

## Stockage des embeddings
Colonne `embedding` dans la table `books` (JSON).  
Chaque livre possède son vecteur pour éviter de recalculer à chaque requête.

## Endpoint utilisé
`GET /books/recommendations?limit=12`
- Renvoie une liste de livres (format simplifié) + score.

## Exemple de réponse (simplifiée)
```json
[
  {
    "external_id": "XKhMEAAAQBAJ",
    "title": "1Q84 - Livre 3",
    "author": "Haruki Murakami",
    "description": "...",
    "cover_image": "...",
    "genre": "Fiction",
    "language": "fr",
    "score": 0.72
  }
]
```

## Où se passe quoi (mapping rapide)
- **Embedding d’un livre** : `backend/app/services/embeddings.py`
- **Logique reco** : `backend/app/services/recommendations.py`
- **API** : `backend/app/routes/book.py` (`/books/recommendations`)
- **Affichage UI** : `frontend/src/pages/Dashboard.jsx`

## Ce qui influence la pertinence
- Qualité des descriptions (plus il y a de texte, mieux c’est).
- Le nombre de livres aimés/lus (plus il y en a, meilleur est le profil).
- Google Books peut renvoyer des résultats incomplets (ex: pas d’image).

## Améliorations possibles (si besoin)
- Forcer langue FR uniquement.
- Mettre un poids supérieur aux livres “favoris”.
- Écarter certains types de livres (ex: essais techniques).
- Ajouter une explication “Pourquoi ce livre ?” (même auteur/genre).

## Remarques
- La pertinence dépend fortement des résultats Google Books et de la qualité des descriptions.
- Une base interne plus riche ou un index vectoriel donneraient de meilleurs résultats,
  mais ce système reste simple et gratuit pour un petit volume de livres.

## Ajouter un index vectoriel (si tu veux scaler)
Quand le nombre de livres devient important (ex: > 50k), comparer tous les vecteurs en Python devient lent.
Dans ce cas, on utilise un **index vectoriel** pour retrouver rapidement les voisins les plus proches.

### Option 1: pgvector (PostgreSQL)
1. Migrer MySQL → PostgreSQL.
2. Installer l’extension `pgvector`.
3. Changer la colonne `embedding` en type `vector` (au lieu de JSON).
4. Ajouter un index :
   - `CREATE INDEX ... USING ivfflat` (ou `hnsw`) sur `embedding`.
5. Faire la requête de similarité directement en SQL.
Note: `pgvector` est **gratuit et open‑source**, mais il nécessite d’héberger PostgreSQL
(localement ou chez un fournisseur).

### Option 2: FAISS (local)
1. Installer FAISS (local).
2. Construire un index à partir des embeddings en base.
3. Sauvegarder et recharger l’index au démarrage.
4. Mettre à jour l’index à chaque nouveau livre.

### Option 3: Service externe
1. Utiliser un service géré (Pinecone, Weaviate, Qdrant Cloud).
2. Pousser les embeddings dans le service.
3. Interroger par similarité via API.

### Résumé
- **pgvector** : simple si tu passes à PostgreSQL.
- **FAISS** : gratuit/local mais demande un peu de maintenance.
- **Service externe** : plus simple à opérer, mais souvent payant.
