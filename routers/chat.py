from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from typing import Annotated, List, Optional
from pydantic import BaseModel
from datetime import datetime
from routers.auth import get_current_user  # Auth'dan import
from starlette import status
import json
import uuid

router = APIRouter(
    prefix="/chat",
    tags=["Chat History"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]


# Pydantic Models
class MessageModel(BaseModel):
    role: str  # "user" veya "assistant"
    content: str
    timestamp: datetime


class ChatModel(BaseModel):
    id: str
    title: str
    created_at: datetime
    category: Optional[str] = "analysis"
    status: Optional[str] = "completed"
    messages: List[MessageModel]


class ChatListResponse(BaseModel):
    chats: List[ChatModel]
    total: int


class CreateChatRequest(BaseModel):
    title: str
    category: Optional[str] = "analysis"
    messages: List[dict]


# Chat geçmişi endpoint'i
@router.get("/history", response_model=ChatListResponse)
async def get_chat_history(
        db: db_dependency,
        current_user: user_dependency,
        limit: int = 50,
        offset: int = 0,
        category: Optional[str] = None,
        search: Optional[str] = None
):
    """
    Kullanıcının chat geçmişini getir
    """
    try:
        # Chat tablosundan veri çek
        from models import Chat  # Chat modelini import et

        query = db.query(Chat).filter(Chat.user_email == current_user["email"])

        # Filtreleme
        if category and category != "all":
            query = query.filter(Chat.category == category)

        if search:
            query = query.filter(Chat.title.ilike(f"%{search}%"))

        # Toplam sayı
        total = query.count()

        # Sıralama ve pagination
        chats_data = query.order_by(Chat.created_at.desc()).offset(offset).limit(limit).all()

        # Sonuçları formatla
        chats = []
        for chat_row in chats_data:
            # Messages JSON'dan parse et
            messages = chat_row.messages if isinstance(chat_row.messages, list) else []

            chat = ChatModel(
                id=chat_row.id,
                title=chat_row.title,
                created_at=chat_row.created_at,
                category=chat_row.category or "analysis",
                status=chat_row.status or "completed",
                messages=[
                    MessageModel(
                        role=msg["role"],
                        content=msg["content"],
                        timestamp=datetime.fromisoformat(msg["timestamp"].replace("Z", "+00:00")) if isinstance(
                            msg["timestamp"], str) else msg["timestamp"]
                    ) for msg in messages
                ]
            )
            chats.append(chat)

        return ChatListResponse(chats=chats, total=total)

    except Exception as e:
        print(f"Chat geçmişi yüklenirken hata: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Chat geçmişi yüklenirken bir hata oluştu"
        )


# Tek chat getirme
@router.get("/{chat_id}", response_model=ChatModel)
async def get_chat_by_id(
        chat_id: str,
        db: db_dependency,
        current_user: user_dependency
):
    """
    Belirli bir chat'i getir
    """
    try:
        from models import Chat

        chat_row = db.query(Chat).filter(
            Chat.id == chat_id,
            Chat.user_email == current_user["email"]
        ).first()

        if not chat_row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat bulunamadı"
            )

        # Messages'ı parse et
        messages = chat_row.messages if isinstance(chat_row.messages, list) else []

        return ChatModel(
            id=chat_row.id,
            title=chat_row.title,
            created_at=chat_row.created_at,
            category=chat_row.category or "analysis",
            status=chat_row.status or "completed",
            messages=[
                MessageModel(
                    role=msg["role"],
                    content=msg["content"],
                    timestamp=datetime.fromisoformat(msg["timestamp"].replace("Z", "+00:00")) if isinstance(
                        msg["timestamp"], str) else msg["timestamp"]
                ) for msg in messages
            ]
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Chat getirme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Chat getirilemedi"
        )


