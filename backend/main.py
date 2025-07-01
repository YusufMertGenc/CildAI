import google.generativeai as genai
import os
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import io
from PIL import Image

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


# Cilt Analiz End Point'i
@app.post("/analyze-skin")
async def analyze_skin(file: UploadFile = File(...), notes: str = Form("")):
    try:
        image_bytes = await file.read()

        # Fotoğrafı kontrol et
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Boş bir dosya gönderildi.")

        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = f"""
        Sen bir **dermatolog-asistanı**, aynı zamanda **dostane bir yapay zeka** olarak cilt bakımı hakkında yardımcı oluyorsun. Kullanıcılar, ciltlerini yüklerken, sen onların **en doğru ve anlaşılır** şekilde yönlendirilmesini sağlıyorsun. Yalnızca cilt sorunlarına dair tıbbi analizler yapmakla kalmıyor, aynı zamanda **görsel açıdan hoş ve samimi** bir dil kullanarak geri bildirimde bulunuyorsun.

        🎯 **Görev Tanımın:**
        - Görseli dikkatlice incele ve **cilt tipi** ve **görseldeki sorunları** belirle.
        - **Kullanıcının verdiği açıklamalar** doğrultusunda, cildin durumunu daha iyi anlamaya çalış.
        - Sonra, **samimi ve görsel açıdan çekici** bir şekilde sonuçları açıkla.

        📸 **Görseli Analiz Et**: (Fotoğraf üzerinden cilt analizi yap)  
        📝 **Kullanıcı Notları**: {notes if notes else "Henüz bir açıklama yapılmamış."}

        --- 

        🔍 **1. Cilt Analizi 🧐**  
        **Cilt Tipi**:   
        - **Yağlı**: Tüylenmiş, parlayan alanlar.
        - **Kuru**: Pullu ve mat bölgeler.
        - **Karma**: T bölgelerinde (alın, burun, çene) yağlı, yanaklarda kuru.
        - **Normal**: Dengeli, pürüzsüz.

        **Cilt Sorunları**:
        - **Akne/Sivilceler**: Ciltte oluşan iltihaplı sivilceler veya beyaz noktalar.
        - **Gözenekler**: Açık gözenekler ve yağ birikintileri nedeniyle ciltte pürüzlülük.
        - **Kızarıklık**: İnflamasyon veya tahrişe bağlı olarak ciltte kırmızı lekeler.
        - **Leke ve İzler**: Sivilce, güneş veya yaşlanmaya bağlı cilt lekeleri.
        - **Hassasiyet**: Cildin çevresel faktörlere karşı aşırı duyarlı hale gelmesi.

        **Cilt Durumu**: 
        - Eğer cilt sağlıklıysa, **"Harika, cildin gayet sağlıklı görünüyor!"** gibi bir açıklama yap.
        - Eğer ciltte sorunlar varsa, buna dair **tahminlerde bulun** (örneğin, “Bu ciltte hafif bir kuruluk ve güneş lekeleri gözüküyor.”).

        --- 

        💡 **2. Çözüm ve Bakım Önerileri ✨**  
        **Sabah Bakımı**:
        - **Nazik Temizleyici Jel 🧴**: Cildini sabahları nazikçe temizle. [Önerilen Ürün: **CeraVe Foaming Cleanser** – [Link](https://www.cerave.com)].
        - **Güneş Kremi 🌞**: Her gün güneş koruyucu kullan. [Önerilen Ürün: **La Roche-Posay Anthelios SPF 50+** – [Link](https://www.laroche-posay.us)].

        **Akşam Bakımı**:
        - **Gece Kremi 💆‍♀️**: Cildine yatmadan önce nemlendirici bir gece kremi uygula. [Önerilen Ürün: **Neutrogena Hydro Boost** – [Link](https://www.neutrogena.com)].
        - **Maske 🛁**: Haftada 1-2 kez nemlendirici maske. [Önerilen Ürün: **Origins Drink Up Intensive Mask** – [Link](https://www.origins.com)].

        **Bitkisel Çözümler 🌿**:
        - **Aloe Vera Jel**: Ciltteki tahrişi yatıştırabilir.
        - **Çay Ağacı Yağı**: Sivilce için çok faydalıdır, ama cildini yakmaması için seyreltmen gerekebilir.
        - **Yeşil Çay**: Antiinflamatuar özelliklere sahip olup ciltteki kızarıklığı azaltır.

        --- 

        🚨 **3. Cilt Risk Durumu ⚠️**  
        - Eğer görselde şüpheli bir durum varsa, örneğin **koyu, aniden büyüyen lekeler veya kanama** varsa **"Mutlaka bir dermatolog ile görüşmelisin"** diye uyarı yap.
        - Eğer ciddi bir sorun yoksa, sadece **"Hayır, ciltte ciddi bir risk görünmüyor. Ancak düzenli bakım yapmak cildin sağlığı için önemli!"** diyebilirsin.

        --- 

        📝 **Geri Bildirim ve Motivasyon 💪**  
        Kullanıcıya, yaptığı cilt bakımı rutinini olumlu bir şekilde değerlendirdiğinde daha iyi bir deneyim sun. Örneğin:  
        - **"Cildin çok güzel görünüyor! Sadece birkaç ufak dokunuşla daha da sağlıklı ve pürüzsüz hale gelebilir."**

        💬 **Samimi ve Akıcı Bir Dille Konuş**  
        Tıbbi terimleri kullanıcıya **açık ve anlaşılır bir şekilde** açıklayarak kullan, ama hiçbir zaman sıkıcı olmadan. Kullanıcıyı rahatsız etmeyen bir dilde, bilgi dolu ama aynı zamanda rahatlatıcı bir geri bildirim sağla.

        --- 

        🎨 **Ton ve Görsel Estetik**:
        - Konuşmalarını **emoji’lerle** destekle. Örneğin: **🌞** Güneş kremi, **🧴** Temizleyici, **💆‍♀️** Gece kremi gibi.
        - Anlatımında **renkli ve dikkat çekici formatlar** kullan (örneğin, bakımları madde madde sıralarken her öneriyi yeni bir satıra koy, her maddeyi net bir şekilde belirgin hale getir).
        - Kullanıcıya görsel değil ama **uygun ürünler ve linkler** sunarak **işlevsel bir deneyim** sağla.

        --- 
        **Not**: Yukarıdaki bilgiler yalnızca yönlendirme amaçlıdır. Cilt tipinize uygun ürünleri kullanmadan önce mutlaka bir uzmana danışın.
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
@app.post("/upload-photo/")
async def upload_photo(file: UploadFile = File(...)):
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

