import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    StatusBar,
    RefreshControl,
} from "react-native";
import { dsaApi } from "../../api/dsaApi";
import { cache, CACHE_KEYS, CACHE_TTL } from "../../utils/cache";
import { Card } from "../../components/Card";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { ErrorMessage } from "../../components/ErrorMessage";
import { TagBadge } from "../../components/TagBadge";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PATTERN_EMOJIS = {
    Arrays: "📊",
    Strings: "🔤",
    "Linked Lists": "🔗",
    Trees: "🌳",
    Graphs: "🕸️",
    "Dynamic Programming": "🧮",
    Recursion: "🔄",
    Sorting: "📋",
    Searching: "🔍",
    "Stacks & Queues": "📚",
    "Hash Maps": "🗺️",
    Heaps: "⛰️",
    Greedy: "💡",
    Backtracking: "↩️",
    "Two Pointers": "👆",
    "Sliding Window": "🪟",
    "Binary Search": "⚡",
    "Bit Manipulation": "💻",
};

function PatternCard({ pattern, onPress }) {
    const emoji = PATTERN_EMOJIS[pattern.name] || "🧩";
    // Backend returns problem_count (from patterns table with embedded count)
    const total =
        pattern.problem_count || pattern.total || pattern.problemCount || 0;
    const easy = pattern.easy_count || pattern.easy || 0;
    const medium = pattern.medium_count || pattern.medium || 0;
    const hard = pattern.hard_count || pattern.hard || 0;

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            <Card style={styles.patternCard} elevated>
                <View style={styles.patternRow}>
                    <View style={styles.patternLeft}>
                        <View style={styles.emojiCircle}>
                            <Text style={styles.emoji}>{emoji}</Text>
                        </View>
                        <View style={styles.patternInfo}>
                            <Text style={styles.patternName}>
                                {pattern.name}
                            </Text>
                            <Text style={styles.patternCount}>
                                {total} problems
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.arrow}>→</Text>
                </View>
                {(easy || medium || hard) > 0 && (
                    <View style={styles.tagRow}>
                        {easy > 0 && (
                            <TagBadge
                                label={`${easy} Easy`}
                                difficulty="easy"
                            />
                        )}
                        {medium > 0 && (
                            <TagBadge
                                label={`${medium} Medium`}
                                difficulty="medium"
                            />
                        )}
                        {hard > 0 && (
                            <TagBadge
                                label={`${hard} Hard`}
                                difficulty="hard"
                            />
                        )}
                    </View>
                )}
            </Card>
        </TouchableOpacity>
    );
}

export default function DSAPatternsScreen({ navigation }) {
    const [patterns, setPatterns] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const insets = useSafeAreaInsets();

    async function loadPatterns() {
        try {
            setError("");
            const data = await cache.fetchWithCache(
                CACHE_KEYS.DSA_PATTERNS,
                () => dsaApi.getPatterns(),
                CACHE_TTL.VERY_LONG,
                (fresh) => {
                    const freshList = Array.isArray(fresh)
                        ? fresh
                        : fresh.patterns || fresh.data || [];
                    setPatterns(freshList);
                    setFiltered(freshList);
                },
            );
            const list = Array.isArray(data)
                ? data
                : data.patterns || data.data || [];
            setPatterns(list);
            setFiltered(list);
        } catch (err) {
            setError(
                err?.response?.data?.message || "Failed to load patterns.",
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        loadPatterns();
    }, []);

    useEffect(() => {
        if (!search.trim()) {
            setFiltered(patterns);
        } else {
            const q = search.toLowerCase();
            setFiltered(
                patterns.filter((p) => p.name?.toLowerCase().includes(q)),
            );
        }
    }, [search, patterns]);

    if (loading)
        return <LoadingSpinner fullScreen message="Loading DSA patterns..." />;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

            <View
                style={[
                    styles.header,
                    {
                        paddingTop: Math.max(
                            insets.top + spacing.sm,
                            spacing.lg,
                        ),
                    },
                ]}
            >
                <Text style={styles.title}>DSA Practice</Text>
                <Text style={styles.subtitle}>
                    Master patterns, ace interviews
                </Text>
                <View style={styles.searchBox}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search patterns..."
                        placeholderTextColor={colors.textMuted}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            {error ? (
                <ErrorMessage message={error} onRetry={loadPatterns} />
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item, i) =>
                        item.id?.toString() || item.name || String(i)
                    }
                    renderItem={({ item }) => (
                        <PatternCard
                            pattern={item}
                            onPress={() =>
                                navigation.navigate("DSAProblem", {
                                    patternId: item.id,
                                    patternName: item.name,
                                })
                            }
                        />
                    )}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                loadPatterns();
                            }}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <Text style={styles.emptyEmoji}>🧩</Text>
                            <Text style={styles.emptyText}>
                                No patterns found
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        backgroundColor: colors.bgCardAlt,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        color: colors.textPrimary,
        fontSize: typography.fontSize2XL,
        fontWeight: typography.fontWeightExtraBold,
    },
    subtitle: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        marginTop: 2,
        marginBottom: spacing.md,
    },
    // Web input: rgba(255,255,255,0.05) bg + rgba(255,255,255,0.1) border
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        paddingHorizontal: spacing.md,
    },
    searchIcon: { fontSize: 15, marginRight: spacing.xs, opacity: 0.5 },
    searchInput: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: typography.fontSizeMD,
        paddingVertical: 10,
    },
    list: { padding: spacing.md, gap: spacing.sm },
    patternCard: { marginBottom: 0 },
    patternRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    patternLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
    emojiCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.bgCardAlt,
        alignItems: "center",
        justifyContent: "center",
        marginRight: spacing.md,
    },
    emoji: { fontSize: 22 },
    patternInfo: { flex: 1 },
    patternName: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightSemiBold,
    },
    patternCount: {
        color: colors.textMuted,
        fontSize: typography.fontSizeSM,
        marginTop: 2,
    },
    arrow: { color: "rgba(203,213,225,0.5)", fontSize: typography.fontSizeLG },
    tagRow: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.sm },
    emptyWrap: { alignItems: "center", paddingTop: spacing.xxl },
    emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
    emptyText: { color: colors.textSecondary, fontSize: typography.fontSizeMD },
});
