import React from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Card } from "../../components/Card";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const INTERVIEW_TYPES = [
    {
        id: "technical",
        emoji: "💻",
        title: "Technical Interview",
        description:
            "Core CS concepts, coding problems, algorithms and data structures",
        difficulty: "Medium",
        duration: "30-45 min",
        gradient: ["#7c3aed", "#6366f1"],
        tags: ["Coding", "DSA", "CS Fundamentals"],
    },
    {
        id: "hr",
        emoji: "🤝",
        title: "HR Interview",
        description:
            "Behavioral questions, culture fit, situational and STAR method responses",
        difficulty: "Easy",
        duration: "20-30 min",
        gradient: ["#0891b2", "#0e7490"],
        tags: ["Behavioral", "STAR Method", "Culture Fit"],
    },
    {
        id: "system_design",
        emoji: "🏗️",
        title: "System Design",
        description:
            "Design scalable distributed systems, architecture discussions",
        difficulty: "Hard",
        duration: "45-60 min",
        gradient: ["#d97706", "#b45309"],
        tags: ["Architecture", "Scalability", "Databases"],
    },
    {
        id: "dsa",
        emoji: "🧩",
        title: "DSA Interview",
        description:
            "Focused on data structures, algorithms, time/space complexity",
        difficulty: "Hard",
        duration: "30-45 min",
        gradient: ["#059669", "#047857"],
        tags: ["Arrays", "Trees", "DP", "Graphs"],
    },
    {
        id: "behavioral",
        emoji: "🧠",
        title: "Behavioral Interview",
        description:
            "Leadership, conflict resolution, teamwork and growth mindset",
        difficulty: "Easy",
        duration: "20-30 min",
        gradient: ["#dc2626", "#b91c1c"],
        tags: ["Leadership", "Teamwork", "Growth"],
    },
    {
        id: "mixed",
        emoji: "🎯",
        title: "Mixed Round",
        description:
            "Combination of technical and behavioral — simulates real interviews",
        difficulty: "Medium",
        duration: "45-60 min",
        gradient: ["#7c3aed", "#4f46e5"],
        tags: ["Technical", "Behavioral", "Mixed"],
    },
];

const DIFFICULTY_COLORS = {
    Easy: colors.success,
    Medium: colors.warning,
    Hard: colors.error,
};

function InterviewTypeCard({ type, onPress }) {
    const diffColor = DIFFICULTY_COLORS[type.difficulty] || colors.primary;
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
            <Card elevated style={styles.typeCard}>
                <View style={styles.cardHeader}>
                    <LinearGradient
                        colors={type.gradient}
                        style={styles.emojiBox}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={styles.typeEmoji}>{type.emoji}</Text>
                    </LinearGradient>
                    <View style={styles.cardMeta}>
                        <View
                            style={[
                                styles.diffBadge,
                                {
                                    backgroundColor: diffColor + "22",
                                    borderColor: diffColor + "66",
                                },
                            ]}
                        >
                            <Text
                                style={[styles.diffText, { color: diffColor }]}
                            >
                                {type.difficulty}
                            </Text>
                        </View>
                        <Text style={styles.duration}>⏱ {type.duration}</Text>
                    </View>
                </View>
                <Text style={styles.typeTitle}>{type.title}</Text>
                <Text style={styles.typeDesc}>{type.description}</Text>
                <View style={styles.tagRow}>
                    {type.tags.map((tag) => (
                        <View key={tag} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                        </View>
                    ))}
                </View>
                <View style={styles.startRow}>
                    <Text style={styles.startText}>Start Interview</Text>
                    <Text style={styles.startArrow}>→</Text>
                </View>
            </Card>
        </TouchableOpacity>
    );
}

export default function InterviewHubScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
            <ScrollView showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={["#0a0a0e", "#070709"]}
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
                    <Text style={styles.headerTitle}>🤖 Interview Hub</Text>
                    <Text style={styles.headerSub}>
                        Choose your interview type and practice with AI
                    </Text>
                </LinearGradient>

                <View style={styles.body}>
                    <View style={styles.historyRow}>
                        <TouchableOpacity
                            style={styles.historyBtn}
                            onPress={() =>
                                navigation.navigate("InterviewHistory")
                            }
                        >
                            <Text style={styles.historyText}>
                                📋 View History
                            </Text>
                            <Text style={styles.historyArrow}>→</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.historyBtn}
                            onPress={() =>
                                navigation.navigate("InterviewAnalytics")
                            }
                        >
                            <Text style={styles.historyText}>
                                📊 Analytics
                            </Text>
                            <Text style={styles.historyArrow}>→</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.historyBtn}
                            onPress={() =>
                                navigation.navigate("ImprovementPlan")
                            }
                        >
                            <Text style={styles.historyText}>
                                📈 Improvement Plan
                            </Text>
                            <Text style={styles.historyArrow}>→</Text>
                        </TouchableOpacity>
                    </View>

                    {INTERVIEW_TYPES.map((type) => (
                        <InterviewTypeCard
                            key={type.id}
                            type={type}
                            onPress={() =>
                                navigation.navigate("AIInterview", {
                                    interviewType: type,
                                })
                            }
                        />
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
    },
    headerTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSize2XL,
        fontWeight: typography.fontWeightExtraBold,
    },
    headerSub: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeMD,
        marginTop: spacing.xs,
    },
    body: { padding: spacing.lg, gap: spacing.md },
    historyRow: { marginBottom: spacing.sm, gap: spacing.sm },
    historyBtn: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    historyText: {
        color: colors.primary,
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightSemiBold,
    },
    historyArrow: { color: colors.primary, fontSize: typography.fontSizeLG },
    typeCard: { marginBottom: 0 },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: spacing.sm,
    },
    emojiBox: {
        width: 52,
        height: 52,
        borderRadius: borderRadius.md,
        alignItems: "center",
        justifyContent: "center",
    },
    typeEmoji: { fontSize: 26 },
    cardMeta: { alignItems: "flex-end", gap: spacing.xs },
    diffBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
        borderWidth: 1,
    },
    diffText: {
        fontSize: typography.fontSizeXS,
        fontWeight: typography.fontWeightBold,
    },
    duration: { color: colors.textMuted, fontSize: typography.fontSizeXS },
    typeTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightBold,
        marginBottom: spacing.xs,
    },
    typeDesc: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        lineHeight: 20,
        marginBottom: spacing.sm,
    },
    tagRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.xs,
        marginBottom: spacing.md,
    },
    tag: {
        backgroundColor: colors.bgCardAlt,
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    tagText: { color: colors.textMuted, fontSize: typography.fontSizeXS },
    startRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: spacing.sm,
    },
    startText: {
        color: colors.primary,
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightSemiBold,
        marginRight: 4,
    },
    startArrow: { color: colors.primary, fontSize: typography.fontSizeMD },
});
