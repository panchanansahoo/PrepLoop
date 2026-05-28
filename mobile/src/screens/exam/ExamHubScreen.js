import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { Ionicons } from "@expo/vector-icons";

const EXAMS = [
    {
        id: "tcs-nqt",
        title: "TCS NQT Mock Exam",
        company: "Tata Consultancy Services",
        duration: "120 mins",
        questions: 90,
        tags: ["Cognitive", "IT Programming"],
        color: "#3b82f6",
    },
    {
        id: "infosys",
        title: "Infosys Certification",
        company: "Infosys",
        duration: "100 mins",
        questions: 65,
        tags: ["Reasoning", "Pseudo Code", "Puzzle"],
        color: "#06b6d4",
    },
    {
        id: "wipro-nlth",
        title: "Wipro NLTH",
        company: "Wipro",
        duration: "140 mins",
        questions: 100,
        tags: ["Aptitude", "Coding", "English"],
        color: "#8b5cf6",
    },
];

export default function ExamHubScreen({ navigation }) {
    const handleStartExam = (exam) => {
        navigation.navigate("ExamPractice", { examId: exam.id, title: exam.title });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mock Exams</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.heroSection}>
                    <Text style={styles.heroTitle}>Company Specific</Text>
                    <Text style={styles.heroSubtitle}>
                        Full-length mock exams designed to simulate the actual assessment experience.
                    </Text>
                </View>

                <View style={styles.grid}>
                    {EXAMS.map((exam) => (
                        <View key={exam.id} style={styles.cardWrapper}>
                            <LinearGradient
                                colors={[colors.bgCard, colors.bgCardAlt]}
                                style={styles.card}
                            >
                                <View style={styles.cardHeader}>
                                    <View>
                                        <Text style={styles.cardTitle}>{exam.title}</Text>
                                        <Text style={styles.cardCompany}>{exam.company}</Text>
                                    </View>
                                    <View style={[styles.iconContainer, { backgroundColor: exam.color + "20" }]}>
                                        <Ionicons name="business" size={24} color={exam.color} />
                                    </View>
                                </View>

                                <View style={styles.tagsContainer}>
                                    {exam.tags.map(tag => (
                                        <View key={tag} style={styles.tagBadge}>
                                            <Text style={styles.tagText}>{tag}</Text>
                                        </View>
                                    ))}
                                </View>

                                <View style={styles.statsContainer}>
                                    <View style={styles.statItem}>
                                        <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                                        <Text style={styles.statText}>{exam.duration}</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Ionicons name="list-outline" size={16} color={colors.textSecondary} />
                                        <Text style={styles.statText}>{exam.questions} Qs</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.startButton}
                                    onPress={() => handleStartExam(exam)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.startButtonText}>Start Mock Exam</Text>
                                    <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                                </TouchableOpacity>
                            </LinearGradient>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.bgOverlay,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.bgCard,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    headerTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightSemiBold,
    },
    container: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
    },
    heroSection: {
        marginBottom: spacing.xl,
        marginTop: spacing.md,
    },
    heroTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSize2XL,
        fontWeight: typography.fontWeightBold,
        marginBottom: spacing.xs,
    },
    heroSubtitle: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeMD,
        lineHeight: 22,
    },
    grid: {
        gap: spacing.lg,
    },
    cardWrapper: {
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.borderLight,
        overflow: "hidden",
    },
    card: {
        padding: spacing.lg,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: spacing.md,
    },
    cardTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightBold,
        marginBottom: 4,
    },
    cardCompany: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.md,
        alignItems: "center",
        justifyContent: "center",
    },
    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.xs,
        marginBottom: spacing.lg,
    },
    tagBadge: {
        backgroundColor: colors.bgInput,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    tagText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeXS,
    },
    statsContainer: {
        flexDirection: "row",
        gap: spacing.lg,
        marginBottom: spacing.lg,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    statItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    statText: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightMedium,
    },
    startButton: {
        flexDirection: "row",
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: "center",
        justifyContent: "center",
    },
    startButtonText: {
        color: "#fff",
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightSemiBold,
    },
});
