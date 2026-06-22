import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    StatusBar,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { userApi } from "../../api/userApi";
import { dsaApi } from "../../api/dsaApi";
import { coinsApi } from "../../api/coinsApi";
import { cache, CACHE_KEYS, CACHE_TTL } from "../../utils/cache";
import { Card } from "../../components/Card";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
} from "../../utils/theme";
import * as Haptics from "expo-haptics";

// ── Daily quotes matching the web dashboard ───────────────────────
const DAILY_QUOTES = [
    {
        text: "The secret of getting ahead is getting started.",
        author: "Mark Twain",
    },
    { text: "Consistency is the key to mastery.", author: "Robin Sharma" },
    { text: "Every expert was once a beginner.", author: "Helen Hayes" },
    {
        text: "Success is the sum of small efforts, repeated day in and day out.",
        author: "Robert Collier",
    },
    {
        text: "The best time to plant a tree was 20 years ago. The second best time is now.",
        author: "Chinese Proverb",
    },
    { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
    {
        text: "You don't have to be great to start, but you have to start to be great.",
        author: "Zig Ziglar",
    },
    {
        text: "Hard work beats talent when talent fails to work hard.",
        author: "Kevin Durant",
    },
    {
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
    },
    { text: "Code is poetry. Write it with intention.", author: "PrepLoop" },
];

function getDailyQuote() {
    const yearStart = new Date(new Date().getFullYear(), 0, 0);
    const dayOfYear = Math.floor((Date.now() - yearStart.getTime()) / 86400000);
    return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
}

// ── Quick Actions matching web features ──────────────────────────
const QUICK_ACTIONS = [
    {
        id: "code",
        emoji: "⚡",
        title: "Code Studio",
        subtitle: "Practice coding problems",
        color: "#a78bfa",
        bg: "rgba(139,92,246,0.12)",
        border: "rgba(139,92,246,0.25)",
        tab: "DSA",
        screen: "CodeEditor",
    },
    {
        id: "dsa",
        emoji: "🗺️",
        title: "DSA Path",
        subtitle: "15 pattern topics",
        color: "#fbbf24",
        bg: "rgba(245,158,11,0.12)",
        border: "rgba(245,158,11,0.25)",
        tab: "DSA",
        screen: "LearningPath",
    },
    {
        id: "interview",
        emoji: "🎙️",
        title: "AI Interview",
        subtitle: "AI mock sessions",
        color: "#22d3ee",
        bg: "rgba(6,182,212,0.12)",
        border: "rgba(6,182,212,0.25)",
        tab: "Interview",
    },
    {
        id: "company",
        emoji: "🏗️",
        title: "Company Prep",
        subtitle: "50+ companies",
        color: "#f472b6",
        bg: "rgba(236,72,153,0.12)",
        border: "rgba(236,72,153,0.25)",
        tab: "Interview",
        screen: "CompanyPrep",
    },
    {
        id: "arena",
        emoji: "⚔️",
        title: "Quiz Arena",
        subtitle: "Test your knowledge",
        color: "#ef4444",
        bg: "rgba(239,68,68,0.12)",
        border: "rgba(239,68,68,0.25)",
        tab: "Dashboard",
        screen: "QuizArena",
    },
    {
        id: "community",
        emoji: "👥",
        title: "Community",
        subtitle: "Discuss & share",
        color: "#8b5cf6",
        bg: "rgba(139,92,246,0.12)",
        border: "rgba(139,92,246,0.25)",
        tab: "Dashboard",
        screen: "DiscussionForum",
    },
];

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
}

