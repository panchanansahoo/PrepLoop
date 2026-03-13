/**
 * Google reCAPTCHA v3 server-side verification.
 * Opt-in: if RECAPTCHA_SECRET_KEY is not set, verification is skipped.
 */

export async function verifyCaptcha(token) {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    // If no secret key configured, skip verification (opt-in)
    if (!secretKey) {
        return { success: true, skipped: true };
    }

    // If token is missing when CAPTCHA is configured, reject
    if (!token) {
        return { success: false, error: 'CAPTCHA token is required' };
    }

    try {
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                secret: secretKey,
                response: token,
            }),
        });

        const data = await response.json();

        if (!data.success || (data.score !== undefined && data.score < 0.5)) {
            return { success: false, error: 'CAPTCHA verification failed' };
        }

        return { success: true, score: data.score };
    } catch (error) {
        console.error('CAPTCHA verification error:', error);
        // Fail open if Google's API is unreachable (don't block users)
        return { success: true, error: 'CAPTCHA service unavailable, skipping' };
    }
}
