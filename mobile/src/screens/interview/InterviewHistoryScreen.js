import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    StatusBar,
    RefreshControl,
    Modal,
    ScrollView,
} from "react-native";
import { interviewApi } from "../../api/interviewApi";
import { Card } from "../../components/Card";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { ErrorMessage } from "../../components/ErrorMessage";
import { EmptyState } from "../../components/EmptyState";
import { Button } from "../../components/Button";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function ScoreBadge({ score }) {
    if (score == null) return null;
    const s = Math.round(score);
    const color =
        s >= 80 ? colors.success : s >= 60 ? colors.warning : colors.error;
    return (
        <View
            style={[
                scoreBadgeStyles.badge,
                { backgroundColor: color + "22", borderColor: color + "66" },
            ]}
        >
            <Text style={[scoreBadgeStyles.text, { color }]}>{s}%</Text>
        </View>
    );
}

const scoreBadgeStyles = StyleSheet.create({
    badge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
        borderWidth: 1,
    },
    text: {
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightBold,
    },
});

function HistoryCard({ session, onPress }) {
    const date = new Date(
        session.completed_at ||
            session.createdAt ||
            session.created_at ||
            Date.now(),
    );
    const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            <Card elevated style={styles.histCard}>
                <View style={styles.histHeader}>
                    <View>
                        <Text style={styles.histType}>
                            {(
                                session.interview_type ||
                                session.type ||
                                "Interview"
                            )
                                .replace(/_/g, " ")
                                .replace(/-/g, " ")
                                .replace(/\b\w/g, (c) => c.toUpperCase())}
                        </Text>
                        <Text style={styles.histDate}>{dateStr}</Text>
                    </View>
                    <ScoreBadge
                        score={
                            session.overall_score ??
                            session.score ??
                            session.overallScore
                        }
                    />
                </View>
                {session.feedback?.summary && (
                    <Text style={styles.histSummary} numberOfLines={2}>
                        {session.feedback.summary}
                    </Text>
                )}
                <Text style={styles.histMore}>View feedback →</Text>
            </Card>
        </TouchableOpacity>
    );
}

