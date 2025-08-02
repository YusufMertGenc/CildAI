import baseURL from "./config.js";

let passwordStrength = 0;
let currentUserEmail = '';

document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    loadUserInfo();

    // Password form elements
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordForm = document.getElementById('passwordForm');

    // Email form elements
    const newEmailInput = document.getElementById('newEmail');
    const confirmEmailInput = document.getElementById('confirmEmail');
    const emailCurrentPasswordInput = document.getElementById('emailCurrentPassword');
    const emailForm = document.getElementById('emailForm');

    // Password form event listeners
    if (newPasswordInput) {
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

            validatePasswordForm();
        });

        confirmPasswordInput.addEventListener('input', validatePasswordForm);
        document.getElementById('currentPassword').addEventListener('input', validatePasswordForm);
        passwordForm.addEventListener('submit', handlePasswordSubmit);
    }

    // Email form event listeners
    if (newEmailInput) {
        newEmailInput.addEventListener('input', validateEmailForm);
        confirmEmailInput.addEventListener('input', validateEmailForm);
        emailCurrentPasswordInput.addEventListener('input', validateEmailForm);
        emailForm.addEventListener('submit', handleEmailSubmit);
    }
});

// Kullanıcı bilgilerini yükle
async function loadUserInfo() {
    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${baseURL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const userData = await response.json();
            currentUserEmail = userData.email;
            const emailDisplay = document.getElementById('currentEmailText');
            if (emailDisplay) {
                emailDisplay.textContent = currentUserEmail;
            }
        }
    } catch (error) {
        console.error('Kullanıcı bilgileri yüklenemedi:', error);
    }
}

// Tab değiştirme
function switchTab(tabName) {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    // Tüm tab içeriklerini gizle
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Aktif tab'ı göster
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Mesaj kutusunu temizle
    document.getElementById('messageContainer').innerHTML = '';
}

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
        if (element) {
            const icon = element.querySelector('.requirement-icon');

            if (req.test) {
                element.className = 'requirement requirement-valid';
                icon.textContent = '✓';
            } else {
                element.className = 'requirement requirement-invalid';
                icon.textContent = '•';
            }
        }
    });
}

function validatePasswordForm() {
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

    if (submitBtn) {
        submitBtn.disabled = !isValid;
    }
}

function validateEmailForm() {
    const emailCurrentPassword = document.getElementById('emailCurrentPassword').value;
    const newEmail = document.getElementById('newEmail').value;
    const confirmEmail = document.getElementById('confirmEmail').value;
    const emailSubmitBtn = document.getElementById('emailSubmitBtn');

    // Input states güncelle
    const newEmailInput = document.getElementById('newEmail');
    const confirmEmailInput = document.getElementById('confirmEmail');

    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (newEmail.length > 0) {
        if (emailRegex.test(newEmail) && newEmail !== currentUserEmail) {
            newEmailInput.className = 'form-input valid';
        } else {
            newEmailInput.className = 'form-input invalid';
        }
    } else {
        newEmailInput.className = 'form-input';
    }

    if (confirmEmail.length > 0) {
        if (newEmail === confirmEmail && emailRegex.test(confirmEmail)) {
            confirmEmailInput.className = 'form-input valid';
        } else {
            confirmEmailInput.className = 'form-input invalid';
        }
    } else {
        confirmEmailInput.className = 'form-input';
    }

    // Submit button durumu
    const isValid = emailCurrentPassword.length > 0 &&
        emailRegex.test(newEmail) &&
        newEmail === confirmEmail &&
        newEmail !== currentUserEmail;

    if (emailSubmitBtn) {
        emailSubmitBtn.disabled = !isValid;
    }
}

async function handlePasswordSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const messageContainer = document.getElementById('messageContainer');

    submitBtn.innerHTML = '<span class="loading">Değiştiriliyor...</span>';
    submitBtn.disabled = true;

    const formData = {
        current_password: document.getElementById('currentPassword').value,
        new_password: document.getElementById('newPassword').value,
        confirm_password: document.getElementById('confirmPassword').value
    };

    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${baseURL}/auth/change-password`, {
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
                window.location.href = 'index.html';
            }, 3000);

        } else {
            messageContainer.innerHTML = `
                <div class="error-message">
                    ❌ ${result.detail || 'Şifre değiştirme işlemi başarısız oldu.'}
                </div>
            `;

            submitBtn.innerHTML = '🔒 Şifre Değiştir';
            validatePasswordForm();
        }

    } catch (error) {
        messageContainer.innerHTML = `
            <div class="error-message">
                ❌ Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.
            </div>
        `;

        submitBtn.innerHTML = '🔒 Şifre Değiştir';
        validatePasswordForm();
    }
}

async function handleEmailSubmit(e) {
    e.preventDefault();

    const emailSubmitBtn = document.getElementById('emailSubmitBtn');
    const messageContainer = document.getElementById('messageContainer');

    emailSubmitBtn.innerHTML = '<span class="loading">Değiştiriliyor...</span>';
    emailSubmitBtn.disabled = true;

    const formData = {
        current_password: document.getElementById('emailCurrentPassword').value,
        new_email: document.getElementById('newEmail').value,
        confirm_email: document.getElementById('confirmEmail').value
    };

    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${baseURL}/auth/change-email`, {
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
                    ✅ Mail adresiniz başarıyla değiştirildi!
                    <br>Yeni mail adresiniz: <strong>${formData.new_email}</strong>
                    <br>Güvenlik için 3 saniye sonra giriş sayfasına yönlendirileceksiniz.
                </div>
            `;

            setTimeout(() => {
                localStorage.removeItem('access_token');
                window.location.href = 'index.html';
            }, 3000);

        } else {
            messageContainer.innerHTML = `
                <div class="error-message">
                    ❌ ${result.detail || 'Mail değiştirme işlemi başarısız oldu.'}
                </div>
            `;

            emailSubmitBtn.innerHTML = '📧 Mail Değiştir';
            validateEmailForm();
        }

    } catch (error) {
        messageContainer.innerHTML = `
            <div class="error-message">
                ❌ Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.
            </div>
        `;

        emailSubmitBtn.innerHTML = '📧 Mail Değiştir';
        validateEmailForm();
    }
}

window.switchTab = switchTab;
window.togglePassword = togglePassword;
window.heckPasswordStrength = checkPasswordStrength;
window.updateStrengthMeter = updateStrengthMeter;
window.validatePasswordForm = validatePasswordForm;
window.validateRequirements = validateRequirements;