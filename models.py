from datetime import date, datetime
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


class Chat(Base):
    __tablename__ = 'chats'

    id = Column(String, primary_key=True, index=True)
    user_email = Column(String, ForeignKey('users.email'), index=True)  # User ile ilişki
    title = Column(String)
    category = Column(String, default="analysis")
    status = Column(String, default="completed")
    messages = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)