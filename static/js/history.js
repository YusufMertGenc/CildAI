import baseURL from './config.js';

async function showUserGreeting() {
    const token = localStorage.getItem("access_token");
    if (!token) {
        window.location.href = "index.html";
        return;
    }

    try {
        const response = await fetch(`${baseURL}/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const user = await response.json();
            const dropdownBtn = document.getElementById("userDropdownBtn");
            if (dropdownBtn) {
                dropdownBtn.textContent = `${user.first_name} ⌄`;
            }
            document.querySelector(".dropdown").style.display = "block";
        } else {
            localStorage.removeItem("access_token");
            window.location.href = "index.html";
        }
    } catch (error) {
        console.error("Kullanıcı verisi alınamadı:", error);
        window.location.href = "index.html";
    }
}

function logout() {
    localStorage.removeItem("access_token");
    toastr.success('Başarıyla çıkış yaptınız.');
    window.location.href = "index.html";
}

const chatHistoryContainer = document.getElementById("chatHistory");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const errorState = document.getElementById("errorState");

document.addEventListener("DOMContentLoaded", () => {
    showUserGreeting();

    const logoutLink = document.getElementById("dropdownLogoutBtn");
    if (logoutLink) {
        logoutLink.addEventListener("click", function (e) {
            e.preventDefault();
            logout();
        });
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
        window.location.replace("index.html");
        return;
    }

    fetchChatHistory(`${baseURL}/chat/history`, token);
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

document.getElementById("filterBtn").addEventListener("click", async () => {
    const dateFilter = document.getElementById("dateFilter").value;
    const searchQuery = document.getElementById("searchInput").value.trim().toLowerCase();
    const token = localStorage.getItem("access_token");

    if (!token) {
        alert("Giriş yapmanız gerekiyor.");
        window.location.href = "index.html";
        return;
    }

    let url = `${baseURL}/chat/history`;
    if (dateFilter === "7") url = `${baseURL}/chat/history/last_seven_day`;
    else if (dateFilter === "30") url = `${baseURL}/chat/history/last_month`;
    else if (dateFilter === "90") url = `${baseURL}/chat/history/last_three_month`;

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
    chatHistoryContainer.innerHTML = "";
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
            </div>
        `;

        // PDF Formu dinamik oluşturuluyor
        const form = document.createElement("form");
        form.method = "POST";
        form.action = `${baseURL}/skin-analysis/generate-pdf/`;
        form.target = "_blank";

        const hiddenInput = document.createElement("input");
        hiddenInput.type = "hidden";
        hiddenInput.name = "advice";
        hiddenInput.value = escapedResponse;

        const submitButton = document.createElement("button");
        submitButton.type = "submit";
        submitButton.className = "download-pdf-btn";
        submitButton.textContent = "📄 PDF İndir";

        form.appendChild(hiddenInput);
        form.appendChild(submitButton);

        chatItem.querySelector(".chat-content").appendChild(form);

        const mailBtn = document.createElement("button");
        mailBtn.id = sendButtonId;
        mailBtn.className = "gmail-send-btn";
        mailBtn.textContent = "📧 Mail Gönder";

        chatItem.querySelector(".chat-content").appendChild(mailBtn);

        chatHistoryContainer.appendChild(chatItem);

        document.getElementById(sendButtonId).addEventListener("click", async () => {
            const token = localStorage.getItem("access_token");

            try {
                const res = await fetch(`${baseURL}/chat/send_history_mail`, {
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

document.getElementById("send-all-history-mail").addEventListener("click", async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
        alert("Lütfen giriş yapınız.");
        return;
    }

    try {
        const response = await fetch(`${baseURL}/chat/send_all_history_mail`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({})
        });

        const result = await response.json();

        if (response.ok) {
            toastr.success(result.message || "Tüm geçmiş başarıyla gönderildi.");
        } else {
            toastr.error(result.detail || "E-posta gönderilirken hata oluştu.");
        }
    } catch (error) {
        console.error("E-posta gönderme hatası:", error);
        toastr.error("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
});

function truncateText(text, maxLength) {
    if (!text || typeof text !== "string") return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

const searchInput = document.getElementById("searchInput");

let searchTimeout = null; // debounce için

searchInput.addEventListener("input", () => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        performSearch(searchInput.value.trim());
    }, 500);
});

async function performSearch(query) {
    const token = localStorage.getItem("access_token");
    if (!token) {
        window.location.href = "index.html";
        return;
    }

    if (!query) {
        fetchChatHistory(`${baseURL}/chat/history`, token);
        return;
    }

    loadingState.style.display = "block";
    emptyState.style.display = "none";
    errorState.style.display = "none";
    chatHistoryContainer.innerHTML = "";

    try {
        const response = await fetch(`${baseURL}/chat/history/search?q=${encodeURIComponent(query)}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) throw new Error("Arama sonuçları alınamadı");

        const data = await response.json();

        if (data.length === 0) {
            emptyState.style.display = "block";
            chatHistoryContainer.innerHTML = "";
        } else {
            displayHighlightedResults(data, query);
        }
    } catch (error) {
        console.error("Arama sırasında hata oluştu:", error);
        errorState.style.display = "block";
    } finally {
        loadingState.style.display = "none";
    }
}

function highlightQuery(text, query) {
    if (!text || !query) return text;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedQuery})`, "gi");
    return text.replace(regex, `<span class="strikethrough-highlight">$1</span>`);
}

function displayHighlightedResults(results, query) {
    chatHistoryContainer.innerHTML = "";
    results.forEach(item => {
        const chatItem = document.createElement("div");
        chatItem.className = "chat-item";

        const highlightedPrompt = highlightQuery(item.prompt ?? "", query);
        const highlightedResponse = highlightQuery(item.response ?? "", query);
        const date = item.timestamp ?? "";

        chatItem.innerHTML = `
            <div class="chat-meta">
                <div class="chat-date">${date}</div>
            </div>
            <div class="chat-content">
                <div class="chat-prompt"><strong>Prompt:</strong><br>${highlightedPrompt}</div>
                <div class="chat-response"><strong>Cevap:</strong><br>${highlightedResponse}</div>
            </div>
        `;

        chatHistoryContainer.appendChild(chatItem);
    });
}

window.highlightQuery = highlightQuery;
window.displayHighlightedResults = displayHighlightedResults;