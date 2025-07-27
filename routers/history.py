from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models import Chat
from routers.auth import get_current_user
from database import SessionLocal
from typing import Annotated
from datetime import datetime, timedelta


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


router = APIRouter()

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]


@router.get("/chat/history")
def get_chat_history(
        db: db_dependency,
        current_user: user_dependency):
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


@router.get("/chat/history/last_seven_day")
def get_last_seven_days_chat_history(
        db: db_dependency,
        current_user: user_dependency):
    seven_days_ago = datetime.now() - timedelta(days=7)
    chat_records = (
        db.query(Chat)
        .filter(Chat.owner_id == current_user["id"], Chat.created_at >= seven_days_ago)
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

@router.get("/chat/history/last_month")
def get_last_month_chat_history(
        db: db_dependency,
        current_user: user_dependency):
    thirty_days_ago = datetime.now() - timedelta(days=30)
    chat_records = (
        db.query(Chat)
        .filter(Chat.owner_id == current_user["id"], Chat.created_at >= thirty_days_ago)
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

@router.get("/chat/history/last_tree_month")
def get_last_three_months_chat_history(
        db: db_dependency,
        current_user: user_dependency):
    ninety_days_ago = datetime.now() - timedelta(days=90)
    chat_records = (
        db.query(Chat)
        .filter(Chat.owner_id == current_user["id"], Chat.created_at >= ninety_days_ago)
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