function FeedbackModal({ session, onClose }) {
    const insets = useSafeAreaInsets();
    if (!session) return null;
    const feedback = session.feedback || {};
    const score =
        session.overall_score ?? session.score ?? session.overallScore ?? null;
    return (
        <Modal visible animationType="slide" onRequestClose={onClose}>
            <View style={modalStyles.container}>
                <View
                    style={[
                        modalStyles.header,
                        {
                            paddingTop: Math.max(
                                insets.top + spacing.sm,
                                spacing.lg,
                            ),
                        },
                    ]}
                >
                    <Text style={modalStyles.title}>Interview Feedback</Text>
                    <TouchableOpacity
                        onPress={onClose}
                        style={modalStyles.closeBtn}
                    >
                        <Text style={modalStyles.closeText}>✕</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={modalStyles.body}>
                    {/* Score */}
                    {score != null ? (
                        <View style={modalStyles.scoreRow}>
                            <Text style={modalStyles.scoreLabel}>
                                Overall Score
                            </Text>
                            <Text
                                style={[
                                    modalStyles.scoreValue,
                                    {
                                        color:
                                            score >= 80
                                                ? colors.success
                                                : score >= 60
                                                  ? colors.warning
                                                  : colors.error,
                                    },
                                ]}
                            >
                                {Math.round(score)}/100
                            </Text>
                        </View>
                    ) : (
                        <View style={modalStyles.noScoreRow}>
                            <Text style={modalStyles.noScoreText}>
                                Score not available
                            </Text>
                        </View>
                    )}

                    {/* Interview metadata */}
                    <View style={modalStyles.metaRow}>
                        {session.interview_type && (
                            <View style={modalStyles.metaChip}>
                                <Text style={modalStyles.metaText}>
                                    {session.interview_type
                                        .replace(/_/g, " ")
                                        .replace(/-/g, " ")
                                        .replace(/\b\w/g, (c) =>
                                            c.toUpperCase(),
                                        )}
                                </Text>
                            </View>
                        )}
                        {session.difficulty && (
                            <View style={modalStyles.metaChip}>
                                <Text style={modalStyles.metaText}>
                                    {session.difficulty
                                        .charAt(0)
                                        .toUpperCase() +
                                        session.difficulty.slice(1)}
                                </Text>
                            </View>
                        )}
                        {session.duration != null && (
                            <View style={modalStyles.metaChip}>
                                <Text style={modalStyles.metaText}>
                                    ⏱ {Math.round(session.duration / 60)} min
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Detailed feedback if available */}
                    {feedback.summary && (
                        <View style={modalStyles.section}>
                            <Text style={modalStyles.sectionTitle}>
                                📝 Summary
                            </Text>
                            <Text style={modalStyles.sectionText}>
                                {feedback.summary}
                            </Text>
                        </View>
                    )}
                    {feedback.strengths?.length > 0 && (
                        <View style={modalStyles.section}>
                            <Text style={modalStyles.sectionTitle}>
                                ✅ Strengths
                            </Text>
                            {feedback.strengths.map((s, i) => (
                                <Text key={i} style={modalStyles.bullet}>
                                    • {s}
                                </Text>
                            ))}
                        </View>
                    )}
                    {feedback.improvements?.length > 0 && (
                        <View style={modalStyles.section}>
                            <Text style={modalStyles.sectionTitle}>
                                📈 Improvements
                            </Text>
                            {feedback.improvements.map((s, i) => (
                                <Text key={i} style={modalStyles.bullet}>
                                    • {s}
                                </Text>
                            ))}
                        </View>
                    )}

                    {/* Fallback when no detailed feedback */}
                    {!feedback.summary && !feedback.strengths?.length && (
                        <View style={modalStyles.webHint}>
                            <Text style={modalStyles.webHintEmoji}>🌐</Text>
                            <Text style={modalStyles.webHintTitle}>
                                Want detailed feedback?
                            </Text>
                            <Text style={modalStyles.webHintText}>
                                Open PrepLoop on the web to view your full
                                AI-generated feedback, strengths, improvement
                                areas, and question-by-question breakdown.
                            </Text>
                        </View>
                    )}
                </ScrollView>
                <View style={modalStyles.footer}>
                    <Button
                        title="Close"
                        onPress={onClose}
                        variant="outline"
                        fullWidth
                    />
                </View>
            </View>
        </Modal>
    );
}

const modalStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightBold,
    },
    closeBtn: { padding: spacing.xs },
    closeText: { color: colors.textSecondary, fontSize: 20 },
    body: { padding: spacing.lg },
    scoreRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.04)",
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    scoreLabel: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeMD,
    },
    scoreValue: {
        fontSize: typography.fontSize2XL,
        fontWeight: typography.fontWeightExtraBold,
    },
    section: { marginBottom: spacing.lg },
    sectionTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightBold,
        marginBottom: spacing.sm,
    },
    sectionText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeMD,
        lineHeight: 22,
    },
    bullet: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        lineHeight: 22,
        marginLeft: spacing.sm,
    },
    footer: {
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    noScoreRow: {
        padding: spacing.md,
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        alignItems: "center",
    },
    noScoreText: { color: colors.textMuted, fontSize: typography.fontSizeSM },
    metaRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.xs,
        marginBottom: spacing.lg,
    },
    metaChip: {
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    metaText: { color: colors.textSecondary, fontSize: typography.fontSizeXS },
    webHint: {
        backgroundColor: "rgba(99,102,241,0.06)",
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(99,102,241,0.2)",
        marginTop: spacing.md,
    },
    webHintTitle: {
        color: "#818cf8",
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightBold,
        marginBottom: spacing.xs,
        textAlign: "center",
    },
    webHintText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        textAlign: "center",
        lineHeight: 20,
    },
});

export default function InterviewHistoryScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [selected, setSelected] = useState(null);

    async function load() {
        try {
            setError("");
            const data = await interviewApi.getHistory();
            const list = Array.isArray(data)
                ? data
                : data.interviews ||
                  data.sessions ||
                  data.history ||
                  data.data ||
                  [];
            setHistory(list);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to load history.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    if (loading)
        return <LoadingSpinner fullScreen message="Loading history..." />;

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
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                >
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Interview History</Text>
            </View>
            {error ? (
                <ErrorMessage message={error} onRetry={load} />
            ) : history.length === 0 ? (
                <EmptyState
                    emoji="📋"
                    title="No interviews yet"
                    message="Complete your first AI interview to see it here."
                    actionLabel="Start Interview"
                    onAction={() => navigation.navigate("InterviewHub")}
                />
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item, i) => item.id?.toString() || String(i)}
                    renderItem={({ item }) => (
                        <HistoryCard
                            session={item}
                            onPress={() => setSelected(item)}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                load();
                            }}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                        />
                    }
                />
            )}
            <FeedbackModal
                session={selected}
                onClose={() => setSelected(null)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
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
    list: { padding: spacing.md, gap: spacing.sm },
    histCard: {},
    histHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: spacing.xs,
    },
    histType: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightSemiBold,
        textTransform: "capitalize",
    },
    histDate: {
        color: colors.textMuted,
        fontSize: typography.fontSizeXS,
        marginTop: 2,
    },
    histSummary: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        lineHeight: 18,
        marginBottom: spacing.sm,
    },
    histMore: {
        color: "#818cf8",
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightMedium,
    },
});
