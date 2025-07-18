from datetime import date, datetime

from sqlalchemy.orm import relationship

from database import Base
from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, DateTime, Text, JSON


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String, unique=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    role = Column(String)
    is_verified = Column(Boolean, default=False)
    prompts = relationship("Chat", back_populates="user")


class Chat(Base):
    __tablename__ = 'chats'

    id = Column(String, primary_key=True, index=True)
    input_text = Column(Text)
    output_text = Column(Text)
    created_at = Column(DateTime, default=datetime.now())
    owner_id = Column(Integer, ForeignKey('users.id'))
    user = relationship("User", back_populates="prompts")
