import axios from "axios";
import { storage } from "../utils/storage";
import { API_TIMEOUT } from "../utils/constants";

export const authEvents = { onLogout: null };

const ANDROID_EMULATOR_API_URL = "http://10.0.2.2:5000";
const DEFAULT_REMOTE_API_URL = "https://preploop.me";

const KNOWN_BAD_API_URLS = new Set([
    "https://preploop.azurewebsites.net",
    "http://preploop.azurewebsites.net",
    "https://preploop.com",
    "http://preploop.com",
]);

function normalizeBaseUrl(url) {
    if (!url || typeof url !== "string") return null;
    const trimmed = url.trim().replace(/\/+$/, "");
    if (!trimmed) return null;
    return trimmed.endsWith("/api") ? trimmed.slice(0, -4) : trimmed;
}

function resolveBaseUrl() {
    const configured = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_URL);
    if (configured && !KNOWN_BAD_API_URLS.has(configured)) {
        return configured;
    }

    // Debug APKs are most often tested on Android Emulator, where host
    // machine localhost is exposed through 10.0.2.2.
    if (globalThis.__DEV__) {
        return ANDROID_EMULATOR_API_URL;
    }

    return DEFAULT_REMOTE_API_URL;
}

export const API_BASE_URL = resolveBaseUrl();

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor — attach JWT token
apiClient.interceptors.request.use(
    async (config) => {
        const token = await storage.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// Response interceptor — handle 401/token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = await storage.getRefreshToken();
                if (!refreshToken) throw new Error("No refresh token");

                const res = await axios.post(
                    `${API_BASE_URL}/api/auth/refresh`,
                    {
                        refreshToken,
                    },
                );
                const { token, refreshToken: newRefreshToken } = res.data;
                await storage.saveToken(token);
                await storage.saveRefreshToken(newRefreshToken);
                apiClient.defaults.headers.common["Authorization"] =
                    `Bearer ${token}`;
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return apiClient(originalRequest);
            } catch {
                await storage.clearAuth();
                if (authEvents.onLogout) authEvents.onLogout();
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    },
);

export default apiClient;
