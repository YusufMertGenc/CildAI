document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("uploadForm");
  const fileInput = document.getElementById("imageInput");
  const resultBox = document.getElementById("result");

  // Fotoğraf yüklendiğinde kullanıcıya bilgi ver
  fileInput.addEventListener("change", () => {
    const label = document.querySelector(".custom-file-upload");
    if (fileInput.files.length > 0) {
      label.textContent = `✔ ${fileInput.files[0].name} yüklendi`;
    } else {
      label.textContent = "+ Fotoğraf Seç";
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = fileInput.files[0];
    const notes = document.getElementById("userNotes").value;

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("notes", notes);

    resultBox.innerHTML = `
      <div class="loading-container">
        <p>⏳ Analiz yapılıyor...</p>
      </div>
    `;

    try {
      const response = await fetch("http://127.0.0.1:8000/analyze-skin", {
        method: "POST",
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
            <button onclick="window.location.reload()" style="padding: 0.7rem 1.5rem; background:#b23a48; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">Yeni Analiz Yap</button>
          </div>
        </div>
      `;
    } catch (err) {
      resultBox.innerHTML = "<p>⚠️ Sunucuya ulaşılamadı. Lütfen tekrar deneyin.</p>";
    }
  });
});
// Şifre değiştirme sayfasına git
function goToChangePassword() {
    window.location.href = 'change-password.html';
}

document.addEventListener("DOMContentLoaded", function () {
  const dropdownBtn = document.getElementById("userDropdownBtn");
  const dropdown = dropdownBtn?.closest(".dropdown");

  // username varsa göster
  const storedUsername = localStorage.getItem("username");
  if (storedUsername && dropdownBtn) {
    dropdownBtn.innerText = storedUsername + " ⌄";
  }

  // tıklayınca menü aç-kapa
  dropdownBtn?.addEventListener("click", function (event) {
    event.stopPropagation();
    dropdown?.classList.toggle("show");
  });

  // başka yere tıklayınca menü kapanır
  window.addEventListener("click", function () {
    dropdown?.classList.remove("show");
  });
});

function logout() {
  localStorage.clear();
  window.location.href = "auth.html";
}

async function showUserGreeting() {
  const token = localStorage.getItem("access_token");
  if (!token) return;

  try {
    const response = await fetch("http://localhost:8000/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const user = await response.json();
      const dropdownBtn = document.getElementById("userDropdownBtn");
      const dropdown = document.querySelector(".dropdown");
      const navBtn = document.getElementById("navLoginBtn");

      if (user.first_name && dropdownBtn && dropdown) {
        dropdownBtn.textContent = `${user.first_name} ⌄`;
        dropdown.style.display = "block";
      }

      if (navBtn) {
        navBtn.style.display = "none";
      }

    } else {
      localStorage.removeItem("access_token");
    }
  } catch (error) {
    console.error("Kullanıcı bilgisi alınamadı:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  showUserGreeting();

  const token = localStorage.getItem("access_token");
  const loginBtn = document.getElementById("navLoginBtn");
  const logoutBtn = document.getElementById("navLogoutBtn");
  const dropdown = document.querySelector(".dropdown");

  if (token) {
    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (dropdown) dropdown.style.display = "block";
  } else {
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (dropdown) dropdown.style.display = "none";
  }
});

