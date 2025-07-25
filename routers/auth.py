from datetime import timedelta, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from zmq.backend import first
from database import SessionLocal
from typing import Annotated
from models import User
from starlette import status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from passlib.context import CryptContext
from pydantic import BaseModel
from jose import JWTError, jwt
from utils import generate_confirmation_token
from mail_utils import send_verification_email
import os
from dotenv import load_dotenv

router = APIRouter(
    prefix="/auth",
    tags=["Kimlik Doğrulama"]
)

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]

bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_bearer = OAuth2PasswordBearer(tokenUrl="auth/token")


class CreateUserRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str
    role: str


class Token(BaseModel):
    access_token: str
    token_type: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str


class ChangeEmailRequest(BaseModel):
    current_password: str
    new_email: str
    confirm_email: str


def create_access_token(email: str, user_id: int, role: str, expires_delta: timedelta):
    payload = {'sub': email, 'id': user_id, 'role': role}
    expires_delta = datetime.now(timezone.utc) + expires_delta
    payload.update({'exp': expires_delta})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def authenticate_user(db: db_dependency, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return False
    if not bcrypt_context.verify(password, user.hashed_password):
        return False
    return user


async def get_current_user(token: Annotated[str, Depends(oauth2_bearer)], db: db_dependency):
    print("Token geldi:", token)
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get('id')
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="ID geçersiz")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kullanıcı bulunamadı")
        return {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role
        }
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token geçersiz")


@router.post("/create_user", status_code=status.HTTP_201_CREATED)
async def create_user(db: db_dependency, create_user_request: CreateUserRequest):
    user = User(
        email=create_user_request.email,
        first_name=create_user_request.first_name,
        last_name=create_user_request.last_name,
        role=create_user_request.role,
        is_active=True,
        hashed_password=bcrypt_context.hash(create_user_request.password),
    )
    token = generate_confirmation_token(create_user_request.email)
    await send_verification_email(email=create_user_request.email, token=token)

    db.add(user)
    db.commit()


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: db_dependency):
    email = form_data.username
    user = authenticate_user(db, email, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Yanlış e-posta veya şifre")
    if not user.is_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Lütfen önce e-posta adresinizi doğrulayın.")
    token = create_access_token(user.email, user.id, user.role, timedelta(minutes=60))
    return {"access_token": token, "token_type": "bearer"}


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
        password_request: ChangePasswordRequest,
        db: db_dependency,
        current_user: dict = Depends(get_current_user)
):
    try:
        if password_request.new_password != password_request.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Yeni şifre ve tekrarı uyuşmuyor"
            )

        # Kullanıcıyı veritabanından al
        user = db.query(User).filter(User.email == current_user["email"]).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Kullanıcı bulunamadı"
            )

        # Mevcut şifreyi doğrula
        if not bcrypt_context.verify(password_request.current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mevcut şifre hatalı"
            )

        # Yeni şifrenin gereksinimlerini kontrol et
        if len(password_request.new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Yeni şifre en az 8 karakter olmalıdır"
            )

        # Yeni şifreyi hash'le ve güncelle
        new_hashed_password = bcrypt_context.hash(password_request.new_password)
        user.hashed_password = new_hashed_password

        # Değişiklikleri kaydet
        db.commit()

        return {
            "message": "Şifre başarıyla değiştirildi",
            "success": True
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Şifre değiştirme işlemi başarısız: {str(e)}"
        )


@router.post("/change-email", status_code=status.HTTP_200_OK)
async def change_email(
        email_request: ChangeEmailRequest,
        db: db_dependency,
        current_user: dict = Depends(get_current_user)
):
    try:
        print(f"📧 Mail değiştirme isteği - Kullanıcı: {current_user['email']}")
        print(f"📧 Yeni mail: {email_request.new_email}")

        # Email'lerin eşleştiğini kontrol et
        if email_request.new_email != email_request.confirm_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Yeni mail adresleri eşleşmiyor"
            )

        # Yeni email'in mevcut email'den farklı olduğunu kontrol et
        if email_request.new_email == current_user['email']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Yeni mail adresi mevcut mail adresinizle aynı olamaz"
            )

        # Kullanıcıyı veritabanından getir
        user = db.query(User).filter(User.id == current_user['id']).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Kullanıcı bulunamadı"
            )

        # Mevcut şifreyi doğrula
        if not bcrypt_context.verify(email_request.current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mevcut şifre yanlış"
            )

        # Yeni email'in başka bir kullanıcı tarafından kullanılıp kullanılmadığını kontrol et
        existing_user = db.query(User).filter(User.email == email_request.new_email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bu mail adresi başka bir kullanıcı tarafından kullanılıyor"
            )

        # Mail adresini güncelle
        old_email = user.email
        user.email = email_request.new_email
        db.commit()

        print(f"✅ Mail başarıyla değiştirildi: {old_email} -> {email_request.new_email}")

        return {
            "message": "Mail adresi başarıyla değiştirildi",
            "old_email": old_email,
            "new_email": email_request.new_email,
            "success": True
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Mail değiştirme hatası: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Mail değiştirme sırasında bir hata oluştu: {str(e)}"
        )


@router.get("/get_all", status_code=status.HTTP_200_OK)
async def get_all_users(db: db_dependency):
    users = db.query(User).all()
    return users


@router.get("/me", status_code=status.HTTP_200_OK)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user