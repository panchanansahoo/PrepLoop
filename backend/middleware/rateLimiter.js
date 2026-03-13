import rateLimit from 'express-rate-limit';

// --- Per-email cooldown (in-memory) ---
const emailCooldowns = new Map(); // key: "endpoint:email" => timestamp

/**
 * Check if an email is in cooldown for a given endpoint.
 * Returns true if the email should be blocked.
 */
export function isEmailCoolingDown(endpoint, email, cooldownMs = 60000) {
    const key = `${endpoint}:${email.toLowerCase()}`;
    const lastSent = emailCooldowns.get(key);
    if (lastSent && Date.now() - lastSent < cooldownMs) {
        return true;
    }
    return false;
}

/**
 * Mark an email as just sent for a given endpoint.
 */
export function markEmailSent(endpoint, email) {
    const key = `${endpoint}:${email.toLowerCase()}`;
    emailCooldowns.set(key, Date.now());
}

// Clean up stale entries every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of emailCooldowns) {
        if (now - timestamp > 600000) { // 10 min
            emailCooldowns.delete(key);
        }
    }
}, 600000);

// --- Rate limiters ---

/** Forgot password: 3 requests per 15 min per IP */
export const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many password reset requests. Please try again in 15 minutes.' },
    keyGenerator: (req) => req.ip,
});

/** Resend verification: 3 requests per 15 min per IP */
export const verificationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many verification requests. Please try again in 15 minutes.' },
    keyGenerator: (req) => req.ip,
});

/** Contact form: 5 requests per hour per IP */
export const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many messages sent. Please try again in an hour.' },
    keyGenerator: (req) => req.ip,
});
