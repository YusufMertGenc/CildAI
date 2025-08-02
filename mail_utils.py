from typing import List

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
import os
from dotenv import load_dotenv

load_dotenv()
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
MAIL_FROM = os.getenv("MAIL_FROM")
BASE_URL = "http://192.158.29.215"
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
    link = f"${BASE_URL}/verify-email?token={token}"

    message = MessageSchema(
        subject="E-posta Doğrulama",
        recipients=[email],
        body=f"Merhaba, e-postanızı doğrulamak için bu bağlantıya tıklayın:\n{link}",
        subtype="plain"
    )

    fm = FastMail(conf)
    await fm.send_message(message)


async def send_history_email(to_email: EmailStr, history_data: List[dict]):
    body = "Geçmiş analizleriniz:\n\n"
    for item in history_data:
        body += f"Tarih: {item['timestamp']}, Sonuç: {item['response']}\n"

    message = MessageSchema(
        subject="Cilt Analiz Geçmişiniz",
        recipients=[to_email],
        body=body,
        subtype="plain"
    )
    fm = FastMail(conf)
    await fm.send_message(message)


async def send_verification_code_email(email: EmailStr, token: str):
    link = f"{token}"
    message = MessageSchema(
        subject="Şifre Sıfırlama",
        recipients=[email],
        body=f"Şifre sıfırlama kodunuz: {link}\nBu kod 10 dakika geçerlidir.",
        subtype="plain"
    )
    fm = FastMail(conf)
    await fm.send_message(message)
