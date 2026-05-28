import apiClient from "./apiClient";

export const authApi = {
    /**
     * POST /api/auth/login
     * Returns { message, token, refreshToken, user: { id, email, fullName, subscriptionTier, experienceLevel, role, emailVerified } }
     * Error codes: EMAIL_NOT_VERIFIED (403), ACCOUNT_LOCKED (429), invalid credentials (401)
     */
    async login(email, password) {
        const res = await apiClient.post("/api/auth/login", {
            email,
            password,
        });
        return res.data;
    },

    /**
     * POST /api/auth/signup
     * Returns { message, user: { id, email, fullName, emailVerified } }
     * NOTE: No token is returned — user must verify email before logging in.
     * In "legacy mode" (schema without email verification), emailVerified=true and login is immediate.
     */
    async signup(email, password, fullName) {
        const res = await apiClient.post("/api/auth/signup", {
            email,
            password,
            fullName,
        });
        return res.data;
    },

    /**
     * POST /api/auth/forgot-password
     * Returns { message } — always returns 200 to avoid email enumeration.
     * NOTE: If RECAPTCHA_SECRET_KEY is configured on the server, a captchaToken is required.
     * If not configured (default for self-hosted), captcha is skipped automatically.
     * Mobile sends captchaToken: null — works when RECAPTCHA is not configured.
     */
    async forgotPassword(email) {
        const res = await apiClient.post("/api/auth/forgot-password", {
            email,
            // captchaToken is intentionally omitted; backend skips validation
            // if RECAPTCHA_SECRET_KEY is not set (opt-in verification).
            captchaToken: null,
        });
        return res.data;
    },

    /**
     * POST /api/auth/refresh
     * Returns { token, refreshToken }
     */
    async refreshToken(refreshToken) {
        const res = await apiClient.post("/api/auth/refresh", { refreshToken });
        return res.data;
    },

    /**
     * POST /api/auth/logout
     * NOTE: No /logout route exists on the backend — this is a best-effort call.
     * Auth state is cleared client-side regardless.
     */
    async logout() {
        try {
            await apiClient.post("/api/auth/logout");
        } catch {
            // Expected — /logout route does not exist; client-side cleanup handles it.
        }
    },
};
