import baseURL from "./config.js";

const startCameraButton = document.getElementById("start-camera");
const cameraDiv = document.getElementById("camera");
const videoElement = document.getElementById("video");
const snapButton = document.getElementById("snap");
const snapshotCanvas = document.getElementById("snapshot");
const context = snapshotCanvas.getContext("2d");
const photoPreview = document.getElementById("photo-preview");
const removePhotoButton = document.getElementById("remove-photo");
const imageInput = document.getElementById("imageInput");
const uploadForm = document.getElementById("uploadForm");
const resultBox = document.getElementById("result");
const token = localStorage.getItem("access_token");
let stream = null;
let userLocation = null;

document.addEventListener('DOMContentLoaded', function () {
    if (!token) {
        window.location.replace("index.html");
        return;
    }
    requestLocationPermission();
});

function showLocationStatus(message, type) {
    const statusDiv = document.createElement('div');
    statusDiv.innerHTML = message;
    statusDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        max-width: 300px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        ${type === 'success' ?
        'background: #e6fffa; color: #234e52; border: 1px solid #4fd1c7;' :
        'background: #fff5f5; color: #c53030; border: 1px solid #feb2b2;'}
    `;
    document.body.appendChild(statusDiv);
    setTimeout(() => {
        statusDiv.style.transition = 'opacity 0.5s ease-out';
        statusDiv.style.opacity = '0';
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.parentNode.removeChild(statusDiv);
            }
        }, 500);
    }, 5000);
}

function requestLocationPermission() {
    console.log("🔍 Konum izni isteniyor...");
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                userLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                console.log("✅ Konum başarıyla alındı:", userLocation);
                showLocationStatus("📍 Konum bilginiz alındı (acil durumlarda hastane önerisi için)", "success");
            },
            function (error) {
                let errorMsg = "";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg = "Konum izni reddedildi";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMsg = "Konum bilgisi mevcut değil";
                        break;
                    case error.TIMEOUT:
                        errorMsg = "Konum alma zaman aşımı";
                        break;
                    default:
                        errorMsg = "Bilinmeyen konum hatası";
                }
                showLocationStatus(`⚠️ ${errorMsg}. Acil durumlarda hastane önerisi yapılamayacak.`, "warning");
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    } else {
        console.log("❌ Geolocation desteklenmiyor");
        showLocationStatus("⚠️ Tarayıcınız konum özelliğini desteklemiyor", "warning");
    }
}

startCameraButton.addEventListener("click", function () {
    cameraDiv.style.display = "flex";
    photoPreview.style.display = "none";
    imageInput.value = null;
    startCamera();
    startCameraButton.style.display = "none";
});

function startCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({video: true}).then(function (s) {
            stream = s;
            videoElement.srcObject = stream;
            videoElement.play();
        }).catch(function (error) {
            console.error("Kamera başlatılamadı: ", error);
            alert("Kamera erişimi reddedildi veya cihaz bulunamadı.");
            resetCameraAndFileInput();
        });
    } else {
        alert("Tarayıcınız kamera desteği sunmuyor.");
        resetCameraAndFileInput();
    }
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        videoElement.srcObject = null;
        stream = null;
    }
}

snapButton.addEventListener("click", function () {
    context.clearRect(0, 0, snapshotCanvas.width, snapshotCanvas.height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, snapshotCanvas.width, snapshotCanvas.height);
    context.drawImage(videoElement, 0, 0, snapshotCanvas.width, snapshotCanvas.height);
    snapshotCanvas.style.display = "block";
    photoPreview.style.display = "flex";
    cameraDiv.style.display = "none";
    stopCamera();
    console.log("📸 Fotoğraf çekildi ve canvas'a çizildi.");
});

removePhotoButton.addEventListener("click", function () {
    snapshotCanvas.style.display = "none";
    photoPreview.style.display = "none";
    resetCameraAndFileInput();
});

function resetCameraAndFileInput() {
    stopCamera();
    startCameraButton.style.display = "inline-flex";
    imageInput.value = null;
    cameraDiv.style.display = "none";
}

imageInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
        stopCamera();
        cameraDiv.style.display = "none";
        startCameraButton.style.display = "none";
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                context.clearRect(0, 0, snapshotCanvas.width, snapshotCanvas.height);
                const aspectRatio = img.width / img.height;
                let drawWidth = snapshotCanvas.width;
                let drawHeight = snapshotCanvas.height;
                if (snapshotCanvas.width / snapshotCanvas.height > aspectRatio) {
                    drawWidth = snapshotCanvas.height * aspectRatio;
                } else {
                    drawHeight = snapshotCanvas.width / aspectRatio;
                }
                const offsetX = (snapshotCanvas.width - drawWidth) / 2;
                const offsetY = (snapshotCanvas.height - drawHeight) / 2;
                context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                snapshotCanvas.style.display = "block";
                photoPreview.style.display = "flex";
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        resetCameraAndFileInput();
    }
});

uploadForm.addEventListener("submit", function (e) {
    e.preventDefault();
    console.log("🚀 Form gönderildi!");

    const userNotes = document.getElementById("userNotes").value;

    const isCanvasEmpty = (() => {
        const blank = document.createElement("canvas");
        blank.width = snapshotCanvas.width;
        blank.height = snapshotCanvas.height;
        return snapshotCanvas.toDataURL() === blank.toDataURL();
    })();

    if (isCanvasEmpty) {
        alert("Lütfen analiz için geçerli bir fotoğraf çekin veya yükleyin.");
        return;
    }

    snapshotCanvas.toBlob(async function (blob) {
        if (!blob || blob.size === 0) {
            alert("Görsel işlenemedi. Lütfen tekrar deneyin.");
            return;
        }

        const formData = new FormData();
        formData.append("file", blob, "photo.png");
        formData.append("notes", userNotes);

        if (userLocation) {
            console.log("📍 Konum bilgisi gönderiliyor:", userLocation);
            formData.append("latitude", userLocation.latitude);
            formData.append("longitude", userLocation.longitude);
        } else {
            console.log("❌ Konum bilgisi yok! Hastane önerisi yapılamayacak.");
        }

        resultBox.innerHTML = `⏳ Analiz ediliyor...`;

        try {
            const response = await fetch(`${baseURL}/skin-analysis/analyze-skin`, {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + token
                },
                body: formData,
            });

            const data = await response.json();
            const hasRisk = data.has_risk || false;
            const advice = data.advice || "";

            const riskStyle = hasRisk ?
                'background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%); border: 3px solid #e53e3e;' :
                'background: white; border: 2px solid #e2e8f0;';

            resultBox.innerHTML = `
                <div class="result-box" style="${riskStyle} padding: 1.5rem; border-radius: 12px; margin: 1rem 0;">
                    <h2 style="text-align: center; color: ${hasRisk ? '#c53030' : '#2d3748'}; margin-bottom: 1rem;">
                        ${hasRisk ? '🚨 ACİL DİKKAT GEREKTİREN DURUM!' : '🩺 Analiz Sonucu'}
                    </h2>

                    <div style="background: ${hasRisk ? 'white' : '#f7fafc'}; padding: 1.5rem; border-radius: 8px; margin: 1rem 0; white-space: pre-wrap; line-height: 1.6;">
                        ${advice}
                    </div>

                    ${hasRisk ? `
                        <div style="background: #fff5f5; border: 2px solid #fed7d7; border-radius: 8px; padding: 1rem; margin: 1rem 0; text-align: center;">
                            <h4 style="color: #c53030; margin-bottom: 0.5rem;">🚨 ACİL DURUM REHBERİ</h4>
                            <p style="color: #742a2a; margin: 0.3rem 0;">• Derhal bir dermatoloji uzmanına başvurun</p>
                            <p style="color: #742a2a; margin: 0.3rem 0;">• Acil durumda 112'yi arayın</p>
                            <a href="tel:112" style="display: inline-block; background: #e53e3e; color: white; padding: 0.5rem 1rem; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 0.5rem;">📞 112'yi Ara</a>
                        </div>
                    ` : ''}

                    <div style="text-align:center; margin-top: 2rem;">
                        <button onclick="window.location.reload()" style="padding: 0.7rem 1.5rem; background:#b23a48; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; margin: 0 0.5rem;">
                            🔁 Yeni Analiz Yap
                        </button>
                        <button id="downloadPdfBtn" class="action-button primary" style="padding: 0.7rem 1.5rem; background:#4299e1; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; margin: 0 0.5rem;">
                            📄 PDF Olarak İndir
                        </button>
                        <button id="send-history-mail" class="action-button secondary" style="padding: 0.7rem 1.5rem; background:#805ad5; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; margin: 0 0.5rem;">
                            ✉️ Geçmişi Mail Gönder
                        </button>
                    </div>
                </div>
            `;

            if (hasRisk) {
                resultBox.scrollIntoView({behavior: 'smooth'});
            }

            // ✅ Mail butonunu görünür yap (DOM yeniden yüklendiği için tekrar alınmalı)
            const mailBtnNow = document.getElementById("send-history-mail");
            if (mailBtnNow) {
                mailBtnNow.style.display = "inline-flex";
            }

        } catch (error) {
            console.log("❌ Hata:", error);
            resultBox.innerHTML = `<p>❌ Hata oluştu: ${error.message}</p>`;
        }
    }, "image/png");
});

document.addEventListener("click", function (e) {
    if (e.target && e.target.id === "downloadPdfBtn") {
        const adviceText = resultBox.innerText;
        const formData = new FormData();
        formData.append("advice", adviceText);

        fetch(`${baseURL}/skin-analysis/generate-pdf/`, {
            method: "POST",
            body: formData
        })
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "analiz_raporu.pdf";
                document.body.appendChild(a);
                a.click();
                a.remove();
            })
            .catch(err => alert("PDF oluşturulamadı: " + err.message));
    }
});

function getHistoryDataForSend() {
    const adviceText = resultBox.innerText.trim();
    const promptText = document.getElementById("userNotes").value.trim() || "Cilt Analizi";

    if (!adviceText) return [];

    return [{
        prompt: promptText,
        response: adviceText,
        timestamp: new Date().toISOString()
    }];
}


document.addEventListener("click", async function (e) {
    if (e.target && e.target.id === "send-history-mail") {
        try {
            const token = localStorage.getItem("access_token");

            const historyData = getHistoryDataForSend();

            if (!historyData.length) {
                alert("Gönderilecek geçmiş bulunamadı.");
                return;
            }

            const response = await fetch(`${baseURL}/chat/send_history_mail`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(historyData)
            });

            const result = await response.json();

            if (response.ok) {
                toastr.success(result.message || "Analiz sonucunuz başarıyla e-posta ile gönderildi.");
            } else {
                toastr.error(result.detail || "E-posta gönderilirken bir hata oluştu.");
            }
        } catch (error) {
            console.error("E-posta gönderme hatası:", error);
            toastr.error("Bir hata oluştu. Lütfen tekrar deneyin.");
        }
    }
});



