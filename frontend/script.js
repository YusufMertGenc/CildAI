document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("uploadForm");
  const resultBox = document.getElementById("result");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById("imageInput");
    const file = fileInput.files[0];
    const notes = document.getElementById("userNotes").value;

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("notes", notes);

    resultBox.innerHTML = `
      <div class="loading-container">
        <div class="loader"></div>
        <p>Analiz yapılıyor...</p>
      </div>
    `;

    try {
      const response = await fetch("http://127.0.0.1:8000/analyze-skin", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      // İsteğe bağlı, parçalayarak gösterim:
      const lines = (data.advice || "").split(/1\.|2\.|3\./);

      resultBox.innerHTML = `
        <div class="result-box">
          <h2>🩺 Analiz Sonucu</h2>
          <h3>1. Tespit</h3><p>${lines[1]?.trim()}</p>
          <h3>2. Çözüm</h3><p>${lines[2]?.trim()}</p>
          <h3>3. Risk Durumu</h3><p>${lines[3]?.trim()}</p>
        </div>
      `;
    } catch (err) {
      resultBox.textContent = "Sunucuya ulaşılamadı.";
    }
  });
});
