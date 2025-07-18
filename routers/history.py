from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models import Chat
from routers.auth import get_current_user
from database import SessionLocal
from typing import Annotated


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


router = APIRouter()


@router.get("/chat/history")
def get_chat_history(
        db: Annotated[Session, Depends(get_db)],
        current_user: Annotated[dict, Depends(get_current_user)]
):
    chat_records = (
        db.query(Chat)
        .filter(Chat.owner_id == current_user["id"])
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
