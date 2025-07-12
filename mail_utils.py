from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
import os
from dotenv import load_dotenv

load_dotenv()
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
MAIL_FROM = os.getenv("MAIL_FROM")

conf = ConnectionConfig(
    MAIL_USERNAME=MAIL_USERNAME,
    MAIL_PASSWORD=MAIL_PASSWORD,
    MAIL_FROM=MAIL_FROM,
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    MAIL_FROM_NAME="CildAI",
    USE_CREDENTIALS=True
)


async def send_verification_email(email: EmailStr, token: str):
    link = f"http://localhost:8000/verify-email?token={token}"

    message = MessageSchema(
        subject="E-posta Doğrulama",
        recipients=[email],
        body=f"Merhaba, e-postanızı doğrulamak için bu bağlantıya tıklayın:\n{link}",
        subtype="plain"
    )

    fm = FastMail(conf)
    await fm.send_message(message)
