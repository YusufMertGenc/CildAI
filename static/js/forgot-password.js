import baseURL from "./config.js";

const sendCodeBtn = document.getElementById('sendCodeBtn');
const emailInput = document.getElementById('verify_mail');

sendCodeBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();

    if (!email) {
        toastr.error("Lütfen geçerli bir e-posta adresi girin.");
        return;
    }

    sendCodeBtn.disabled = true;

    try {
        const response = await fetch(`${baseURL}/auth/forgot-password`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email})
        });

        const data = await response.json();

        if (response.ok) {
            toastr.success("Doğrulama kodu e-posta adresinize gönderildi. Lütfen kontrol edin.");
            toastr.info("2 saniye içinde doğrulama sayfasına yönlendirileceksiniz.");
            emailInput.value = '';
            setTimeout(() => {
                window.location.href = `verify-code.html?email=${encodeURIComponent(email)}`;
            }, 2000);
        } else {
            toastr.error(data.detail || "Bir hata oluştu. Lütfen tekrar deneyin.");
        }
    } catch (error) {
        toastr.error("Sunucuya bağlanırken bir hata oluştu.");
    } finally {
        sendCodeBtn.disabled = false;
    }
});