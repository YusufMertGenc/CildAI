document.addEventListener("DOMContentLoaded", () => {
    const chatHistoryContainer = document.getElementById("chatHistory");
    const loadingState = document.getElementById("loadingState");
    const emptyState = document.getElementById("emptyState");
    const errorState = document.getElementById("errorState");

    const token = localStorage.getItem("access_token");

    if (!token) {
        window.location.replace("index.html")
        return;
    }

    fetch("http://127.0.0.1:8000/chat/history", {
        headers: {
            "Authorization": "Bearer " + token
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Sunucu hatası");
            }
            return response.json();
        })
        .then(data => {
            loadingState.style.display = "none";
            if (data.length === 0) {
                emptyState.style.display = "block";
            } else {
                renderChatHistory(data);
            }
        })
        .catch(error => {
            console.error("Hata:", error);
            loadingState.style.display = "none";
            errorState.style.display = "block";
        });

    function renderChatHistory(chats) {
        chats.forEach(chat => {
            const chatItem = document.createElement("div");
            chatItem.className = "chat-item";

            const escapedResponse = chat.response
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            chatItem.innerHTML = `
                <div class="chat-meta">
                    <div class="chat-date">${chat.timestamp}</div>
                </div>
                <div class="chat-content">
                    <div class="chat-prompt"><strong>Prompt:</strong><br>${truncateText(chat.prompt, 1000)}</div>
                    <div class="chat-response"><strong>Cevap:</strong><br>${truncateText(chat.response, 1000)}</div>
                    <form method="POST" action="http://127.0.0.1:8000/skin-analysis/generate-pdf/" target="_blank">
                    <input type="hidden" name="advice" value="${escapedResponse}">
                    <button type="submit" class="download-pdf-btn">📄 PDF İndir</button>
                </form>
                </div>
            `;
            chatHistoryContainer.appendChild(chatItem);
        });
    }

    function truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
    }

    function showError(message) {
        loadingState.style.display = "none";
        errorState.style.display = "block";
        errorState.querySelector(".error-text").textContent = message;
    }
});

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
