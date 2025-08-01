async function handleSignup(event) {
    event.preventDefault();

    const baseURL = import.meta.env.MODE === 'development'
        ? 'http://localhost:8000'
        : 'https://api.senin-domainin.com';

    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    const confirmPassword = document.getElementById("signup-confirm-password").value;
    const firstName = document.getElementById("signup-first-name").value.trim();
    const lastName = document.getElementById("signup-last-name").value.trim();

    const existingError = document.getElementById("signup-error");
    if (existingError) existingError.remove();

    if (password !== confirmPassword) {
        const error = document.createElement("p");
        error.id = "signup-error";
        error.textContent = "❌ Şifreler eşleşmiyor.";
        error.style.color = "#e53e3e";
        error.style.marginTop = "1rem";
        document.querySelector("form").appendChild(error);
        return;
    }

    const userData = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        password: password,
        role: "user"
    };

    try {
        const response = await fetch(`${baseURL}/auth/create_user`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            toastr.success('Kayıt başarılı! Lütfen e-posta adresinizi kontrol edin ve doğrulama bağlantısına tıklayın.');
            toastr.info('Giriş sayfasına yönlendiriliyorsunuz...');
            setTimeout(() => {
                window.location.href = "index.html";
            }, 3000);
        } else {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Kayıt başarısız");
        }
    } catch (error) {
        const errorMsg = document.createElement("p");
        errorMsg.id = "signup-error";
        errorMsg.textContent = `❌ ${error.message}`;
        errorMsg.style.color = "#e53e3e";
        errorMsg.style.marginTop = "1rem";
        document.querySelector("form").appendChild(errorMsg);
    }
}