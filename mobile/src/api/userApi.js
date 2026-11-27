import apiClient from "./apiClient";

const DAY_MS = 24 * 60 * 60 * 1000;

function toUtcDateKey(value) {
    if (!value) return null;
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
        const parsed = new Date(trimmed);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed.toISOString().split("T")[0];
        }
        return null;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString().split("T")[0];
}

export function calculateConsecutiveStreak(activityDays, referenceDate = new Date()) {
    if (!Array.isArray(activityDays) || activityDays.length === 0) return 0;

    const todayStr = toUtcDateKey(referenceDate);
    if (!todayStr) return 0;
    const todayMs = Date.parse(`${todayStr}T00:00:00.000Z`);
    const yesterdayStr = new Date(todayMs - DAY_MS).toISOString().split("T")[0];

    const activeDates = [
        ...new Set(
            activityDays
                .filter((item) => {
                    if (typeof item === "string" || item instanceof Date) return true;
                    return (item?.seconds_active ?? 0) > 0;
                })
                .map((item) =>
                    typeof item === "string" || item instanceof Date
                        ? toUtcDateKey(item)
                        : toUtcDateKey(item?.date),
                )
                .filter((dateKey) => dateKey && dateKey <= todayStr),
        ),
    ]
        .sort()
        .reverse();

    if (activeDates.length === 0) return 0;
    if (activeDates[0] !== todayStr && activeDates[0] !== yesterdayStr) {
        return 0;
    }

    let streak = 1;
    for (let i = 1; i < activeDates.length; i += 1) {
        const prevMs = Date.parse(`${activeDates[i - 1]}T00:00:00.000Z`);
        const currMs = Date.parse(`${activeDates[i]}T00:00:00.000Z`);
        if (Math.round((prevMs - currMs) / DAY_MS) === 1) {
            streak += 1;
        } else {
            break;
        }
    }
    return streak;
}

export const userApi = {
    /**
     * GET /api/user/profile
     * Returns { user: { id, email, full_name, subscription_tier, experience_level, role, coins, ... } }
     */
    async getProfile() {
        const res = await apiClient.get("/api/user/profile");
        if (res.data?.degraded) throw new Error("Profile temporarily unavailable");
        const profile = res.data?.user || res.data;
        if (!profile || typeof profile !== "object") {
            throw new Error("Invalid profile response");
        }
        return profile;
    },

    /**
     * PUT /api/user/profile
     * Accepts camelCase fields — normalizeProfileUpdatePayload handles the mapping.
     * { fullName, experienceLevel, bio, skills, ... }
     */
    async updateProfile(data) {
        const res = await apiClient.put("/api/user/profile", data);
        return res.data.user || res.data;
    },

    /**
     * GET /api/activity/weekly
     * Returns array of { date, seconds_active } for the last 7 days.
     */
    async getActivity() {
        const res = await apiClient.get("/api/activity/weekly");
        return res.data;
    },

    async deleteAccount(confirmation) {
        const { data } = await apiClient.delete("/api/user/account", { data: { confirmation }, skipAuthRefresh: true });
        if (!data?.success) throw new Error("Could not delete your account.");
    },

    async getDashboardStats() {
        const { data } = await apiClient.get("/api/user/dashboard");
        if (!data || typeof data !== "object" || data.degraded) {
            throw new Error("Dashboard stats unavailable");
        }
        return {
            totalInterviews: data.stats?.mockInterviews ?? null,
            currentStreak: data.streak ?? null,
            problemsSolved: data.stats?.problemsSolved ?? null,
            avgScore: data.avgScore ?? data.stats?.avgScore ?? null,
        };
    },

    /**
     * GET /api/user/dashboard — consecutive active-day streak
     */
    async getStreak() {
        const { data } = await apiClient.get("/api/user/dashboard");
        if (!data || typeof data !== "object" || data.degraded) {
            throw new Error("Streak unavailable");
        }
        return data.streak ?? 0;
    },
};
