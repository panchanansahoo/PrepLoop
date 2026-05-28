import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
    useCallback,
} from "react";
import { authApi } from "../api/authApi";
import { userApi } from "../api/userApi";
import { storage } from "../utils/storage";
import apiClient, { authEvents } from "../api/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const refreshingRef = useRef(false);

    // Initialize auth state from SecureStore on app launch
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const token = await storage.getToken();
                const storedUser = await storage.getUser();
                if (token && storedUser) {
                    apiClient.defaults.headers.common["Authorization"] =
                        `Bearer ${token}`;
                    if (mounted) setUser(storedUser);
                    // Re-sync profile from backend silently
                    try {
                        const profile = await userApi.getProfile();
                        const merged = { ...storedUser, ...profile };
                        await storage.saveUser(merged);
                        if (mounted) setUser(merged);
                    } catch {
                        // Use cached user if network fails
                    }
                }
            } catch (e) {
                console.warn("[AuthContext] init error", e);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        authEvents.onLogout = () => {
            storage.clearAuth();
            setUser(null);
        };
        return () => {
            mounted = false;
            authEvents.onLogout = null;
        };
    }, []);

    const login = useCallback(async (email, password) => {
        const data = await authApi.login(email, password);
        const { token, refreshToken, user: userData } = data;
        await storage.saveToken(token);
        await storage.saveRefreshToken(refreshToken);
        await storage.saveUser(userData);
        apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setUser(userData);
        return userData;
    }, []);

    const signup = useCallback(async (email, password, fullName) => {
        const data = await authApi.signup(email, password, fullName);
        const { token, refreshToken, user: userData } = data;
        if (token) {
            await storage.saveToken(token);
            if (refreshToken) await storage.saveRefreshToken(refreshToken);
            await storage.saveUser(userData);
            apiClient.defaults.headers.common["Authorization"] =
                `Bearer ${token}`;
            setUser(userData);
        }
        return data;
    }, []);

    const logout = useCallback(async () => {
        try {
            await authApi.logout();
        } catch {
            /* best-effort */
        }
        await storage.clearAuth();
        delete apiClient.defaults.headers.common["Authorization"];
        setUser(null);
    }, []);

    const refreshSession = useCallback(async () => {
        if (refreshingRef.current) return false;
        refreshingRef.current = true;
        try {
            const refreshToken = await storage.getRefreshToken();
            if (!refreshToken) return false;
            const data = await authApi.refreshToken(refreshToken);
            await storage.saveToken(data.token);
            await storage.saveRefreshToken(data.refreshToken);
            apiClient.defaults.headers.common["Authorization"] =
                `Bearer ${data.token}`;
            setUser((prev) =>
                prev ? { ...prev, access_token: data.token } : prev,
            );
            return true;
        } catch {
            await logout();
            return false;
        } finally {
            refreshingRef.current = false;
        }
    }, [logout]);

    const isAdmin = user?.role === "admin";

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                signup,
                logout,
                refreshSession,
                isAdmin,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
