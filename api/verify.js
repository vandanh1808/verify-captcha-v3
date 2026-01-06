// ============================================
// VERCEL SERVERLESS FUNCTION - VERIFY RECAPTCHA V3
// ============================================

/**
 * Vercel Serverless Function Handler
 */
module.exports = async function handler(req, res) {
    // ============================================
    // CORS - ĐẶT NGAY ĐẦU TIÊN
    // ============================================
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Preflight request - TRẢ VỀ NGAY
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // GET - Test API
    if (req.method === 'GET') {
        return res.status(200).json({
            success: true,
            message: 'reCAPTCHA Verify API is running',
            cors: 'Enabled'
        });
    }

    // Chỉ chấp nhận POST
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        const { recaptchaToken, formData } = req.body;

        if (!recaptchaToken) {
            return res.status(400).json({
                success: false,
                message: 'Missing recaptchaToken'
            });
        }

        // Lấy secret key từ env
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;

        if (!secretKey) {
            console.error('RECAPTCHA_SECRET_KEY not configured');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error'
            });
        }

        // Gọi Google reCAPTCHA API
        const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
        const params = new URLSearchParams();
        params.append('secret', secretKey);
        params.append('response', recaptchaToken);

        const verifyResponse = await fetch(verifyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });

        const verifyResult = await verifyResponse.json();

        console.log('reCAPTCHA result:', verifyResult);

        // Kiểm tra kết quả
        if (!verifyResult.success) {
            return res.status(400).json({
                success: false,
                message: 'reCAPTCHA verification failed',
                errors: verifyResult['error-codes']
            });
        }

        // Kiểm tra score (ngưỡng 0.5)
        const score = verifyResult.score;
        if (score < 0.5) {
            return res.status(400).json({
                success: false,
                message: 'Score too low, suspected bot',
                score: score
            });
        }

        // Thành công
        console.log('Verification passed, score:', score);
        if (formData) {
            console.log('Form data:', formData);
        }

        return res.status(200).json({
            success: true,
            message: 'Verification successful',
            score: score
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
