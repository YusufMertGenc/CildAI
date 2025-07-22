document.addEventListener("DOMContentLoaded", () => {
    const chatHistoryContainer = document.getElementById("chatHistory");
    const loadingState = document.getElementById("loadingState");
    const emptyState = document.getElementById("emptyState");
    const errorState = document.getElementById("errorState");

    const token = localStorage.getItem("access_token");

    if (!token) {
        showError("Giriş yapmadığınız için konuşmalar görüntülenemiyor.");
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
            chatItem.innerHTML = `
                <div class="chat-meta">
                    <div class="chat-date">${chat.timestamp}</div>
                </div>
                <div class="chat-content">
                    <div class="chat-prompt"><strong>Prompt:</strong><br>${truncateText(chat.prompt, 1000)}</div>
                    <div class="chat-response"><strong>Cevap:</strong><br>${truncateText(chat.response, 1000)}</div>
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