# Chat oluşturma (cilt analizi sonrası)
@router.post("/create", response_model=ChatModel)
async def create_chat(
        chat_request: CreateChatRequest,
        db: db_dependency,
        current_user: user_dependency
):
    """
    Yeni chat oluştur
    """
    try:
        from models import Chat

        chat_id = str(uuid.uuid4())

        new_chat = Chat(
            id=chat_id,
            user_email=current_user["email"],
            title=chat_request.title,
            category=chat_request.category,
            status="active",
            messages=chat_request.messages,
            created_at=datetime.utcnow()
        )

        db.add(new_chat)
        db.commit()
        db.refresh(new_chat)

        return ChatModel(
            id=new_chat.id,
            title=new_chat.title,
            created_at=new_chat.created_at,
            category=new_chat.category,
            status=new_chat.status,
            messages=[
                MessageModel(
                    role=msg["role"],
                    content=msg["content"],
                    timestamp=datetime.fromisoformat(msg["timestamp"].replace("Z", "+00:00")) if isinstance(
                        msg["timestamp"], str) else msg["timestamp"]
                ) for msg in new_chat.messages
            ]
        )

    except Exception as e:
        db.rollback()
        print(f"Chat oluşturma hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Chat oluşturulamadı"
        )


# Chat silme
@router.delete("/{chat_id}")
async def delete_chat(
        chat_id: str,
        db: db_dependency,
        current_user: user_dependency
):
    """
    Chat'i sil
    """
    try:
        from models import Chat

        # Chat'i bul
        chat_row = db.query(Chat).filter(
            Chat.id == chat_id,
            Chat.user_email == current_user["email"]
        ).first()

        if not chat_row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat bulunamadı"
            )

        # Chat'i sil
        db.delete(chat_row)
        db.commit()

        return {"message": "Chat başarıyla silindi"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Chat silme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Chat silinemedi"
        )


# Chat güncelleme (mesaj ekleme)
@router.put("/{chat_id}/messages")
async def add_message_to_chat(
        chat_id: str,
        message: dict,
        db: db_dependency,
        current_user: user_dependency
):
    """
    Chat'e yeni mesaj ekle
    """
    try:
        from models import Chat

        chat_row = db.query(Chat).filter(
            Chat.id == chat_id,
            Chat.user_email == current_user["email"]
        ).first()

        if not chat_row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat bulunamadı"
            )

        # Yeni mesajı ekle
        current_messages = chat_row.messages if chat_row.messages else []
        current_messages.append(message)

        chat_row.messages = current_messages
        chat_row.updated_at = datetime.utcnow()

        db.commit()

        return {"message": "Mesaj eklendi"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Mesaj ekleme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Mesaj eklenemedi"
        )


# Tek chat getirme
@router.get("/{chat_id}", response_model=ChatModel)
async def get_chat_by_id(
        chat_id: str,
        db: db_dependency,
        current_user: user_dependency
):
    """
    Belirli bir chat'i getir
    """
    try:
        query = """
                SELECT id, title, created_at, category, status, messages
                FROM chats
                WHERE id = :chat_id \
                  AND user_email = :user_email \
                """

        result = db.execute(query, {
            "chat_id": chat_id,
            "user_email": current_user["email"]
        }).fetchone()

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat bulunamadı"
            )

        # Messages'ı parse et
        messages = json.loads(result.messages) if isinstance(result.messages, str) else result.messages

        return ChatModel(
            id=result.id,
            title=result.title,
            created_at=result.created_at,
            category=result.category or "analysis",
            status=result.status or "completed",
            messages=[
                MessageModel(
                    role=msg["role"],
                    content=msg["content"],
                    timestamp=datetime.fromisoformat(msg["timestamp"].replace("Z", "+00:00"))
                ) for msg in messages
            ]
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Chat getirme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Chat getirilemedi"
        )


# Chat silme
@router.delete("/{chat_id}")
async def delete_chat(
        chat_id: str,
        db: db_dependency,
        current_user: user_dependency
):
    """
    Chat'i sil
    """
    try:
        # Önce chat'in var olup olmadığını ve kullanıcıya ait olup olmadığını kontrol et
        check_query = """
                      SELECT id \
                      FROM chats
                      WHERE id = :chat_id \
                        AND user_email = :user_email \
                      """

        result = db.execute(check_query, {
            "chat_id": chat_id,
            "user_email": current_user["email"]
        }).fetchone()

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat bulunamadı"
            )

        # Chat'i sil
        delete_query = """
                       DELETE \
                       FROM chats
                       WHERE id = :chat_id \
                         AND user_email = :user_email \
                       """

        db.execute(delete_query, {
            "chat_id": chat_id,
            "user_email": current_user["email"]
        })

        db.commit()

        return {"message": "Chat başarıyla silindi"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Chat silme hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Chat silinemedi"
        )