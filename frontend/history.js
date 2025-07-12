// API Base URL
const API_BASE_URL = 'http://localhost:8000'; // FastAPI backend URL'iniz

// GEÇİCİ TEST İÇİN - Authentication'ı atla
const SKIP_AUTH_FOR_TESTING = true; // Bu değeri false yapınca normal auth çalışır

let allChats = []; // Tüm konuşmaları cache'de tutmak için
let filteredChats = []; // Filtrelenmiş konuşmalar
let currentUser = null; // Mevcut kullanıcı bilgileri

// DOM Elements
const chatHistory = document.getElementById('chatHistory');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const errorState = document.getElementById('errorState');
const searchInput = document.getElementById('searchInput');
const dateFilter = document.getElementById('dateFilter');
const topicFilter = document.getElementById('topicFilter');
const filterBtn = document.getElementById('filterBtn');
const retryBtn = document.getElementById('retryBtn');

// Sayfa yüklendiğinde çalışacak fonksiyon
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

// Sayfa başlatma
async function initializePage() {
    try {
        // Kullanıcı girişi kontrolü - TEST İÇİN GEÇİCİ OLARAK ATLANMIŞ
        if (!SKIP_AUTH_FOR_TESTING) {
            await checkUserAuthentication();
        } else {
            // Test için sahte kullanıcı oluştur
            currentUser = { first_name: 'Test', last_name: 'User' };
            updateUserInterface();
        }

        showLoadingState();
        await loadChatHistory();
        setupEventListeners();
    } catch (error) {
        console.error('Sayfa başlatılırken hata:', error);
        showErrorState();
    }
}

// Kullanıcı kimlik doğrulama kontrolü
async function checkUserAuthentication() {
    const token = localStorage.getItem('access_token');

    if (!token) {
        // Token yoksa giriş sayfasına yönlendir
        window.location.href = 'auth.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            currentUser = await response.json();
            updateUserInterface();
        } else {
            // Token geçersizse localStorage'ı temizle ve giriş sayfasına yönlendir
            localStorage.removeItem('access_token');
            window.location.href = 'auth.html';
        }
    } catch (error) {
        console.error('Kullanıcı doğrulama hatası:', error);
        localStorage.removeItem('access_token');
        window.location.href = 'auth.html';
    }
}

// Kullanıcı arayüzünü güncelle
function updateUserInterface() {
    const dropdownBtn = document.getElementById('userDropdownBtn');
    const dropdown = document.querySelector('.dropdown');
    const navBtn = document.getElementById('navLoginBtn');

    if (currentUser && dropdownBtn && dropdown) {
        dropdownBtn.textContent = `${currentUser.first_name} ⌄`;
        dropdown.style.display = 'block';

        // Dropdown event listener'ı ekle
        dropdownBtn.addEventListener('click', function(event) {
            event.stopPropagation();
            dropdown.classList.toggle('show');
        });

        // Başka yere tıklayınca dropdown'ı kapat
        window.addEventListener('click', function() {
            dropdown.classList.remove('show');
        });
    }

    if (navBtn) {
        navBtn.style.display = 'none';
    }
}

// Event listener'ları kurma
function setupEventListeners() {
    // Filtre butonları
    filterBtn.addEventListener('click', handleFilter);
    retryBtn.addEventListener('click', initializePage);

    // Gerçek zamanlı arama
    searchInput.addEventListener('input', handleSearch);

    // Filtre değişiklikleri
    dateFilter.addEventListener('change', handleFilter);
    topicFilter.addEventListener('change', handleFilter);

    // Navbar scroll efekti
    window.addEventListener('scroll', handleNavbarScroll);
}

