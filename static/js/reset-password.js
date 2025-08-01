const passwordInput = document.getElementById("newPassword");
const confirmInput = document.getElementById("confirmPassword");
const submitBtn = document.getElementById("submitBtn");

const strengthMeter = document.getElementById("strengthMeter");
const strengthFill = document.getElementById("strengthFill");
const strengthText = document.getElementById("strengthText");

const lengthReq = document.getElementById("lengthReq");
const upperReq = document.getElementById("upperReq");
const lowerReq = document.getElementById("lowerReq");
const numberReq = document.getElementById("numberReq");
const specialReq = document.getElementById("specialReq");

function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    field.type = field.type === "password" ? "text" : "password";
}

function checkPasswordStrength(password) {
    const requirements = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*]/.test(password)
    };

    lengthReq.classList.toggle("requirement-valid", requirements.length);
    lengthReq.classList.toggle("requirement-invalid", !requirements.length);

    upperReq.classList.toggle("requirement-valid", requirements.upper);
    upperReq.classList.toggle("requirement-invalid", !requirements.upper);

    lowerReq.classList.toggle("requirement-valid", requirements.lower);
    lowerReq.classList.toggle("requirement-invalid", !requirements.lower);

    numberReq.classList.toggle("requirement-valid", requirements.number);
    numberReq.classList.toggle("requirement-invalid", !requirements.number);

    specialReq.classList.toggle("requirement-valid", requirements.special);
    specialReq.classList.toggle("requirement-invalid", !requirements.special);

    const score = Object.values(requirements).filter(Boolean).length;
    const percentage = (score / 5) * 100;

    strengthMeter.style.display = "block";
    strengthFill.style.width = percentage + "%";

    if (score <= 2) {
        strengthText.textContent = "Şifre gücü: Zayıf";
        strengthFill.style.backgroundColor = "#f56565";
    } else if (score === 3 || score === 4) {
        strengthText.textContent = "Şifre gücü: Orta";
        strengthFill.style.backgroundColor = "#ecc94b";
    } else {
        strengthText.textContent = "Şifre gücü: Güçlü";
        strengthFill.style.backgroundColor = "#48bb78";
    }

    return Object.values(requirements).every(Boolean);
}

function validateForm() {
    const password = passwordInput.value;
    const confirm = confirmInput.value;

    const isStrong = checkPasswordStrength(password);
    const isMatch = password === confirm;

    submitBtn.disabled = !(isStrong && isMatch);
}

passwordInput.addEventListener("input", validateForm);
confirmInput.addEventListener("input", validateForm);

document.getElementById("passwordForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = passwordInput.value;
    const confirm = confirmInput.value;

    if (password !== confirm) {
        toastr.error("Şifreler uyuşmuyor.");
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    const code = params.get("code");

    if (!email || !code) {
        toastr.error("E-posta veya doğrulama kodu bulunamadı.");
        return;
    }

    try {
        const res = await fetch("http://127.0.0.1:8000/auth/reset-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                code: code,
                new_password: password
            })
        });

        const data = await res.json();

        if (res.ok) {
            toastr.success("Şifreniz başarıyla güncellendi.");
            toastr.info("Giriş sayfasına Yönlendiriliyorsunuz...");
            submitBtn.disabled = true;
            setTimeout(() => {
                window.location.href = "../index.html";
            }, 2000);
        } else {
            toastr.error(data.detail || "Bir hata oluştu.");
        }
    } catch (error) {
        toastr.error("Sunucuya ulaşılamadı.");
    }
});


function getVerificationTokenFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") || "";
}
