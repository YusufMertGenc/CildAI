const chatHistoryContainer = document.getElementById("chatHistory");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const errorState = document.getElementById("errorState");

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
        window.location.replace("index.html");
        return;
    }

    fetchChatHistory("http://127.0.0.1:8000/chat/history", token);
});

function fetchChatHistory(url, token) {
    loadingState.style.display = "block";
    emptyState.style.display = "none";
    errorState.style.display = "none";
    chatHistoryContainer.innerHTML = "";

    fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    })
        .then(response => {
            if (!response.ok) throw new Error("Veri alınamadı");
            return response.json();
        })
        .then(data => {
            displayResults(data);
        })
        .catch(error => {
            console.error("Veri alınırken hata oluştu:", error);
            loadingState.style.display = "none";
            errorState.style.display = "block";
        });
}


document.getElementById("send-history-mail").addEventListener("click", async () => {
    try {
        const token = localStorage.getItem("access_token");

        const response = await fetch("http://127.0.0.1:8000/chat/send_history_mail", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();

        if (response.ok) {
            toastr.success(result.message || "Geçmiş başarıyla e-posta ile gönderildi.");
        } else {
            toastr.error(result.message || "E-posta gönderilirken bir hata oluştu.");
        }
    } catch (error) {
        console.error("E-posta gönderme hatası:", error);
        toastr.error("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
});

document.getElementById("filterBtn").addEventListener("click", async () => {
    const dateFilter = document.getElementById("dateFilter").value;
    const searchQuery = document.getElementById("searchInput").value.trim().toLowerCase();
    const token = localStorage.getItem("access_token");

    if (!token) {
        alert("Giriş yapmanız gerekiyor.");
        window.location.href = "index.html";
        return;
    }

    let url = "http://127.0.0.1:8000/chat/history";
    if (dateFilter === "7") url = "http://127.0.0.1:8000/chat/history/last_seven_day";
    else if (dateFilter === "30") url = "http://127.0.0.1:8000/chat/history/last_month";
    else if (dateFilter === "90") url = "http://127.0.0.1:8000/chat/history/last_tree_month";

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });


        const data = await response.json();

        let filteredResults = data;
        if (searchQuery) {
            filteredResults = data.filter(entry =>
                entry.message.toLowerCase().includes(searchQuery) ||
                (entry.date && entry.date.toLowerCase().includes(searchQuery))
            );
        }

        displayResults(filteredResults);

    } catch (error) {
        console.error("Veri alınırken hata oluştu:", error);
    }
});

function displayResults(results) {
    chatHistoryContainer.innerHTML = ""; // Önceki içeriği temizle
    loadingState.style.display = "none";
    emptyState.style.display = "none";
    errorState.style.display = "none";

    if (results.length === 0) {
        emptyState.style.display = "block";
        return;
    }

    results.forEach(item => {
        const chatItem = document.createElement("div");
        chatItem.className = "chat-item";

        const prompt = item.prompt ?? item.message ?? "";
        const response = item.response ?? "";
        const date = item.timestamp ?? item.date ?? "";

        const escapedResponse = response
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        const sendButtonId = `send-btn-${Math.random().toString(36).substring(2, 10)}`;

        chatItem.innerHTML = `
            <div class="chat-meta">
                <div class="chat-date">${date}</div>
            </div>
            <div class="chat-content">
                <div class="chat-prompt"><strong>Prompt:</strong><br>${truncateText(prompt, 3000)}</div>
                <div class="chat-response"><strong>Cevap:</strong><br>${truncateText(response, 3000)}</div>
                
                <form method="POST" action="http://127.0.0.1:8000/skin-analysis/generate-pdf/" target="_blank">
                    <input type="hidden" name="advice" value="${escapedResponse}">
                    <button type="submit" class="download-pdf-btn">📄 PDF İndir</button>
                </form>
                <button id="${sendButtonId}" class="gmail-send-btn">📧 Mail Gönder</button>
            </div>
        `;

        chatHistoryContainer.appendChild(chatItem);

        document.getElementById(sendButtonId).addEventListener("click", async () => {
            const token = localStorage.getItem("access_token");

            try {
                const res = await fetch("http://127.0.0.1:8000/chat/send_history_mail", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify([
                        {
                            prompt: prompt,
                            response: response,
                            timestamp: date
                        }
                    ])
                });

                const result = await res.json();

                if (res.ok) {
                    toastr.success(result.message || "E-posta başarıyla gönderildi.");
                } else {
                    toastr.error(result.detail || "E-posta gönderilirken hata oluştu.");
                }
            } catch (err) {
                console.error("E-posta gönderme hatası:", err);
                toastr.error("E-posta gönderilirken bir hata oluştu.");
            }
        });
    });
}


function truncateText(text, maxLength) {
    if (!text || typeof text !== "string") return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

