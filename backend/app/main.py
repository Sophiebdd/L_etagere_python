from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.security import CSRF_HEADER_NAME, has_valid_csrf
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


def _is_csrf_exempt(method: str, path: str) -> bool:
    normalized_path = path.rstrip("/") or "/"
    return (method, normalized_path) in {
        ("POST", "/auth/login"),
        ("POST", "/auth/forgot-password"),
        ("POST", "/auth/reset-password"),
        ("POST", "/users"),
    }


@app.middleware("http")
async def csrf_protection(request, call_next):
    if request.method in {"GET", "HEAD", "OPTIONS"} or _is_csrf_exempt(request.method, request.url.path):
        return await call_next(request)

    origin = request.headers.get("origin")
    if origin and origin not in origins:
        return JSONResponse(status_code=403, content={"detail": "Origine non autorisée"})

    if not has_valid_csrf(request):
        return JSONResponse(
            status_code=403,
            content={"detail": f"Jeton CSRF invalide ou manquant ({CSRF_HEADER_NAME})"},
        )

    return await call_next(request)

# Inclusion des routes
app.include_router(user.router)
app.include_router(auth.router)
app.include_router(book.router)
app.include_router(google_books.router)
app.include_router(manuscript.router)