// ── Stat Card (matching web QuickStats widget) ───────────────────
function QuickStatCard({ label, value, emoji, color, subtitle }) {
    return (
        <View style={[qsStyles.card, { borderColor: color + "33" }]}>
            <View
                style={[qsStyles.iconBadge, { backgroundColor: color + "18" }]}
            >
                <Text style={qsStyles.icon}>{emoji}</Text>
            </View>
            <Text
                style={[qsStyles.value, { color }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
            >
                {value ?? "—"}
            </Text>
            <Text style={qsStyles.label} numberOfLines={2}>
                {label}
            </Text>
            {subtitle ? (
                <Text style={qsStyles.subtitle}>{subtitle}</Text>
            ) : null}
        </View>
    );
}

const qsStyles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        alignItems: "center",
        borderWidth: 1,
        ...shadows.sm,
    },
    iconBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.xs,
    },
    icon: { fontSize: 20 },
    value: {
        fontSize: typography.fontSize2XL,
        fontWeight: typography.fontWeightExtraBold,
    },
    label: {
        color: colors.textSecondary,
        fontSize: 11,
        textAlign: "center",
        marginTop: 2,
    },
    subtitle: { color: colors.textMuted, fontSize: 10, marginTop: 1 },
});

// ── Action Card (matching web feature cards) ─────────────────────
function ActionCard({ action, onPress }) {
    return (
        <TouchableOpacity
            style={[
                actStyles.card,
                { backgroundColor: action.bg, borderColor: action.border },
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={actStyles.row}>
                <View
                    style={[
                        actStyles.iconCircle,
                        { backgroundColor: action.color + "22" },
                    ]}
                >
                    <Text style={actStyles.emoji}>{action.emoji}</Text>
                </View>
                <View style={actStyles.textWrap}>
                    <Text style={[actStyles.title, { color: action.color }]}>
                        {action.title}
                    </Text>
                    <Text style={actStyles.subtitle}>{action.subtitle}</Text>
                </View>
                <Text style={[actStyles.arrow, { color: action.color }]}>
                    →
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const actStyles = StyleSheet.create({
    card: {
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        ...shadows.sm,
    },
    row: { flexDirection: "row", alignItems: "center" },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginRight: spacing.sm,
    },
    emoji: { fontSize: 20 },
    textWrap: { flex: 1 },
    title: {
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightBold,
    },
    subtitle: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeXS,
        marginTop: 1,
    },
    arrow: {
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightBold,
    },
});

// ── Main Screen ───────────────────────────────────────────────────
export default function DashboardScreen({ navigation }) {
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const dailyQuote = getDailyQuote();

    const [stats, setStats] = useState(null);
    const [coinBalance, setCoinBalance] = useState(null);
    const [dailyChallenge, setDailyChallenge] = useState(null);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    async function loadData(mounted) {
        try {
            const [statsData, coinsData, challengeData, activityData] =
                await Promise.allSettled([
                    cache.fetchWithCache(
                        CACHE_KEYS.DASHBOARD_STATS,
                        () => userApi.getDashboardStats(),
                        CACHE_TTL.MEDIUM,
                        (fresh) => setStats(fresh),
                    ),
                    cache.fetchWithCache(
                        CACHE_KEYS.COIN_BALANCE,
                        () => coinsApi.getBalance(),
                        CACHE_TTL.SHORT,
                        (fresh) =>
                            setCoinBalance(fresh?.balance ?? fresh?.coins ?? 0),
                    ),
                    cache.fetchWithCache(
                        CACHE_KEYS.DAILY_CHALLENGE,
                        () => dsaApi.getDailyChallenge(),
                        CACHE_TTL.LONG,
                        (fresh) => setDailyChallenge(fresh),
                    ),
                    cache.fetchWithCache(
                        CACHE_KEYS.ACTIVITY,
                        () => userApi.getActivity(),
                        CACHE_TTL.MEDIUM,
                        (fresh) => {
                            const arr = Array.isArray(fresh) ? fresh : [];
                            setActivity(
                                arr.filter((d) => (d.seconds_active || 0) > 0),
                            );
                        },
                    ),
                ]);
            if (!mounted) return;
            if (statsData.status === "fulfilled") setStats(statsData.value);
            if (!mounted) return;
            if (coinsData.status === "fulfilled")
                setCoinBalance(
                    coinsData.value?.balance ?? coinsData.value?.coins ?? 0,
                );
            if (!mounted) return;
            if (challengeData.status === "fulfilled")
                setDailyChallenge(challengeData.value);
            if (!mounted) return;
            if (activityData.status === "fulfilled") {
                const arr = Array.isArray(activityData.value)
                    ? activityData.value
                    : [];
                setActivity(arr.filter((d) => (d.seconds_active || 0) > 0));
            }
        } catch {
            /* partial data is ok */
        } finally {
            if (mounted) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    }

    useFocusEffect(
        useCallback(() => {
            let mounted = true;
            setLoading(true);
            loadData(mounted);
            return () => {
                mounted = false;
            };
        }, []),
    );

    function handleAction(action) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        if (action.screen) {
            navigation.navigate(action.screen);
        } else {
            navigation.navigate(action.tab);
        }
    }

    const firstName =
        user?.fullName?.split(" ")[0] ||
        user?.full_name?.split(" ")[0] ||
        "Engineer";

    if (loading && !refreshing) {
        return (
            <LoadingSpinner fullScreen message="Loading your dashboard..." />
        );
    }

    // Build stats array matching web dashboard QuickStats widget
    const quickStats = [
        {
            label: "Day Streak",
            value:
                stats?.currentStreak != null ? `${stats.currentStreak}` : "—",
            emoji: "🔥",
            color: "#fbbf24",
            subtitle: "days active",
        },
        {
            label: "Problems",
            value: stats?.problemsSolved ?? "—",
            emoji: "✅",
            color: "#34d399",
            subtitle: "solved",
        },
        {
            label: "Avg Score",
            value: stats?.avgScore != null ? `${stats.avgScore}%` : "—",
            emoji: "🎯",
            color: "#a78bfa",
            subtitle: "in interviews",
        },
        {
            label: "Interviews",
            value: stats?.totalInterviews ?? "—",
            emoji: "💬",
            color: "#60a5fa",
            subtitle: "completed",
        },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

            {/* Ambient orbs (same as landing screen) */}
            <View style={styles.orb1} />
            <View style={styles.orb2} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            loadData();
                        }}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                {/* ── Hero Header ── matching web "Good morning, [name]" */}
                <LinearGradient
                    colors={["#0a0a0e", "#070709"]}
                    style={[
                        styles.heroHeader,
                        {
                            paddingTop: Math.max(
                                insets.top + spacing.sm,
                                spacing.lg,
                            ),
                        },
                    ]}
                >
                    <View style={styles.heroRow}>
                        <View style={styles.heroLeft}>
                            <Text style={styles.greeting}>
                                {getGreeting()},{" "}
                                <Text style={styles.greetingName}>
                                    {firstName}
                                </Text>{" "}
                                👋
                            </Text>
                            {/* Daily quote — matching web dashboard */}
                            <Text style={styles.dailyQuote} numberOfLines={2}>
                                "{dailyQuote.text}"
                                <Text style={styles.dailyQuoteAuthor}>
                                    {" "}
                                    — {dailyQuote.author}
                                </Text>
                            </Text>
                        </View>
                        {/* Coin balance badge */}
                        <TouchableOpacity
                            onPress={() => navigation.navigate("CoinWallet")}
                            style={styles.coinBadge}
                        >
                            <Text style={styles.coinEmoji}>🪙</Text>
                            <Text style={styles.coinValue}>
                                {coinBalance ?? "—"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Start Mock Interview CTA — matching web dashboard */}
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() =>
                            navigation.navigate("Interview", {
                                screen: "AIInterview",
                                params: {
                                    interviewType: {
                                        id: "technical",
                                        title: "Technical Interview",
                                        emoji: "💻",
                                    },
                                },
                            })
                        }
                        style={styles.mockInterviewBtn}
                    >
                        <LinearGradient
                            colors={["#8b5cf6", "#6d28d9"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.mockInterviewGradient}
                        >
                            <Text style={styles.mockInterviewIcon}>✨</Text>
                            <Text style={styles.mockInterviewText}>
                                Start Mock Interview
                            </Text>
                            <Text style={styles.mockInterviewArrow}>→</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </LinearGradient>

                <View style={styles.body}>
                    {/* ── Quick Stats — matching web QuickStats widget ── */}
                    <Text style={styles.sectionTitle}>Your Progress</Text>
                    <View style={styles.statsRow}>
                        {quickStats.slice(0, 2).map((s, i) => (
                            <React.Fragment key={s.label}>
                                <QuickStatCard {...s} />
                                {i === 0 && <View style={styles.statGap} />}
                            </React.Fragment>
                        ))}
                    </View>
                    <View style={[styles.statsRow, { marginTop: spacing.sm }]}>
                        {quickStats.slice(2).map((s, i) => (
                            <React.Fragment key={s.label}>
                                <QuickStatCard {...s} />
                                {i === 0 && <View style={styles.statGap} />}
                            </React.Fragment>
                        ))}
                    </View>

                    {/* ── Daily Challenge ── */}
                    {dailyChallenge && (
                        <>
                            <Text style={styles.sectionTitle}>
                                Today's Challenge 🔥
                            </Text>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate("DSA")}
                            >
                                <Card
                                    accent={colors.warning}
                                    elevated
                                    style={styles.challengeCard}
                                >
                                    <View style={styles.challengeRow}>
                                        <View style={styles.challengeInfo}>
                                            <Text style={styles.challengeTitle}>
                                                {dailyChallenge.title}
                                            </Text>
                                            <Text style={styles.challengeMeta}>
                                                {dailyChallenge.difficulty} ·{" "}
                                                {dailyChallenge.category}
                                            </Text>
                                        </View>
                                        <Text style={styles.challengeArrow}>
                                            →
                                        </Text>
                                    </View>
                                </Card>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* ── Quick Actions — matching web feature cards ── */}
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionsGrid}>
                        {QUICK_ACTIONS.map((action) => (
                            <ActionCard
                                key={action.id}
                                action={action}
                                onPress={() => handleAction(action)}
                            />
                        ))}
                    </View>

                    {/* ── Weekly Activity ── */}
                    {activity.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>
                                Weekly Activity
                            </Text>
                            <Card elevated style={styles.activityCard}>
                                <View style={styles.activityBars}>
                                    {Array.from({ length: 7 }, (_, i) => {
                                        const date = new Date();
                                        date.setDate(date.getDate() - (6 - i));
                                        const dateStr = date
                                            .toISOString()
                                            .split("T")[0];
                                        const dayData = activity.find(
                                            (d) => d.date === dateStr,
                                        );
                                        const seconds =
                                            dayData?.seconds_active || 0;
                                        const maxSeconds = 3 * 3600; // 3 hours max
                                        const heightPct = Math.min(
                                            seconds / maxSeconds,
                                            1,
                                        );
                                        const dayName = date.toLocaleDateString(
                                            "en-US",
                                            { weekday: "short" },
                                        );
                                        const isToday = i === 6;
                                        const barColor = isToday
                                            ? colors.primary
                                            : seconds > 0
                                              ? "#34d399"
                                              : colors.border;
                                        return (
                                            <View
                                                key={i}
                                                style={styles.activityBarCol}
                                            >
                                                <View
                                                    style={
                                                        styles.activityBarTrack
                                                    }
                                                >
                                                    <View
                                                        style={[
                                                            styles.activityBarFill,
                                                            {
                                                                height: `${Math.max(heightPct * 100, seconds > 0 ? 8 : 0)}%`,
                                                                backgroundColor:
                                                                    barColor,
                                                            },
                                                        ]}
                                                    />
                                                </View>
                                                <Text
                                                    style={[
                                                        styles.activityDayLabel,
                                                        isToday && {
                                                            color: colors.primary,
                                                            fontWeight:
                                                                typography.fontWeightBold,
                                                        },
                                                    ]}
                                                >
                                                    {dayName}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                                <Text style={styles.activityFooter}>
                                    {activity.length} active day
                                    {activity.length !== 1 ? "s" : ""} this week
                                </Text>
                            </Card>
                        </>
                    )}

                    {/* ── Pro Banner (if subscribed) ── */}
                    {user?.subscriptionTier &&
                        user.subscriptionTier !== "free" && (
                            <Card style={styles.proBanner}>
                                <Text style={styles.proBannerText}>
                                    ✨ {user.subscriptionTier.toUpperCase()}{" "}
                                    Member — Unlimited interviews unlocked!
                                </Text>
                            </Card>
                        )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },

    // Ambient orbs
    orb1: {
        position: "absolute",
        top: 40,
        left: -60,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: "rgba(139,92,246,0.08)",
    },
    orb2: {
        position: "absolute",
        top: 200,
        right: -40,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: "rgba(59,130,246,0.06)",
    },

    // Hero header
    heroHeader: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
        zIndex: 10,
    },
    heroRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: spacing.md,
    },
    heroLeft: { flex: 1, marginRight: spacing.md },
    greeting: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeXL,
        fontWeight: typography.fontWeightExtraBold,
        marginBottom: 4,
    },
    greetingName: { color: "#a78bfa" },
    dailyQuote: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        lineHeight: 18,
        fontStyle: "italic",
    },
    dailyQuoteAuthor: {
        color: colors.textMuted,
        fontStyle: "normal",
        fontWeight: typography.fontWeightMedium,
    },
    coinBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.full,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderWidth: 1,
        borderColor: "#fbbf2444",
    },
    coinEmoji: { fontSize: 15, marginRight: 3 },
    coinValue: {
        color: colors.warning,
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightBold,
    },

    // "Start Mock Interview" CTA — matching web
    mockInterviewBtn: {
        borderRadius: borderRadius.full,
        overflow: "hidden",
        alignSelf: "flex-start",
        shadowColor: "#8b5cf6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    mockInterviewGradient: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.full,
        gap: spacing.xs,
    },
    mockInterviewIcon: { fontSize: 16 },
    mockInterviewText: {
        color: "#fff",
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightBold,
    },
    mockInterviewArrow: { color: "#fff", fontSize: 14 },

    body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },

    sectionTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightBold,
        marginTop: spacing.xl,
        marginBottom: spacing.md,
    },

    // Stats
    statsRow: { flexDirection: "row" },
    statGap: { width: spacing.sm },

    // Challenge
    challengeCard: { marginBottom: spacing.xs },
    challengeRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    challengeInfo: { flex: 1 },
    challengeTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightSemiBold,
    },
    challengeMeta: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        marginTop: 2,
        textTransform: "capitalize",
    },
    challengeArrow: {
        color: colors.warning,
        fontSize: typography.fontSizeXL,
        marginLeft: spacing.sm,
    },

    // Actions
    actionsGrid: { gap: spacing.sm },

    // Activity
    activityCard: {},
    activityBars: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        height: 80,
        marginBottom: spacing.sm,
    },
    activityBarCol: { flex: 1, alignItems: "center" },
    activityBarTrack: {
        width: "60%",
        height: 64,
        backgroundColor: colors.bgCardAlt,
        borderRadius: 4,
        overflow: "hidden",
        justifyContent: "flex-end",
        borderWidth: 1,
        borderColor: colors.border,
    },
    activityBarFill: {
        width: "100%",
        borderRadius: 4,
        minHeight: 0,
    },
    activityDayLabel: {
        color: colors.textMuted,
        fontSize: 10,
        marginTop: 4,
    },
    activityFooter: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeXS,
        textAlign: "center",
        marginTop: spacing.xs,
    },

    // Pro
    proBanner: {
        marginTop: spacing.lg,
        backgroundColor: "rgba(139,92,246,0.08)",
        borderColor: "#8b5cf633",
    },
    proBannerText: {
        color: "#a78bfa",
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightSemiBold,
        textAlign: "center",
    },
});
