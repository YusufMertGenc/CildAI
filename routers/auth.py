from datetime import timedelta, datetime, timezone
from random import randint

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from zmq.backend import first
from database import SessionLocal
from typing import Annotated
from models import User, PasswordResetCode
from starlette import status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from jose import JWTError, jwt
from utils import generate_confirmation_token
from mail_utils import send_verification_email, send_verification_code_email
import os
from dotenv import load_dotenv
import httpx
import secrets

router = APIRouter(
    prefix="/auth",
    tags=["Kimlik Doğrulama"]
)

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

# OAuth ayarları
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

# OAuth redirect URL'leri
GOOGLE_REDIRECT_URI = "http://localhost:8000/auth/google/callback"
GITHUB_REDIRECT_URI = "http://localhost:8000/auth/github/callback"


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


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyResetCodeRequest(BaseModel):
    email: EmailStr
    code: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str


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


def get_or_create_oauth_user(db: Session, email: str, first_name: str, last_name: str, provider: str):
    """OAuth ile gelen kullanıcıyı kontrol et veya oluştur"""
    user = db.query(User).filter(User.email == email).first()

    if not user:
        # Yeni kullanıcı oluştur
        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name or "",
            role="user",
            is_active=True,
            is_verified=True,  # OAuth kullanıcıları otomatik doğrulanmış sayılır
            hashed_password=bcrypt_context.hash(secrets.token_urlsafe(32))  # Random password
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user


# GOOGLE OAuth Endpoints
@router.get("/google")
async def google_login():
    """Google OAuth giriş sayfasına yönlendir"""
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={GOOGLE_REDIRECT_URI}&"
        f"scope=openid email profile&"
        f"response_type=code&"
        f"access_type=offline"
    )
    return RedirectResponse(url=google_auth_url)


@router.get("/google/callback")
async def google_callback(code: str, db: db_dependency):
    """Google OAuth callback"""
    try:
        print(f"🔵 Google callback başladı, code: {code[:10]}...")

        # Access token al
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": GOOGLE_REDIRECT_URI,
                }
            )

            print(f"🔵 Google token response: {token_response.status_code}")

            if token_response.status_code != 200:
                print(f"❌ Google token hatası: {token_response.text}")
                raise HTTPException(status_code=400, detail="Google token alınamadı")

            token_data = token_response.json()
            access_token = token_data.get("access_token")

            # Kullanıcı bilgilerini al
            user_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )

            if user_response.status_code != 200:
                print(f"❌ Google user info hatası: {user_response.text}")
                raise HTTPException(status_code=400, detail="Google kullanıcı bilgileri alınamadı")

            user_data = user_response.json()
            print(f"🔵 Google user data: {user_data}")

            # Kullanıcıyı bul veya oluştur
            user = get_or_create_oauth_user(
                db=db,
                email=user_data["email"],
                first_name=user_data.get("given_name", ""),
                last_name=user_data.get("family_name", ""),
                provider="google"
            )

            jwt_token = create_access_token(
                user.email,
                user.id,
                user.role,
                timedelta(minutes=60)
            )

            print(f"✅ Google JWT token oluşturuldu: {jwt_token[:20]}...")

            return HTMLResponse(content=f"""
            <html>
                <script>
                    console.log('Google callback başarılı, token gönderiliyor...');
                    window.opener.postMessage({{
                        type: 'GOOGLE_AUTH_SUCCESS',
                        token: '{jwt_token}'
                    }}, '*');
                    window.close();
                </script>
            </html>
            """)

    except Exception as e:
        print(f"❌ Google OAuth hatası: {e}")
        return HTMLResponse(content=f"""
        <html>
            <script>
                console.log('Google callback hatası:', '{str(e)}');
                window.opener.postMessage({{
                    type: 'GOOGLE_AUTH_ERROR',
                    error: '{str(e)}'
                }}, '*');
                window.close();
            </script>
        </html>
        """)


@router.get("/github")
async def github_login():
    """GitHub OAuth giriş sayfasına yönlendir"""
    github_auth_url = (
        f"https://github.com/login/oauth/authorize?"
        f"client_id={GITHUB_CLIENT_ID}&"
        f"redirect_uri={GITHUB_REDIRECT_URI}&"
        f"scope=user:email"
    )
    return RedirectResponse(url=github_auth_url)


