import baseURL from './config.js';

toastr.options = {
    "positionClass": "toast-top-center",
    "timeOut": "4000"
};

const inputs = document.querySelectorAll('.code-input');
const verifyBtn = document.getElementById('verifyBtn');

inputs.forEach((input, i) => {
    input.addEventListener('input', () => {
        if (input.value.length === 1 && i < inputs.length - 1) {
            inputs[i + 1].focus();
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && input.value === '' && i > 0) {
            inputs[i - 1].focus();
        }
    });
});

async function submitCode() {
    const code = Array.from(inputs).map(input => input.value).join('');
    if (code.length !== inputs.length) {
        toastr.error("Lütfen tüm kutucukları doldurun.");
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    if (!email) {
        toastr.error("E-posta bilgisi bulunamadı.");
        return;
    }

    try {
        const res = await fetch(`${baseURL}/auth/verify-reset-code`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, code})
        });

        const data = await res.json();

        if (res.ok) {
            toastr.success("Kod doğrulandı. Şifre yenileme sayfasına yönlendiriliyorsunuz...");
            setTimeout(() => {
                window.location.href = `reset-password.html?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`;
            }, 2000);
        } else {
            toastr.error(data.detail || "Kod doğrulama başarısız.");
        }
    } catch (error) {
        toastr.error("Sunucuya bağlanırken hata oluştu.");
    }
}

verifyBtn.addEventListener('click', submitCode);