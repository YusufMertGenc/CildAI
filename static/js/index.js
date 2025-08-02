import baseURL from './config.js';

// Globalde kullanılacak fonksiyonlar
function openLoginModal() {
    document.getElementById("loginModal").style.display = "block";
}

function closeLoginModal() {
    document.getElementById("loginModal").style.display = "none";
}

function startAnalysis() {
    window.location.href = "analysis.html";
}

function handleStartAnalysis(event) {
    event.preventDefault();
    const token = localStorage.getItem("access_token");
    if (!token) {
        openLoginModal();
    } else {
        startAnalysis();
    }
}

function loginWithGoogle(event) {
    event.preventDefault();
    const googleAuthUrl = `${baseURL}/auth/google`;
    const popup = window.open(googleAuthUrl, 'googleLogin', 'width=500,height=600,scrollbars=yes,resizable=yes');

    const messageHandler = function (event) {
        console.log('Google mesaj geldi:', event.data, 'Origin:', event.origin);

        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            localStorage.setItem('access_token', event.data.token);
            popup.close();
            closeLoginModal();
            toastr.success('Google ile başarıyla giriş yaptınız!');
            window.location.reload();
            window.removeEventListener('message', messageHandler);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
            console.error('Google giriş hatası:', event.data.error);
            toastr.error('Google ile giriş yapılamadı: ' + event.data.error);
            popup.close();
            window.removeEventListener('message', messageHandler);
        }
    };

    window.addEventListener('message', messageHandler);
}

function loginWithGitHub(event) {
    event.preventDefault();
    const githubAuthUrl = `${baseURL}/auth/github`;
    const popup = window.open(githubAuthUrl, 'githubLogin', 'width=500,height=600,scrollbars=yes,resizable=yes');

    const messageHandler = function (event) {
        console.log('GitHub mesaj geldi:', event.data, 'Origin:', event.origin);

        if (event.data.type === 'GITHUB_AUTH_SUCCESS') {
            localStorage.setItem('access_token', event.data.token);
            popup.close();
            closeLoginModal();
            toastr.success('GitHub ile başarıyla giriş yaptınız!');
            window.location.reload();
            window.removeEventListener('message', messageHandler);
        } else if (event.data.type === 'GITHUB_AUTH_ERROR') {
            console.error('GitHub giriş hatası:', event.data.error);
            toastr.error('GitHub ile giriş yapılamadı: ' + event.data.error);
            popup.close();
            window.removeEventListener('message', messageHandler);
        }
    };

    window.addEventListener('message', messageHandler);
}

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    try {
        const response = await fetch(`${baseURL}/auth/token`, {
            method: "POST",
            body: formData,
        });

        const text = await response.text();
        let data;

        try {
            data = JSON.parse(text);
        } catch {
            console.error("JSON parse hatası:", text);
            toastr.error("Sunucudan beklenmeyen bir yanıt alındı.");
            return;
        }

        if (!response.ok) {
            if (response.status === 403 && data.detail.includes("doğrulayın")) {
                toastr.warning('Lütfen önce e-posta adresinizi doğrulayın.');
            } else if (response.status === 401) {
                toastr.error('Hatalı e-posta veya şifre');
            } else {
                toastr.error("Giriş yapılamadı: " + (data.detail || "Bilinmeyen hata"));
            }
            return;
        }

        localStorage.setItem("access_token", data.access_token);
        closeLoginModal();
        toastr.success('Başarıyla giriş yaptınız!');
        window.location.reload();

    } catch (error) {
        console.error("Sunucu hatası:", error);
        toastr.error("Sunucuya bağlanılamadı.");
    }
}

async function showUserGreeting() {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
        const response = await fetch(`${baseURL}/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const user = await response.json();
            const navBtn = document.getElementById("navLoginBtn");
            const dropdownBtn = document.getElementById("userDropdownBtn");
            const dropdownContainer = document.querySelector(".dropdown");

            if (dropdownBtn) dropdownBtn.textContent = `${user.first_name} ⌄`;
            if (navBtn) navBtn.style.display = "none";
            if (dropdownContainer) dropdownContainer.style.display = "block";
        } else {
            localStorage.removeItem("access_token");
        }
    } catch (error) {
        console.error("Token doğrulama hatası:", error);
    }
}

function logout() {
    localStorage.removeItem("access_token");
    toastr.success('Başarıyla çıkış yaptınız.');
    window.location.href = "index.html";
}

// Navbar scroll efekti
window.addEventListener("scroll", () => {
    const navbar = document.querySelector(".navbar");
    if (window.scrollY > 50) {
        navbar.classList.add("scrolled");
    } else {
        navbar.classList.remove("scrolled");
    }
});

// Modal dışına tıklayınca kapatma
window.onclick = (event) => {
    const modal = document.getElementById("loginModal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
};

// Sayfa yüklendiğinde çalışacak fonksiyonlar
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
    if (token) {
        const loginBtn = document.getElementById("navLoginBtn");
        if (loginBtn) loginBtn.style.display = "none";
    }
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        if (targetId === '#') {
            window.scrollTo({top: 0, behavior: 'smooth'});
        } else {
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({behavior: 'smooth'});
            }
        }
    });
});

window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;
window.handleStartAnalysis = handleStartAnalysis;
window.loginWithGoogle = loginWithGoogle;
window.loginWithGitHub = loginWithGitHub;
window.handleLogin = handleLogin;
window.logout = logout;