// Konuşma geçmişini API'den yükleme
async function loadChatHistory() {
    try {
        const token = localStorage.getItem('access_token');

        // Gerçek API endpoint'i
        const response = await fetch(`${API_BASE_URL}/chat/history`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Konuşma geçmişi yüklenemedi');
        }

        const data = await response.json();
        allChats = data.chats || [];

        filteredChats = [...allChats];
        renderChatHistory(filteredChats);
        hideLoadingState();

    } catch (error) {
        console.error('Konuşmalar yüklenirken hata:', error);

        // Hata durumunda örnek veri göster (geliştirme için)
        if (SKIP_AUTH_FOR_TESTING) {
            console.log('API hatası - örnek veri kullanılıyor');
            allChats = getExampleChats();
            filteredChats = [...allChats];
            renderChatHistory(filteredChats);
            hideLoadingState();
        } else {
            showErrorState();
        }
    }
}

// Örnek veri - gerçek uygulamada kaldırılacak
function getExampleChats() {
    return [
        {
            id: "chat_123",
            title: "Yağlı Cilt Analizi ve Bakım Önerileri",
            created_at: "2025-01-12T14:30:00Z",
            category: "analysis",
            status: "active",
            messages: [
                {
                    role: "user",
                    content: "Merhaba, cildimde aşırı yağlanma problemi var. Özellikle T bölgemde çok fazla yağ var ve sık sık sivilce çıkıyor. Ne yapabilirim?",
                    timestamp: "2025-01-12T14:30:00Z"
                },
                {
                    role: "assistant",
                    content: "Merhaba! Tanımladığınız belirtiler yağlı cilt tipine işaret ediyor. Size özel bir bakım rutini hazırlayabilirim. Öncelikle cilt fotoğrafınızı analiz etmemiz gerekiyor.",
                    timestamp: "2025-01-12T14:31:00Z"
                },
                {
                    role: "user",
                    content: "Fotoğrafımı yükledim. Analiz sonuçlarını merak ediyorum.",
                    timestamp: "2025-01-12T14:35:00Z"
                }
            ]
        },
        {
            id: "chat_124",
            title: "Göz Altı Morlukları ve Bakım",
            created_at: "2025-01-11T16:45:00Z",
            category: "problems",
            status: "completed",
            messages: [
                {
                    role: "user",
                    content: "Göz altlarımda koyu halkalar var ve çok yorgun görünüyorum. Hangi ürünleri kullanmalıyım?",
                    timestamp: "2025-01-11T16:45:00Z"
                },
                {
                    role: "assistant",
                    content: "Göz altı morlukları genellikle genetik faktörler, uykusuzluk veya yaşlanma nedeniyle oluşur. Size vitamin C serumu, retinol içerikli göz kremi ve güneş koruyucu kullanmanızı öneriyorum.",
                    timestamp: "2025-01-11T16:46:00Z"
                }
            ]
        },
        {
            id: "chat_125",
            title: "Kuru Cilt Bakımı ve Nemlendirme",
            created_at: "2025-01-09T10:20:00Z",
            category: "routine",
            status: "completed",
            messages: [
                {
                    role: "user",
                    content: "Cildim çok kuru ve sık sık pullanıyor. Özellikle kış aylarında durum daha da kötüleşiyor.",
                    timestamp: "2025-01-09T10:20:00Z"
                },
                {
                    role: "assistant",
                    content: "Kuru cilt bakımında en önemli nokta düzenli nemlendirme. Hyaluronik asit, ceramide ve gliserin içeren ürünler cildiniz için idealdir.",
                    timestamp: "2025-01-09T10:21:00Z"
                }
            ]
        }
    ];
}

// Konuşmaları ekrana render etme
function renderChatHistory(chats) {
    if (chats.length === 0) {
        showEmptyState();
        return;
    }

    hideEmptyState();

    chatHistory.innerHTML = '';

    chats.forEach((chat, index) => {
        const chatElement = createChatElement(chat, index);
        chatHistory.appendChild(chatElement);
    });
}

