from typing import Annotated

from fastapi import Request, Depends, APIRouter
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from mail_utils import send_history_email
from routers.auth import get_current_user
from utils import confirm_token
from models import User, Chat
from database import SessionLocal

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]


templates = Jinja2Templates(directory="templates")

def fetch_user_chat_history(db: Session, user_id: int):
    chat_records = (
        db.query(Chat)
        .filter(Chat.owner_id == user_id)
        .order_by(Chat.created_at.desc())
        .all()
    )

    return [
        {
            "prompt": chat.input_text,
            "response": chat.output_text,
            "timestamp": chat.created_at.strftime("%Y-%m-%d %H:%M")
        }
        for chat in chat_records
    ]



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

@router.post("/chat/send_history_mail")
async def send_history_mail(db: db_dependency , current_user=Depends(get_current_user)):
    user_email = current_user.get("email")
    user_id = current_user.get("id")

    history_data = fetch_user_chat_history(db, user_id)

    await send_history_email(user_email, history_data)

    return {"message": "Geçmiş başarıyla e-posta ile gönderildi."}