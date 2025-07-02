from datetime import timedelta, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from database import SessionLocal
from typing import Annotated
from models import User
from starlette import status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from passlib.context import CryptContext
from pydantic import BaseModel
from jose import JWTError, jwt

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

SECRET_KEY = "x4s7vhci6qv6vm3n42xqjodn30dth9q9r8ewo0wthjihb2q5v81m3hkotof29yib"
ALGORITHM = "HS256"


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


async def get_current_user(token: Annotated[str, Depends(oauth2_bearer)]):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get('sub')
        user_id: int = payload.get('id')
        user_role: str = payload.get('role')
        if email is None or user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email or ID is invalid")
        return {"email": email, "id": user_id, "role": user_role}
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is invalid")


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
    db.add(user)
    db.commit()


@router.post("/token", response_model=Token)
async def login_for_access_token(from_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: db_dependency):
    email = from_data.username
    user = authenticate_user(db, email, from_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    token = create_access_token(user.email, user.id, user.role, timedelta(minutes=60))
    return {"access_token": token, "token_type": "bearer"}


@router.get("/get_all", status_code=status.HTTP_200_OK)
async def get_all_users(db: db_dependency):
    users = db.query(User).all()
    return users