@router.get("/github/callback")
async def github_callback(code: str, db: db_dependency):
    """GitHub OAuth callback"""
    try:
        print(f"🟣 GitHub callback başladı, code: {code[:10]}...")

        # Access token al
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": GITHUB_CLIENT_ID,
                    "client_secret": GITHUB_CLIENT_SECRET,
                    "code": code,
                },
                headers={"Accept": "application/json"}
            )

            print(f"🟣 GitHub token response: {token_response.status_code}")
            print(f"🟣 GitHub token data: {token_response.text}")

            if token_response.status_code != 200:
                print(f"❌ GitHub token hatası: {token_response.text}")
                raise HTTPException(status_code=400, detail="GitHub token alınamadı")

            token_data = token_response.json()
            access_token = token_data.get("access_token")

            if not access_token:
                print(f"❌ GitHub access token alınamadı: {token_data}")
                raise HTTPException(status_code=400, detail="GitHub access token alınamadı")

            # Kullanıcı bilgilerini al
            user_response = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {access_token}"}
            )

            print(f"🟣 GitHub user response: {user_response.status_code}")

            if user_response.status_code != 200:
                print(f"❌ GitHub user info hatası: {user_response.text}")
                raise HTTPException(status_code=400, detail="GitHub kullanıcı bilgileri alınamadı")

            user_data = user_response.json()
            print(f"🟣 GitHub user data: {user_data}")

            # Email bilgisini al (GitHub'da email private olabilir)
            email_response = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {access_token}"}
            )

            emails = email_response.json()
            primary_email = next((email["email"] for email in emails if email["primary"]), None)

            if not primary_email:
                print(f"❌ GitHub email alınamadı: {emails}")
                raise HTTPException(status_code=400, detail="GitHub email adresi alınamadı")

            print(f"🟣 GitHub primary email: {primary_email}")

            name_parts = (user_data.get("name") or "").split(" ", 1)
            first_name = name_parts[0] if name_parts else user_data.get("login", "")
            last_name = name_parts[1] if len(name_parts) > 1 else ""

            user = get_or_create_oauth_user(
                db=db,
                email=primary_email,
                first_name=first_name,
                last_name=last_name,
                provider="github"
            )

            jwt_token = create_access_token(
                user.email,
                user.id,
                user.role,
                timedelta(minutes=60)
            )

            print(f"✅ GitHub JWT token oluşturuldu: {jwt_token[:20]}...")
            return HTMLResponse(content=f"""
            <html>
                <script>
                    console.log('GitHub callback başarılı, token gönderiliyor...');
                    window.opener.postMessage({{
                        type: 'GITHUB_AUTH_SUCCESS',
                        token: '{jwt_token}'
                    }}, '*');
                    window.close();
                </script>
            </html>
            """)

    except Exception as e:
        print(f"❌ GitHub OAuth hatası: {e}")
        return HTMLResponse(content=f"""
        <html>
            <script>
                console.log('GitHub callback hatası:', '{str(e)}');
                window.opener.postMessage({{
                    type: 'GITHUB_AUTH_ERROR',
                    error: '{str(e)}'
                }}, '*');
                window.close();
            </script>
        </html>
        """)


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

        new_hashed_password = bcrypt_context.hash(password_request.new_password)
        user.hashed_password = new_hashed_password

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


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, db: db_dependency):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Bu e-posta sistemde kayıtlı değil")

    db.query(PasswordResetCode).filter(PasswordResetCode.user_id == user.id).delete()

    code = str(randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    reset_entry = PasswordResetCode(user_id=user.id, code=code, expires_at=expires_at)
    db.add(reset_entry)
    db.commit()

    await send_verification_code_email(email=user.email, token=code)

    return {"message": "Doğrulama kodu e-posta adresinize gönderildi."}


@router.post("/verify-reset-code")
async def verify_reset_code(data: VerifyResetCodeRequest, db: db_dependency):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

    record = db.query(PasswordResetCode).filter(
        PasswordResetCode.user_id == user.id,
        PasswordResetCode.code == data.code,
        PasswordResetCode.expires_at > datetime.utcnow()
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="Kod geçersiz veya süresi dolmuş")

    return {"message": "Kod doğru, şifre sıfırlama sayfasına geçebilirsiniz."}


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest, db: db_dependency):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

    record = db.query(PasswordResetCode).filter(
        PasswordResetCode.user_id == user.id,
        PasswordResetCode.code == data.code,
        PasswordResetCode.expires_at > datetime.utcnow()
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="Kod geçersiz veya süresi dolmuş")

    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Yeni şifre en az 8 karakter olmalı")

    user.hashed_password = bcrypt_context.hash(data.new_password)
    db.query(PasswordResetCode).filter(PasswordResetCode.user_id == user.id).delete()
    db.commit()

    return {"message": "Şifre başarıyla sıfırlandı"}


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
