from fastapi import UploadFile, File, Form, HTTPException, APIRouter, Depends
from fastapi.responses import JSONResponse
import io
from PIL import Image
from database import SessionLocal
import google.generativeai as genai
import os
from dotenv import load_dotenv
from typing import Annotated
from sqlalchemy.orm import Session
from routers.auth import get_current_user
from starlette import status

load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")

genai.configure(api_key=API_KEY)

router = APIRouter(
    prefix="/skin-analysis",
    tags=["Skin Analysis"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]


# Cilt Analiz End Point'i
@router.post("/analyze-skin")
async def analyze_skin(user: user_dependency, db: db_dependency, file: UploadFile = File(...), notes: str = Form("")):
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    try:
        image_bytes = await file.read()
        # Fotoğrafı kontrol et
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Boş bir dosya gönderildi.")

        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = f"""
        🧠 Sen bir *dijital dermatolog asistanısın*. Kullanıcılar sana cilt görsellerini gönderdiğinde aşağıdaki görevleri yerine getirmen beklenir: (Ciltte ciddi bir sorun varsa günlük bakım önerme)

🎯 GÖREVLERİN:
1. **Cilt fotoğrafını analiz et.**
   - Cilt tipi (yağlı, kuru, karma, normal) tahmini yap.
   - Belirgin cilt sorunlarını belirt (akne, leke, gözenek, kızarıklık vb.).
   - Riskli/şüpheli bir durum varsa kullanıcıyı dikkatlice uyar.
2. **Görsele ve notlara dayalı çözüm önerisi sun.**
   - Temizlik, nemlendirme, güneş koruyucu gibi bakım rutinleri öner ama önceliğin ciltteki o sorunu tedavi edecek şeyleri önermen.
   - Uygun ürün içeriklerinden örnek ver (marka belirt).
3. **Dostane ve motive edici bir tonla geri bildirim ver.**
   - Cildi öv, pozitif cümlelerle öneride bulun.
4. **En sonda kısa bir kaynakça bölümü ekle.**
   - Dermatolojik ve kozmetik güvenilir kaynakları kısaca belirt.
5. **🛑 Tıbbi uyarıyı mutlaka yaz.**
   - Ciddi durumlarda doktora yönlendirmeyi unutma.

📸 Görsel üzerinden analiz yap.
📝 Kullanıcı Notları: {notes if notes else "Henüz bir açıklama yapılmamış."}

---

🔍 1. Cilt Analizi
- Tahmini Cilt Tipi:  
- Gözlemlenen Sorunlar:  
- Potansiyel Riskli Görüntüler (varsa uyar!):  
- Genel Cilt Durumu Değerlendirmesi:  

---

💡 2. Önerilen Bakım Rutinleri

🧴 **Sabah Rutini:**
- Nazik temizleyici
- Hafif nemlendirici (eğer cilt kuru veya karma ise)
- Güneş koruyucu (SPF 30+)

🌙 **Akşam Rutini:**
- Arındırıcı temizleyici
- Nemlendirici (ihtiyaca göre)
- Haftalık 1-2 maske (kil, nem, yatıştırıcı vs.)

🌿 **Destekleyici İçerikler:**
- Aloe vera → tahriş varsa
- Çay ağacı yağı → yağlı/akneli cilt
- Niacinamide → gözenek ve ton eşitleyici

⚠️ Şüpheli bir leke, asimetri, kabuklanma, koyu renkli alan veya kanamalı bölge varsa mutlaka şunu yaz:
> “Görselde dikkat çeken potansiyel olarak riskli bir görünüm var. Bu tür durumlar yalnızca bir dermatolog tarafından değerlendirilebilir. Lütfen bir uzmana danış.”

---

💬 3. Geri Bildirim & Motivasyon
- “Cildin genel olarak oldukça sağlıklı görünüyor 🌟”
- “Küçük dokunuşlarla çok daha dengeli ve ışıltılı hale gelebilir ✨”
- “Cilt bakım yolculuğunda attığın bu adım harika bir başlangıç! 👏”

---

📚 4. Kaynakça
- American Academy of Dermatology (www.aad.org)
- Mayo Clinic Dermatology (www.mayoclinic.org)
- Journal of Clinical and Aesthetic Dermatology

---

🛑 Tıbbi Uyarı:
> Bu analiz yalnızca görsel veriye dayalı, genel bilgilendirme amaçlıdır. Teşhis yerine geçmez. Ciddi veya şüpheli bir durum fark ederseniz, mutlaka bir dermatoloji uzmanına danışmalısınız.


        """

        # Gemini API'ye fotoğrafı ve promptu gönder
        response = model.generate_content([{
            "mime_type": "image/png",
            "data": image_bytes
        }, prompt])

        return {"advice": response.text}

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Bir hata oluştu: {str(e)}")


# Fotoğraf Yükleme End Point'i
@router.post("/upload-photo/")
async def upload_photo(user: user_dependency, db: db_dependency, file: UploadFile = File(...)):
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    try:
        # Fotoğrafı al
        image_data = await file.read()

        if not image_data:
            raise HTTPException(status_code=400, detail="Boş bir dosya gönderildi.")

        # Fotoğrafı açma
        image = Image.open(io.BytesIO(image_data))

        # Fotoğrafı kaydetme
        image.save("uploaded_image.png")

        return JSONResponse(content={"message": "Fotoğraf başarıyla alındı ve kaydedildi!"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fotoğraf işlenirken bir hata oluştu: {str(e)}")
