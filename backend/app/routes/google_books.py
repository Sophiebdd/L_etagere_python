from fastapi import APIRouter, Query, Request, HTTPException, Depends
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.security import ALGORITHM, SECRET_KEY
from app.database import get_db
from app.models.api_log import ApiLog
from app.services.google_books import search_books

router = APIRouter(prefix="/google", tags=["google-books"])

def _extract_user_id(request: Request) -> int | None:
    if not SECRET_KEY:
        return None
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return None
    token = auth.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
    user_id = payload.get("sub")
    try:
        return int(user_id)
    except (TypeError, ValueError):
        return None


@router.get("/search")
def google_search(
    request: Request,
    q: str = Query(...),
    start_index: int = 0,
    max_results: int = 10,
    db: Session = Depends(get_db),
):
    status_code = 200
    error_message = None
    try:
        return search_books(q, start_index, max_results)
    except HTTPException as exc:
        status_code = exc.status_code
        error_message = str(exc.detail)
        raise
    except Exception as exc:
        status_code = 500
        error_message = str(exc)
        raise
    finally:
        try:
            log_entry = ApiLog(
                user_id=_extract_user_id(request),
                endpoint=request.url.path,
                query=q,
                status_code=status_code,
                error_message=error_message,
            )
            db.add(log_entry)
            db.commit()
        except Exception:
            db.rollback()
