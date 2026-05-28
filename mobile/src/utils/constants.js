export const API_TIMEOUT = 15000; // 15 seconds

export const SUBSCRIPTION_TIERS = {
    FREE: "free",
    PRO: "pro",
    PREMIUM: "premium",
};

export const EXPERIENCE_LEVELS = {
    BEGINNER: "beginner",
    INTERMEDIATE: "intermediate",
    ADVANCED: "advanced",
};

export const INTERVIEW_TYPES = [
    {
        id: "technical",
        label: "Technical",
        icon: "code-braces",
        color: "#6366f1",
    },
    { id: "hr", label: "HR Round", icon: "account-tie", color: "#0891b2" },
    {
        id: "system_design",
        label: "System Design",
        icon: "server",
        color: "#f59e0b",
    },
    { id: "dsa", label: "DSA", icon: "graph", color: "#10b981" },
    { id: "behavioral", label: "Behavioral", icon: "brain", color: "#FF6B6B" },
];

export const DSA_CATEGORIES = [
    "Arrays",
    "Strings",
    "Linked Lists",
    "Trees",
    "Graphs",
    "Dynamic Programming",
    "Recursion",
    "Sorting",
    "Searching",
    "Stacks & Queues",
    "Hash Maps",
    "Heaps",
    "Greedy",
    "Backtracking",
    "Two Pointers",
    "Sliding Window",
    "Binary Search",
    "Bit Manipulation",
];

export const DIFFICULTY_COLORS = {
    easy: "#10b981", // web: --color-success
    medium: "#f59e0b", // web: --color-warning
    hard: "#ef4444", // web: --color-danger
};

export const DIFFICULTY_LABELS = {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
};

export const COIN_ACTIONS = {
    INTERVIEW_COMPLETE: "interview_complete",
    DSA_SOLVE: "dsa_solve",
    DAILY_CHALLENGE: "daily_challenge",
    STREAK_BONUS: "streak_bonus",
};

export const STORAGE_KEYS = {
    TOKEN: "preploop_token",
    REFRESH_TOKEN: "preploop_refresh_token",
    USER: "preploop_user",
    THEME: "preploop_theme",
    ONBOARDING_DONE: "preploop_onboarding_done",
};

export const ROUTES = {
    // Auth
    LOGIN: "Login",
    SIGNUP: "Signup",
    FORGOT_PASSWORD: "ForgotPassword",

    // Main Tabs
    DASHBOARD: "Dashboard",
    DSA: "DSA",
    INTERVIEW: "Interview",
    JOBS: "Jobs",
    PROFILE: "Profile",

    // Nested
    DSA_PATTERNS: "DSAPatterns",
    DSA_PROBLEM: "DSAProblem",
    INTERVIEW_HUB: "InterviewHub",
    AI_INTERVIEW: "AIInterview",
    INTERVIEW_HISTORY: "InterviewHistory",
    COIN_WALLET: "CoinWallet",
    SETTINGS: "Settings",
};