// Tek konuşma elemanı oluşturma
function createChatElement(chat, index) {
    const chatDiv = document.createElement('div');
    chatDiv.className = 'chat-session';
    chatDiv.style.animationDelay = `${index * 0.1}s`;
    chatDiv.dataset.chatId = chat.id;

    // Tarih formatı
    const date = new Date(chat.created_at);
    const formattedDate = formatDate(date);

    // Özet oluştur
    const summary = generateChatSummary(chat);

    // Durum belirle
    const status = determineStatus(chat);

    chatDiv.innerHTML = `
        <div class="chat-header">
            <div class="chat-date">${formattedDate}</div>
            <div class="chat-title">${chat.title}</div>
            <div class="chat-summary">${summary}</div>
            <div class="chat-status ${status.class}">${status.text}</div>
        </div>
        <div class="chat-content">
            ${renderMessages(chat.messages.slice(0, 3))} <!-- İlk 3 mesajı göster -->
            ${chat.messages.length > 3 ? `<div class="more-messages">... ve ${chat.messages.length - 3} mesaj daha</div>` : ''}
        </div>
        <div class="chat-actions">
            <button class="action-btn continue-btn" onclick="continueChat('${chat.id}')">💬 Devam Et</button>
            <button class="action-btn delete-btn" onclick="deleteChat('${chat.id}')">🗑 Sil</button>
        </div>
    `;

    return chatDiv;
}

