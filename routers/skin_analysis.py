from fastapi import UploadFile, File, Form, HTTPException, APIRouter, Depends
from fastapi.responses import JSONResponse, StreamingResponse
import io
from PIL import Image
from database import SessionLocal
import google.generativeai as genai
import os
from dotenv import load_dotenv
from typing import Annotated, Optional
from sqlalchemy.orm import Session
from routers.auth import get_current_user
from routers.generatepdf import generate_analysis_pdf
import markdown2 as markdown
from bs4 import BeautifulSoup
from models import Chat
import uuid
import requests

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")  # Google Maps API key ekleyin

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


def find_nearest_hospitals(latitude: float, longitude: float):
    """En yakın hastaneleri bulur"""
    print(f"🔍 Hastane aranıyor... Konum: {latitude}, {longitude}")  # DEBUG

    try:
        url = "https://maps.googleapis.com/maps/api/places/nearbysearch/json"
        params = {
            'location': f"{latitude},{longitude}",
            'radius': 1000000000,  #cap
            'type': 'hospital',
            'key': GOOGLE_MAPS_API_KEY
        }

        print(f"🌐 API Request: {url}")  # DEBUG
        print(f"📋 Parameters: {params}")  # DEBUG

        response = requests.get(url, params=params)
        data = response.json()

        print(f"📡 API Response Status: {response.status_code}")  # DEBUG
        print(f"📄 API Response: {data}")  # DEBUG

        hospitals = []
        if data.get('results'):
            print(f"🏥 {len(data['results'])} hastane bulundu")  # DEBUG
            for hospital in data['results'][:3]:  # İlk 3 hastane
                # Hastane koordinatları
                hosp_lat = hospital['geometry']['location']['lat']
                hosp_lng = hospital['geometry']['location']['lng']

                # Google Maps link oluştur
                maps_link = f"https://www.google.com/maps/dir/{latitude},{longitude}/{hosp_lat},{hosp_lng}"

                hospital_info = {
                    'name': hospital.get('name', 'Bilinmeyen Hastane'),
                    'address': hospital.get('vicinity', 'Adres bilgisi yok'),
                    'rating': hospital.get('rating', 'Değerlendirme yok'),
                    'maps_link': maps_link  # EKLENEN: Google Maps link
                }
                hospitals.append(hospital_info)
                print(f"➕ Hastane eklendi: {hospital_info['name']}")  # DEBUG
        else:
            print("❌ Hiç hastane bulunamadı")  # DEBUG
            if 'error_message' in data:
                print(f"❌ API Hatası: {data['error_message']}")  # DEBUG

        return hospitals
    except Exception as e:
        print(f"💥 Hastane arama hatası: {e}")  # DEBUG
        return []


