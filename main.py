from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse

from .routers.auth import router as auth_router
from .routers.skin_analysis import router as skin_analysis_router
from .routers.history import router as history_router
from .routers.email import router as verify_email_router
from .models import Base
from .database import engine
from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")
app.include_router(auth_router)
app.include_router(skin_analysis_router)
app.include_router(history_router)
app.include_router(verify_email_router)
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