// Mesajları render etme
function renderMessages(messages) {
    return messages.map(message => {
        const isUser = message.role === 'user';
        const time = formatTime(new Date(message.timestamp));

        return `
            <div class="message ${isUser ? 'user-message' : 'ai-message'}">
                <div class="message-avatar ${isUser ? 'user-avatar' : 'ai-avatar'}">
                    ${isUser ? '👤' : '🤖'}
                </div>
                <div class="message-content">
                    <div class="message-text">
                        ${truncateText(message.content, 150)}
                    </div>
                    <div class="message-time">${time}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Konuşma devam ettirme
async function continueChat(chatId) {
    const btn = document.querySelector(`[data-chat-id="${chatId}"] .continue-btn`);
    btn.innerHTML = '<span class="loading">Yükleniyor</span>';

    try {
        // Konuşma ID'sini localStorage'a kaydet
        localStorage.setItem('currentChatId', chatId);

        // Ana analiz sayfasına yönlendir
        setTimeout(() => {
            window.location.href = 'index.html'; // Ana analiz sayfanızın URL'i
        }, 1000);

    } catch (error) {
        console.error('Konuşma devam ettirilemedi:', error);
        btn.innerHTML = '💬 Devam Et';
        alert('Konuşma yüklenirken bir hata oluştu.');
    }
}

// Konuşma silme
async function deleteChat(chatId) {
    if (!confirm('Bu konuşmayı silmek istediğinizden emin misiniz?')) {
        return;
    }

    try {
        const token = localStorage.getItem('access_token');

        // Gerçek API endpoint'i
        const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Konuşma silinemedi');
        }

        // Başarılı silme işlemi
        const chatElement = document.querySelector(`[data-chat-id="${chatId}"]`);
        if (chatElement) {
            chatElement.style.opacity = '0';
            chatElement.style.transform = 'translateX(-100px)';

            setTimeout(() => {
                chatElement.remove();

                // Konuşmaları cache'den kaldır
                allChats = allChats.filter(chat => chat.id !== chatId);
                filteredChats = filteredChats.filter(chat => chat.id !== chatId);

                // Eğer hiç konuşma kalmadıysa empty state göster
                if (filteredChats.length === 0) {
                    showEmptyState();
                }
            }, 300);
        }

    } catch (error) {
        console.error('Konuşma silinirken hata:', error);

        // Test modunda UI'dan kaldır
        if (SKIP_AUTH_FOR_TESTING) {
            console.log('API hatası - sadece UI\'dan kaldırılıyor');
            const chatElement = document.querySelector(`[data-chat-id="${chatId}"]`);
            if (chatElement) {
                chatElement.style.opacity = '0';
                chatElement.style.transform = 'translateX(-100px)';

                setTimeout(() => {
                    chatElement.remove();
                    allChats = allChats.filter(chat => chat.id !== chatId);
                    filteredChats = filteredChats.filter(chat => chat.id !== chatId);

                    if (filteredChats.length === 0) {
                        showEmptyState();
                    }
                }, 300);
            }
        } else {
            alert('Konuşma silinirken bir hata oluştu.');
        }
    }
}

// Çıkış yapma
function logout() {
    localStorage.clear();
    window.location.href = 'auth.html';
}

// Şifre değiştirme sayfasına git
function goToChangePassword() {
    window.location.href = 'change-password.html';
}

// Filtreleme işlemi
function handleFilter() {
    const btn = document.querySelector('.search-btn');
    btn.innerHTML = '<span class="loading">Filtreleniyor</span>';

    setTimeout(() => {
        applyFilters();
        btn.innerHTML = '🔍 Filtrele';
    }, 500);
}

// Filtreleri uygula
function applyFilters() {
    const dateValue = dateFilter.value;
    const topicValue = topicFilter.value;
    const searchValue = searchInput.value.toLowerCase();

    filteredChats = allChats.filter(chat => {
        // Tarih filtresi
        if (dateValue !== 'all') {
            const daysDiff = Math.floor((new Date() - new Date(chat.created_at)) / (1000 * 60 * 60 * 24));
            if (daysDiff > parseInt(dateValue)) {
                return false;
            }
        }

        // Konu filtresi
        if (topicValue !== 'all' && chat.category !== topicValue) {
            return false;
        }

        // Arama filtresi
        if (searchValue) {
            const searchableText = `${chat.title} ${generateChatSummary(chat)}`.toLowerCase();
            if (!searchableText.includes(searchValue)) {
                return false;
            }
        }

        return true;
    });

    renderChatHistory(filteredChats);
}

// Gerçek zamanlı arama
function handleSearch() {
    applyFilters();
}

// Navbar scroll efekti
function handleNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 4px 20px rgba(232, 213, 240, 0.3)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.9)';
        navbar.style.boxShadow = 'none';
    }
}

// Utility fonksiyonlar
function formatDate(date) {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return `Bugün, ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
        return `Dün, ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
        return `${diffDays} gün önce, ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
        return date.toLocaleDateString('tr-TR');
    }
}

function formatTime(date) {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function generateChatSummary(chat) {
    if (chat.messages.length === 0) return 'Henüz mesaj yok';

    const firstUserMessage = chat.messages.find(m => m.role === 'user');
    if (firstUserMessage) {
        return truncateText(firstUserMessage.content, 100);
    }

    return 'Cilt analizi konuşması';
}

function determineStatus(chat) {
    // Son mesajın tarihi
    const lastMessage = chat.messages[chat.messages.length - 1];
    const lastMessageDate = new Date(lastMessage?.timestamp || chat.created_at);
    const hoursSinceLastMessage = (new Date() - lastMessageDate) / (1000 * 60 * 60);

    if (hoursSinceLastMessage < 24) {
        return { class: 'status-active', text: '🟢 Aktif konuşma' };
    } else {
        return { class: 'status-completed', text: '✅ Tamamlandı' };
    }
}

// State management fonksiyonları
function showLoadingState() {
    loadingState.style.display = 'block';
    chatHistory.style.display = 'none';
    emptyState.style.display = 'none';
    errorState.style.display = 'none';
}

function hideLoadingState() {
    loadingState.style.display = 'none';
    chatHistory.style.display = 'grid';
}

function showEmptyState() {
    emptyState.style.display = 'block';
    chatHistory.style.display = 'none';
    loadingState.style.display = 'none';
    errorState.style.display = 'none';
}

function hideEmptyState() {
    emptyState.style.display = 'none';
}

function showErrorState() {
    errorState.style.display = 'block';
    chatHistory.style.display = 'none';
    loadingState.style.display = 'none';
    emptyState.style.display = 'none';
}