@router.post("/analyze-skin")
async def analyze_skin(
        db: db_dependency,
        current_user: user_dependency,
        file: UploadFile = File(...),
        notes: str = Form(""),
        latitude: Optional[float] = Form(None),
        longitude: Optional[float] = Form(None)
):
    print("Kullanıcı kimliği:", current_user)
    print(f"📍 Gelen konum bilgisi - Latitude: {latitude}, Longitude: {longitude}")  # DEBUG
    print(f"📝 Kullanıcı notları: {notes}")  # DEBUG
    print(f"🔑 Google Maps API Key var mı: {GOOGLE_MAPS_API_KEY is not None}")  # DEBUG

    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Boş bir dosya gönderildi.")

        model = genai.GenerativeModel("gemini-1.5-flash")

        # Geliştirilmiş profesyonel prompt
        prompt = f"""
Sen uzman bir dermatoloji asistanısın. Görsel analizi yaparak cilt sağlığı hakkında bilgilendirici ve profesyonel değerlendirme sunacaksın.

📋 ANALİZ GÖREVLERİN:

1. **GÖRSEL DEĞERLENDİRME**
   • Cilt tipini belirle (normal, kuru, yağlı, karma, hassas)
   • Görünen problemleri tespit et (akne, leke, kızarıklık, kuruluk, yaşlanma belirtileri)
   • Cilt dokusunu ve genel durumunu değerlendir

2. **RİSK SEVİYESİ BELİRLEME**
   ⚠️ YÜKSEK RİSK DURUMLARI:
   - Asimetrik veya düzensiz kenarlı lezyonlar
   - Renk değişikliği gösteren benler (A-B-C-D-E kriterlerine göre)
   - Kanamaya eğilimli veya iyileşmeyen yaralar
   - Hızla büyüyen çıkıntılar veya nodüller
   - Ülserasyon gösteren alanlar
   - Şüpheli pigmentasyon değişiklikleri

   📊 ORTA RİSK DURUMLARI:
   - Şiddetli kistik akne
   - Yaygın inflamasyonlu lezyonlar
   - Büyük seboreik keratozlar
   - Kronik dermatit bulguları

   ✅ DÜŞÜK RİSK DURUMLARI:
   - Basit akne lezyonları
   - Kuru cilt ve pullanma
   - Yaş lekeleri
   - Gözenek sorunları

3. **PROFESYONEl ÖNERİLER**
   • Cilt tipine uygun bakım rutinleri
   • Güvenilir aktif madde önerileri
   • Yaşam tarzı tavsiyeleri
   • Korunma önlemleri

📝 Kullanıcı Notları: {notes if notes else "Belirtilmemiş"}

---

YANITINI AŞAĞIDAKİ FORMATTA VER:

🔬 **CILT ANALİZİ**
• **Cilt Tipi:** [Belirlenen tip]
• **Tespit Edilen Durumlar:** [Detaylı liste]
• **Genel Değerlendirme:** [Profesyonel görüş]

⚡ **RİSK SEVİYESİ:** [DÜŞÜK/ORTA/YÜKSEK]

💡 **BAKIM ÖNERİLERİ**

**Günlük Rutin:**
• Sabah: [Detaylı adımlar]
• Akşam: [Detaylı adımlar]

**Önerilen Aktif Maddeler:**
• [Cilt durumuna özel içerikler]

**Yaşam Tarzı Tavsiyeleri:**
• Beslenme, hidrasyon, uyku düzeni önerileri

⚕️ **TIBBİ DURUM DEĞERLENDİRMESİ**
[Risk seviyesine göre uygun uyarı metni]

📚 **GÜVEN VE KAYNAK BİLGİSİ**
Bu analiz görsel veriye dayalı genel bilgilendirme amaçlıdır. Kesin teşhis için dermatoloji uzmanına başvurunuz.

---

ÖNEMLİ NOTLAR:
- Şüpheli durumlarda mutlaka "YÜKSEK RİSK" olarak işaretle
- Profesyonel dil kullan, abartma
- Somut ve uygulanabilir öneriler ver
- Risk durumunda aciliyet vurgusu yap
        """

        response = model.generate_content([{
            "mime_type": "image/png",
            "data": image_bytes
        }, prompt])

        advice_text = response.text
        clean_advice = markdown_to_text(advice_text)

        # GÜNCELLENDİ: Daha kesin risk kontrolü
        has_risk = any(keyword in clean_advice.upper() for keyword in [
            "YÜKSEK RİSK",
            "ACİL",
            "DERHAL",
            "ŞÜPHELI",
            "RİSK SEVİYESİ: YÜKSEK",
            "YÜKSEK RISK"
        ])

        # DÜŞÜK RİSK durumunda False olmalı
        if "DÜŞÜK RİSK" in clean_advice.upper() or "RİSK SEVİYESİ: DÜŞÜK" in clean_advice.upper():
            has_risk = False

        print(f"🧪 Risk Kontrolü:")
        print(f"   - Clean advice'ta YÜKSEK RİSK var mı: {'YÜKSEK RİSK' in clean_advice.upper()}")
        print(f"   - Clean advice'ta DÜŞÜK RİSK var mı: {'DÜŞÜK RİSK' in clean_advice.upper()}")
        print(f"   - Final has_risk: {has_risk}")

        # Hastane bilgisi ekleme - SADECE YÜKSEK RİSK durumunda
        hospital_info = ""
        if has_risk and latitude and longitude:
            print("🏥 YÜKSEK RİSK tespit edildi - Hastane aranıyor...")
            hospitals = find_nearest_hospitals(latitude, longitude)
            if hospitals:
                hospital_info = "\n\n🏥 **EN YAKIN SAĞLIK TESİSLERİ:**\n\n"
                for i, hospital in enumerate(hospitals, 1):
                    hospital_info += f"**{i}. {hospital['name']}**\n"
                    hospital_info += f"📍 Adres: {hospital['address']}\n"
                    if hospital['rating'] != 'Değerlendirme yok':
                        hospital_info += f"⭐ Değerlendirme: {hospital['rating']}/5\n"
                    # EKLENEN: Google Maps yol tarifi linki
                    hospital_info += f"🗺️ Yol Tarifi: {hospital['maps_link']}\n"
                    hospital_info += "\n"
                hospital_info += "📞 Acil durumlar için 112'yi arayabilirsiniz.\n"
                print(f"✅ {len(hospitals)} hastane eklendi (linklerle birlikte)")
            else:
                hospital_info = "\n\n🏥 **HASTANE BİLGİSİ:** Yakın hastane bulunamadı. 112'yi arayabilirsiniz.\n"
                print("❌ Hastane bulunamadı")
        elif has_risk and not (latitude and longitude):
            print("❌ YÜKSEK RİSK ama konum bilgisi yok!")
            hospital_info = "\n\n🏥 **HASTANE BİLGİSİ:** Konum bilgisi alınamadı. 112'yi arayabilirsiniz.\n"
        else:
            print("✅ DÜŞÜK/ORTA RİSK - Hastane aranmıyor")

        final_advice = clean_advice + hospital_info

        # Veritabanına kaydet
        chat = Chat(
            id=str(uuid.uuid4()),
            input_text=notes,
            output_text=final_advice,
            owner_id=current_user['id']
        )

        db.add(chat)
        db.commit()
        db.refresh(chat)

        print(f"✅ Response hazır - Risk durumu: {has_risk}")
        return {"advice": final_advice, "has_risk": has_risk}

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Bir hata oluştu: {str(e)}")


def markdown_to_text(markdown_string):
    html = markdown.markdown(markdown_string)
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text()
    return text


@router.post("/upload-photo/")
async def upload_photo(file: UploadFile = File(...)):
    try:
        image_data = await file.read()

        if not image_data:
            raise HTTPException(status_code=400, detail="Boş bir dosya gönderildi.")

        image = Image.open(io.BytesIO(image_data))
        image.save("uploaded_image.png")

        return JSONResponse(content={"message": "Fotoğraf başarıyla alındı ve kaydedildi!"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fotoğraf işlenirken bir hata oluştu: {str(e)}")


@router.post("/generate-pdf/")
async def generate_pdf_endpoint(advice: str = Form(...)):
    print("🖨️ PDF FONKSİYONU ÇALIŞTI")
    return generate_analysis_pdf(advice)