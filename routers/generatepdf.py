from fastapi.responses import StreamingResponse, JSONResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import io
import textwrap
import re
import unicodedata
import os


current_file_dir = os.path.dirname(os.path.abspath(__file__))

project_root_dir = os.path.join(current_file_dir, '..')

fonts_dir = os.path.join(project_root_dir, 'fonts')


images_dir = os.path.join(project_root_dir, 'static')
logo_path = os.path.join(images_dir, "images")
last_path = os.path.join(logo_path, "logo.jpg")

try:
    pdfmetrics.registerFont(TTFont("DejaVuSans", os.path.join(fonts_dir, "DejaVuSans.ttf")))
    pdfmetrics.registerFont(TTFont("DejaVuSans-Bold", os.path.join(fonts_dir, "DejaVuSans-Bold.ttf")))
except Exception as e:
    print(f"Font kaydı sırasında hata oluştu: {e}")
    print(f"Fontların arandığı dizin: {fonts_dir}")

def generate_analysis_pdf(advice: str):
    try:
        def clean_text_for_pdf(text):
            emoji_pattern = re.compile(
                "["                                  
                u"\U0001F600-\U0001F64F" # emoticons
                u"\U0001F300-\U0001F5FF" # symbols & pictographs
                u"\U0001F680-\U0001F6FF" # transport & map symbols
                u"\U0001F1E0-\U0001F1FF" # flags (iOS)
                u"\u200b\u200c\u200d\uFEFF\u00a0" # Zero width spaces, etc.
                "]+",
                flags=re.UNICODE
            )
            return unicodedata.normalize("NFKC", emoji_pattern.sub('', text))

        cleaned_text = clean_text_for_pdf(advice)

        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)

        width, height = letter
        margin = 1 * inch

        if os.path.exists(last_path):
            logo_width = 80
            logo_height = 80
            p.drawImage(last_path, (width - logo_width) / 2, height - inch - 20, width=logo_width, height=logo_height, mask='auto')
        else:
            print(f"Logo dosyası bulunamadı: {last_path}")


        x = margin
        y = height - inch - 60


        bold_headings = [
            "1. Tespit",
            "2. Çözüm",
            "3. Risk Durumu"
        ]

        lines = cleaned_text.split("\n")
        for line in lines:
            if line.strip() == "":
                y -= 10
                continue

            if line.strip().startswith("---"):
                y -= 20
                continue

            is_bold = any(heading in line for heading in bold_headings)
            font_name = "DejaVuSans-Bold" if is_bold else "DejaVuSans"
            font_size = 13 if is_bold else 11
            wrapped = textwrap.wrap(line, width=95)

            for wrapped_line in wrapped:
                p.setFont(font_name, font_size)
                p.drawString(x, y, "  " + wrapped_line)
                y -= 14

                if y < margin:
                    p.showPage()
                    y = height - margin
                    p.setFont(font_name, font_size)

        p.save()
        buffer.seek(0)

        return StreamingResponse(buffer, media_type="application/pdf", headers={
            "Content-Disposition": "attachment; filename=analiz_raporu.pdf"
        })

    except Exception as e:
        print(f"PDF oluşturulurken genel bir hata oluştu: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(content={"error": str(e)}, status_code=500)