/**
 * ============================================
 * RECAPTCHA V3 SNIPPET - COPY & PASTE
 * ============================================
 *
 * Cách sử dụng:
 *
 * 1. Thêm script vào HTML:
 *    <script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>
 *
 * 2. Copy đoạn code này vào project
 *
 * 3. Gọi hàm verifyCaptcha() trước mỗi action cần bảo vệ
 */

// ============================================
// CẤU HÌNH
// ============================================
const RECAPTCHA_CONFIG = {
    SITE_KEY: 'YOUR_SITE_KEY',  // Thay bằng Site Key của bạn
    API_URL: 'https://verify-captcha-v3.vercel.app/api/verify'
};

// ============================================
// HÀM VERIFY CHÍNH
// ============================================

/**
 * Verify reCAPTCHA v3
 * @param {string} action - Tên action (ví dụ: 'login', 'signup', 'checkout')
 * @param {Object} data - Dữ liệu bổ sung (optional)
 * @returns {Promise<{success: boolean, score?: number, message?: string}>}
 *
 * @example
 * // Cách 1: Đơn giản
 * const result = await verifyCaptcha('login');
 * if (result.success) { /* cho phép */ }
 *
 * @example
 * // Cách 2: Với callback
 * verifyCaptcha('signup').then(result => {
 *     if (result.success && result.score >= 0.7) {
 *         // User đáng tin cậy
 *     }
 * });
 */
async function verifyCaptcha(action = 'submit', data = {}) {
    try {
        // Lấy token từ Google
        const token = await new Promise((resolve, reject) => {
            grecaptcha.ready(() => {
                grecaptcha.execute(RECAPTCHA_CONFIG.SITE_KEY, { action })
                    .then(resolve)
                    .catch(reject);
            });
        });

        // Gọi API verify
        const response = await fetch(RECAPTCHA_CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recaptchaToken: token,
                formData: data
            })
        });

        return await response.json();

    } catch (error) {
        console.error('Captcha error:', error);
        return { success: false, message: error.message };
    }
}

// ============================================
// VÍ DỤ SỬ DỤNG
// ============================================

/*
// === VÍ DỤ 1: Bảo vệ form login ===
document.getElementById('loginForm').onsubmit = async (e) => {
    e.preventDefault();

    const captcha = await verifyCaptcha('login');
    if (!captcha.success) {
        alert('Captcha failed!');
        return;
    }

    // Tiếp tục xử lý login...
    submitLogin();
};


// === VÍ DỤ 2: Bảo vệ button ===
async function handleClick() {
    const { success, score } = await verifyCaptcha('button_click');

    if (success && score >= 0.5) {
        // Cho phép hành động
        doSomething();
    } else {
        // Chặn
        showError('Suspicious activity detected');
    }
}


// === VÍ DỤ 3: Bảo vệ API call ===
async function fetchProtectedData() {
    const captcha = await verifyCaptcha('fetch_data');

    if (!captcha.success) {
        throw new Error('Captcha verification failed');
    }

    // Captcha passed, gọi API
    const response = await fetch('/api/protected-endpoint', {
        method: 'GET',
        headers: {
            'X-Captcha-Score': captcha.score  // Optional: gửi score cho backend
        }
    });

    return response.json();
}


// === VÍ DỤ 4: Với React ===
function LoginButton() {
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);

        const captcha = await verifyCaptcha('login');
        if (!captcha.success) {
            alert('Please try again');
            setLoading(false);
            return;
        }

        // Proceed with login...
    };

    return <button onClick={handleLogin} disabled={loading}>Login</button>;
}


// === VÍ DỤ 5: Với Vue ===
export default {
    methods: {
        async submitForm() {
            const captcha = await verifyCaptcha('form_submit');

            if (captcha.success) {
                this.$emit('submit', this.formData);
            } else {
                this.error = captcha.message;
            }
        }
    }
}
*/
