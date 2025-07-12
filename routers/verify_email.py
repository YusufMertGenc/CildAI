from fastapi import Request, Depends, APIRouter
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from utils import confirm_token
from models import User
from database import SessionLocal

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


templates = Jinja2Templates(directory="templates")


@router.get("/verify-email", response_class=HTMLResponse)
def verify_email(request: Request, token: str, db: Session = Depends(get_db)):
    email = confirm_token(token)
    if not email:
        return templates.TemplateResponse("verify_failed.html", {"request": request})

    user = db.query(User).filter(User.email == email).first()
    if not user:
        return templates.TemplateResponse("verify_failed.html", {"request": request})

    if user.is_verified:
        return templates.TemplateResponse("verify_success.html",
                                          {"request": request})

    user.is_verified = True
    db.commit()

    return templates.TemplateResponse("verify_success.html", {"request": request})
