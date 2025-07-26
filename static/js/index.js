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

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    try {
        const response = await fetch("http://localhost:8000/auth/token", {
            method: "POST",
            body: formData,
        });

        const text = await response.text();
        let data;

        try {
            data = JSON.parse(text);
        } catch {
            console.error("JSON parse hatası:", text);
            alert("Sunucudan beklenmeyen bir yanıt alındı.");
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
        const response = await fetch("http://localhost:8000/auth/me", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const user = await response.json();
            const navBtn = document.getElementById("navLoginBtn");
            const dropdownBtn = document.getElementById("userDropdownBtn");
            if (dropdownBtn) {
                dropdownBtn.textContent = `${user.first_name} ⌄`;
            }
            if (navBtn) {
                navBtn.style.display = "none";
            }
            document.querySelector(".dropdown").style.display = "block";

            navBtn.href = "#";
            navBtn.onclick = null;
        } else {
            localStorage.removeItem("access_token");
        }
    } catch (error) {
        console.error("Token doğrulama hatası:", error);
    }
}

document.addEventListener("DOMContentLoaded", showUserGreeting);

window.addEventListener("scroll", function () {
    const navbar = document.querySelector(".navbar");
    if (window.scrollY > 50) {
        navbar.classList.add("scrolled");
    } else {
        navbar.classList.remove("scrolled");
    }
});

window.onclick = function (event) {
    const modal = document.getElementById("loginModal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
};


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
            dropdownBtn.textContent = `${user.first_name} ⌄`;
            document.querySelector(".dropdown").style.display = "block";
        } else {
            localStorage.removeItem("access_token");
        }
    } catch (error) {
        console.error("Kullanıcı verisi alınamadı:", error);
    }
}

function logout() {
    localStorage.removeItem("access_token");
    toastr.success('Başarıyla çıkış yaptınız.');
    window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", () => {
    showUserGreeting();

    const logoutLink = document.getElementById("dropdownLogoutBtn");
    if (logoutLink) {
        logoutLink.addEventListener("click", function (e) {
            e.preventDefault();
            logout();
        });
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("access_token");
    if (token) {
        const loginBtn = document.getElementById("navLoginBtn");
        if (loginBtn) loginBtn.style.display = "none";
    }
});