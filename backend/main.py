import google.generativeai as genai
import os
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")

genai.configure(api_key=API_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze-skin")
async def analyze_skin(file: UploadFile = File(...), notes: str = Form("")):
    image_bytes = await file.read()

    model = genai.GenerativeModel("gemini-1.5-flash")

    try:
        prompt = f"""
        Bir dermatolog gibi davran. Aşağıdaki cilt görselini ve kullanıcının açıklamasını birlikte değerlendir:

        📸 Görsel: (aşağıdaki görseli analiz et)
        🗒️ Kullanıcı Notları: {notes if notes else "Belirtilmemiş"}

        Şu şekilde çıktı ver:
        1. TESPİT:
        - Ciltte ne olduğunu düşündüğünü yaz. Kısa ve net ol.
        2. ÇÖZÜM:
        - Evde kullanılabilecek basit bakım veya krem öner (Madecassol, Bepanthol vs.)
        - bitkisel doğal çözümler de öner
        - kozmetikte spesifik marka vererek ürün öner
        - 2 ürün önerip bırakma mümkünse 5-6 tane ürün öner kullanıcı direkt senin önerdiğin ürünü kullanabilsin (madde madde öner kocaman bir metin olmasın)
        - her ürün arası ve madde arası bir satır aşağı geç 
        3. RİSK DURUMU:
        - Eğer ciddi bir hastalık riski (örneğin cilt kanseri, kalıcı iz) varsa belirt. Eğer ciddi bir şey değilse sadece 'Hayır' de.

        🛑 Eğer durum ciddi değilse kesinlikle "Dermatoloğa git" deme. Ancak risk ciddi ise "Mutlaka dermatoloğa git" gibi net uyarı ver.

        - Sade Türkçe kullan, tıbbi terimleri açıklayarak yaz.
        - Uzun paragraflardan kaçın, maddeli ve net yaz.
        """

        response = model.generate_content([
            {
                "mime_type": file.content_type,
                "data": image_bytes
            },
            prompt
        ])

        return {"advice": response.text}
    except Exception as e:
        return {"error": str(e)}
