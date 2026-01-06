from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import user, auth, book, google_books, manuscript

app = FastAPI(title="L'Étagère API")

origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://letagere.local:5173",
    "http://letagere.local:5174",
    "https://letagere.app",
    "https://www.letagere.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routes
app.include_router(user.router)
app.include_router(auth.router)
app.include_router(book.router)
app.include_router(google_books.router)
app.include_router(manuscript.router)
