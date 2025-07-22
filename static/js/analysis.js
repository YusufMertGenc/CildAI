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

let stream = null;

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
    const token = localStorage.getItem("access_token");
    if (!token) {
        alert("Lütfen giriş yapınız.");
        return;
    }

    snapshotCanvas.toBlob(async function (blob) {
        console.log("🧪 toBlob sonucu:", blob);

        if (!blob || blob.size === 0) {
            alert("Görsel işlenemedi. Lütfen tekrar deneyin.");
            return;
        }

        const formData = new FormData();
        formData.append("file", blob, "photo.png");
        formData.append("notes", userNotes);

        resultBox.innerHTML = `⏳ Analiz ediliyor...`;

        try {
            const response = await fetch("http://127.0.0.1:8000/skin-analysis/analyze-skin", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + token
                },
                body: formData,
            });

            const data = await response.json();
            const lines = (data.advice || "").split(/1\.|2\.|3\./);

            resultBox.innerHTML = `
      <div class="result-box">
    <h2>🩺 Analiz Sonucu</h2>
    <h3>1. Tespit</h3><p>${lines[1]?.trim()}</p>
    <h3>2. Çözüm</h3><p>${lines[2]?.trim()}</p>
    <h3>3. Risk Durumu</h3><p>${lines[3]?.trim()}</p>
    <div style="text-align:center; margin-top: 2rem;">
      <button onclick="window.location.reload()" style="padding: 0.7rem 1.5rem; background:#b23a48; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">
        🔁 Yeni Analiz Yap
      </button>
    </div>
  </div>
`;

        } catch (error) {
            console.log("❌ Hata:", error);
            resultBox.innerHTML = `<p>❌ Hata oluştu: ${error.message}</p>`;
        }
    }, "image/png");
});