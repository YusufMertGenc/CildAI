let passwordStrength = 0;

document.addEventListener('DOMContentLoaded', function () {
    // Token kontrolü
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'giriş.html';
        return;
    }

    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const form = document.getElementById('passwordForm');

    // Event listeners
    newPasswordInput.addEventListener('input', function () {
        const password = this.value;

        if (password.length > 0) {
            document.getElementById('strengthMeter').style.display = 'block';
            document.getElementById('requirements').style.display = 'block';
            checkPasswordStrength(password);
            validateRequirements(password);
        } else {
            document.getElementById('strengthMeter').style.display = 'none';
            document.getElementById('requirements').style.display = 'none';
        }

        validateForm();
    });

    confirmPasswordInput.addEventListener('input', validateForm);
    document.getElementById('currentPassword').addEventListener('input', validateForm);
    form.addEventListener('submit', handleSubmit);
});

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentNode.querySelector('.password-toggle');

    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
}

function checkPasswordStrength(password) {
    let strength = 0;

    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    passwordStrength = strength;
    updateStrengthMeter(strength);
}

function updateStrengthMeter(strength) {
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');

    strengthFill.className = 'strength-fill';

    if (strength <= 2) {
        strengthFill.classList.add('strength-weak');
        strengthText.textContent = 'Şifre gücü: Zayıf';
        strengthText.style.color = '#F56565';
    } else if (strength <= 3) {
        strengthFill.classList.add('strength-fair');
        strengthText.textContent = 'Şifre gücü: Orta';
        strengthText.style.color = '#ED8936';
    } else if (strength <= 4) {
        strengthFill.classList.add('strength-good');
        strengthText.textContent = 'Şifre gücü: İyi';
        strengthText.style.color = '#48BB78';
    } else {
        strengthFill.classList.add('strength-strong');
        strengthText.textContent = 'Şifre gücü: Güçlü';
        strengthText.style.color = '#38A169';
    }
}

function validateRequirements(password) {
    const requirements = [
        {id: 'lengthReq', test: password.length >= 8},
        {id: 'upperReq', test: /[A-Z]/.test(password)},
        {id: 'lowerReq', test: /[a-z]/.test(password)},
        {id: 'numberReq', test: /[0-9]/.test(password)},
        {id: 'specialReq', test: /[^A-Za-z0-9]/.test(password)}
    ];

    requirements.forEach(req => {
        const element = document.getElementById(req.id);
        const icon = element.querySelector('.requirement-icon');

        if (req.test) {
            element.className = 'requirement requirement-valid';
            icon.textContent = '✓';
        } else {
            element.className = 'requirement requirement-invalid';
            icon.textContent = '•';
        }
    });
}

function validateForm() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitBtn = document.getElementById('submitBtn');

    // Input states güncelle
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    if (newPassword.length > 0) {
        if (passwordStrength >= 3) {
            newPasswordInput.className = 'form-input valid';
        } else {
            newPasswordInput.className = 'form-input invalid';
        }
    } else {
        newPasswordInput.className = 'form-input';
    }

    if (confirmPassword.length > 0) {
        if (newPassword === confirmPassword && newPassword.length > 0) {
            confirmPasswordInput.className = 'form-input valid';
        } else {
            confirmPasswordInput.className = 'form-input invalid';
        }
    } else {
        confirmPasswordInput.className = 'form-input';
    }

    // Submit button durumu
    const isValid = currentPassword.length > 0 &&
        newPassword.length >= 8 &&
        passwordStrength >= 3 &&
        newPassword === confirmPassword;

    submitBtn.disabled = !isValid;
}

async function handleSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const messageContainer = document.getElementById('messageContainer');

    submitBtn.innerHTML = '<span class="loading">Değiştiriliyor</span>';
    submitBtn.disabled = true;

    const formData = {
        current_password: document.getElementById('currentPassword').value,
        new_password: document.getElementById('newPassword').value,
        confirm_password: document.getElementById('confirmPassword').value
    };

    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('http://127.0.0.1:8000/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            messageContainer.innerHTML = `
                <div class="success-message">
                    ✅ Şifreniz başarıyla değiştirildi! 
                    <br>Güvenlik için 3 saniye sonra giriş sayfasına yönlendirileceksiniz.
                </div>
            `;

            setTimeout(() => {
                localStorage.removeItem('access_token');
                window.location.href = 'giriş.html';
            }, 3000);

        } else {
            messageContainer.innerHTML = `
                <div class="error-message">
                    ❌ ${result.detail || 'Şifre değiştirme işlemi başarısız oldu.'}
                </div>
            `;

            submitBtn.innerHTML = '🔒 Şifre Değiştir';
            validateForm();
        }

    } catch (error) {
        messageContainer.innerHTML = `
            <div class="error-message">
                ❌ Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.
            </div>
        `;

        submitBtn.innerHTML = '🔒 Şifre Değiştir';
        validateForm();
    }
}