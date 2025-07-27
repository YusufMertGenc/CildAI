from typing import Annotated, List

from fastapi import Request, Depends, APIRouter, Body, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
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
user_dependency = Annotated[dict, Depends(get_current_user)]

templates = Jinja2Templates(directory="templates")


class HistoryItem(BaseModel):
    prompt: str
    response: str
    timestamp: str


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
async def send_history_mail(
        db: db_dependency,
        current_user: user_dependency,
        request: Request,
        history_data: List[HistoryItem] = Body(...)
):
    if not history_data:
        raise HTTPException(status_code=400, detail="Hiçbir geçmiş seçilmedi.")

    try:
        await send_history_email(
            to_email=current_user["email"],
            history_data=[item.dict() for item in history_data]
        )
        return {"message": "Seçilen geçmiş başarıyla e-posta ile gönderildi."}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Mail gönderilemedi.")


@router.post("/chat/send_all_history_mail")
async def send_all_history_mail(
        db: db_dependency,
        current_user: user_dependency,
):
    all_history = db.query(Chat).filter(Chat.owner_id == current_user["id"]).all()

    if not all_history:
        raise HTTPException(status_code=404, detail="Geçmiş bulunamadı.")

    history_list = [
        {
            "prompt": h.input_text,
            "response": h.output_text,
            "timestamp": h.created_at.isoformat() if hasattr(h.created_at, "isoformat") else str(h.created_at)
        }
        for h in all_history
    ]

    try:
        await send_history_email(
            to_email=current_user["email"],
            history_data=history_list
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mail gönderilemedi: {str(e)}")

    return {"message": "Tüm geçmiş başarıyla e-posta ile gönderildi."}
