import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    StatusBar,
    RefreshControl,
} from "react-native";
import { dsaApi } from "../../api/dsaApi";
import { Card } from "../../components/Card";
import { TagBadge } from "../../components/TagBadge";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { ErrorMessage } from "../../components/ErrorMessage";
import { EmptyState } from "../../components/EmptyState";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DIFFICULTY_FILTERS = ["All", "Easy", "Medium", "Hard"];

const DIFFICULTY_COLORS = {
    easy: colors.success,
    medium: colors.warning,
    hard: colors.error,
};

function ProblemCard({ problem, onPress }) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            <Card style={styles.problemCard} elevated>
                <View style={styles.problemHeader}>
                    <Text style={styles.problemTitle} numberOfLines={2}>
                        {problem.title}
                    </Text>
                    <TagBadge
                        label={problem.difficulty}
                        difficulty={problem.difficulty?.toLowerCase()}
                    />
                </View>
                {problem.category && (
                    <Text style={styles.category}>{problem.category}</Text>
                )}
                <View style={styles.metaRow}>
                    {problem.acceptance != null && (
                        <Text style={styles.metaText}>
                            ✅ {Math.round(problem.acceptance * 100) / 100}%
                            accepted
                        </Text>
                    )}
                    {problem.companies?.length > 0 && (
                        <Text style={styles.metaText}>
                            🏢 {problem.companies.slice(0, 2).join(", ")}
                        </Text>
                    )}
                </View>
            </Card>
        </TouchableOpacity>
    );
}

export default function DSAProblemScreen({ route, navigation }) {
    const { patternId, patternName } = route.params || {};
    const insets = useSafeAreaInsets();
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [diffFilter, setDiffFilter] = useState("All");

    async function loadProblems() {
        try {
            setError("");
            const params = {};
            if (patternId) params.patternId = patternId;
            if (patternName) params.pattern = patternName;
            const data = await dsaApi.getProblems(params);
            const list = Array.isArray(data)
                ? data
                : data.problems || data.data || [];
            setProblems(list);
        } catch (err) {
            setError(
                err?.response?.data?.message || "Failed to load problems.",
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        loadProblems();
    }, [patternId, patternName]);

    const filtered =
        diffFilter === "All"
            ? problems
            : problems.filter(
                  (p) =>
                      p.difficulty?.toLowerCase() === diffFilter.toLowerCase(),
              );

    if (loading)
        return <LoadingSpinner fullScreen message="Loading problems..." />;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

            {/* Header */}
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
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                >
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>
                        {patternName || "Problems"}
                    </Text>
                    <Text style={styles.subtitle}>
                        {filtered.length} problems
                    </Text>
                </View>
            </View>

            {/* Difficulty Filter Tabs */}
            <View style={styles.filterRow}>
                {DIFFICULTY_FILTERS.map((d) => (
                    <TouchableOpacity
                        key={d}
                        style={[
                            styles.filterTab,
                            diffFilter === d && styles.filterTabActive,
                        ]}
                        onPress={() => setDiffFilter(d)}
                    >
                        <Text
                            style={[
                                styles.filterTabText,
                                diffFilter === d && styles.filterTabTextActive,
                            ]}
                        >
                            {d}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {error ? (
                <ErrorMessage message={error} onRetry={loadProblems} />
            ) : filtered.length === 0 ? (
                <EmptyState
                    emoji="📭"
                    title="No problems found"
                    message="Try a different difficulty filter."
                />
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item, i) => item.id?.toString() || String(i)}
                    renderItem={({ item }) => (
                        <ProblemCard
                            problem={item}
                            onPress={() =>
                                navigation.navigate("DSAProblemDetail", {
                                    problem: item,
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
                                loadProblems();
                            }}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                        />
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
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.bgCardAlt,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: { marginRight: spacing.md, padding: spacing.xs },
    backText: {
        color: "rgba(203,213,225,0.8)",
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightSemiBold,
    },
    title: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightBold,
    },
    subtitle: { color: colors.textSecondary, fontSize: typography.fontSizeSM },
    filterRow: {
        flexDirection: "row",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: spacing.sm,
    },
    filterTab: {
        paddingVertical: 6,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    filterTabActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterTabText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightMedium,
    },
    filterTabTextActive: {
        color: "#fff",
        fontWeight: typography.fontWeightBold,
    },
    list: { padding: spacing.md, gap: spacing.sm },
    problemCard: {},
    problemHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: spacing.xs,
    },
    problemTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightSemiBold,
        flex: 1,
        marginRight: spacing.sm,
    },
    category: {
        color: colors.textMuted,
        fontSize: typography.fontSizeXS,
        marginBottom: spacing.xs,
    },
    metaRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xs },
    metaText: { color: colors.textSecondary, fontSize: typography.fontSizeSM },
});
