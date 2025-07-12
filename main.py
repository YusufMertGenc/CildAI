from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.auth import router as auth_router
from routers.skin_analysis import router as skin_analysis_router
from routers.chat import router as chat_router
from models import Base
from database import engine

app = FastAPI()
app.include_router(auth_router)
app.include_router(skin_analysis_router)
app.include_router(chat_router)
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)