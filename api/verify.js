// ============================================
// VERCEL SERVERLESS FUNCTION - VERIFY RECAPTCHA V3
// ============================================
// File: /api/verify.js
// Endpoint: POST /api/verify
// Mục đích: Xác thực token reCAPTCHA v3 từ frontend
// ============================================

/**
 * Vercel Serverless Function Handler
 *
 * @param {Object} req - HTTP Request object
 * @param {Object} res - HTTP Response object
 */
module.exports = async function handler(req, res) {
    // ============================================
    // CORS HEADERS - Cho phép frontend gọi API
    // ============================================
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Xử lý preflight request (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // ============================================
    // CHỈ CHẤP NHẬN METHOD POST
    // ============================================
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method không được hỗ trợ. Chỉ chấp nhận POST.'
        });
    }

    try {
        // ============================================
        // LẤY DỮ LIỆU TỪ REQUEST BODY
        // ============================================
        const { recaptchaToken, formData } = req.body;

        // Kiểm tra token có được gửi lên không
        if (!recaptchaToken) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu token reCAPTCHA.'
            });
        }

        // ============================================
        // LẤY SECRET KEY TỪ ENVIRONMENT VARIABLE
        // ============================================
        // QUAN TRỌNG: Secret key phải được lưu trong Environment Variables
        // KHÔNG BAO GIỜ hardcode secret key trong code!
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;

        if (!secretKey) {
            console.error('❌ RECAPTCHA_SECRET_KEY chưa được cấu hình');
            return res.status(500).json({
                success: false,
                message: 'Lỗi cấu hình server. Vui lòng liên hệ quản trị viên.'
            });
        }

        // ============================================
        // GỌI GOOGLE RECAPTCHA API ĐỂ XÁC THỰC
        // ============================================
        console.log('🔄 Đang xác thực với Google reCAPTCHA...');

        // Tạo URL với parameters
        const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';

        // Tạo form data để gửi đi
        const params = new URLSearchParams();
        params.append('secret', secretKey);
        params.append('response', recaptchaToken);

        // Gọi API Google
        const verifyResponse = await fetch(verifyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
        });

        // Parse response từ Google
        const verifyResult = await verifyResponse.json();

        console.log('📊 Kết quả từ Google:', JSON.stringify(verifyResult, null, 2));

        // ============================================
        // KIỂM TRA KẾT QUẢ XÁC THỰC
        // ============================================

        // Kiểm tra success từ Google
        if (!verifyResult.success) {
            console.log('❌ reCAPTCHA verification failed:', verifyResult['error-codes']);
            return res.status(400).json({
                success: false,
                message: 'Xác thực reCAPTCHA thất bại.',
                errors: verifyResult['error-codes']
            });
        }

        // ============================================
        // KIỂM TRA SCORE (ĐIỂM ĐÁNH GIÁ)
        // ============================================
        // Score từ 0.0 đến 1.0
        // - 1.0: Rất có khả năng là người thật
        // - 0.0: Rất có khả năng là bot
        // - Khuyến nghị: score >= 0.5 là an toàn

        const score = verifyResult.score;
        const action = verifyResult.action;
        const scoreThreshold = 0.5; // Ngưỡng điểm chấp nhận

        console.log(`📊 Score: ${score}, Action: ${action}`);

        if (score < scoreThreshold) {
            console.log(`⚠️ Score quá thấp: ${score} < ${scoreThreshold}`);
            return res.status(400).json({
                success: false,
                message: 'Hệ thống nghi ngờ bạn là bot. Vui lòng thử lại.',
                score: score
            });
        }

        // ============================================
        // XÁC THỰC THÀNH CÔNG - XỬ LÝ FORM DATA
        // ============================================
        console.log('✅ reCAPTCHA verification passed!');
        console.log('📝 Form data:', JSON.stringify(formData, null, 2));

        // Tại đây bạn có thể:
        // 1. Lưu dữ liệu vào database
        // 2. Gửi email thông báo
        // 3. Tích hợp với các service khác (Slack, Discord, etc.)

        // Ví dụ: Log dữ liệu form
        if (formData) {
            console.log('📧 Thông tin liên hệ mới:');
            console.log(`   - Tên: ${formData.name}`);
            console.log(`   - Email: ${formData.email}`);
            console.log(`   - SĐT: ${formData.phone || 'Không cung cấp'}`);
            console.log(`   - Nội dung: ${formData.message}`);
        }

        // ============================================
        // TRẢ VỀ KẾT QUẢ THÀNH CÔNG
        // ============================================
        return res.status(200).json({
            success: true,
            message: 'Xác thực thành công! Form đã được gửi.',
            score: score,
            action: action,
            // Không trả về formData trong production để bảo mật
            // formData: formData
        });

    } catch (error) {
        // ============================================
        // XỬ LÝ LỖI
        // ============================================
        console.error('❌ Server Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Lỗi server. Vui lòng thử lại sau.',
            // Không trả về chi tiết lỗi trong production
            // error: error.message
        });
    }
};
