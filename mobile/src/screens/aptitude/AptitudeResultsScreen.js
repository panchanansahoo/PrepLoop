import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { Ionicons } from "@expo/vector-icons";

export default function AptitudeResultsScreen({ route, navigation }) {
    const { score = 0, total = 0, title = "Aptitude Test" } = route.params || {};
    
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    
    let resultStatus = "Needs Improvement";
    let statusColor = colors.error;
    let iconName = "alert-circle";
    
    if (percentage >= 80) {
        resultStatus = "Excellent!";
        statusColor = colors.success;
        iconName = "trophy";
    } else if (percentage >= 50) {
        resultStatus = "Good Job";
        statusColor = colors.warning;
        iconName = "thumbs-up";
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Test Results</Text>
                    <Text style={styles.headerSubtitle}>{title}</Text>
                </View>

                <LinearGradient
                    colors={[colors.bgCard, colors.bgCardAlt]}
                    style={styles.scoreCard}
                >
                    <View style={[styles.iconContainer, { backgroundColor: statusColor + "20" }]}>
                        <Ionicons name={iconName} size={40} color={statusColor} />
                    </View>
                    
                    <Text style={styles.statusText}>{resultStatus}</Text>
                    
                    <View style={styles.scoreCircle}>
                        <Text style={styles.scoreBigText}>{score}</Text>
                        <Text style={styles.scoreSmallText}>/ {total}</Text>
                    </View>
                    
                    <Text style={styles.percentageText}>{percentage}% Correct</Text>
                </LinearGradient>

                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{score}</Text>
                        <Text style={styles.statLabel}>Correct</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{total - score}</Text>
                        <Text style={styles.statLabel}>Incorrect</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{total}</Text>
                        <Text style={styles.statLabel}>Attempted</Text>
                    </View>
                </View>

                <View style={styles.actionContainer}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.replace("AptitudePractice", { title })}
                    >
                        <Text style={styles.primaryButtonText}>Retake Test</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => navigation.navigate("AptitudeHub")}
                    >
                        <Text style={styles.secondaryButtonText}>Back to Hub</Text>
                    </TouchableOpacity>
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
    container: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
        alignItems: "center",
    },
    header: {
        alignItems: "center",
        marginTop: spacing.xl,
        marginBottom: spacing.xl,
    },
    headerTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSize2XL,
        fontWeight: typography.fontWeightBold,
        marginBottom: spacing.xs,
    },
    headerSubtitle: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeMD,
    },
    scoreCard: {
        width: "100%",
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.borderLight,
        marginBottom: spacing.xl,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.md,
    },
    statusText: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeXL,
        fontWeight: typography.fontWeightSemiBold,
        marginBottom: spacing.lg,
    },
    scoreCircle: {
        flexDirection: "row",
        alignItems: "baseline",
        marginBottom: spacing.sm,
    },
    scoreBigText: {
        color: colors.primary,
        fontSize: 48,
        fontWeight: typography.fontWeightExtraBold,
    },
    scoreSmallText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeXL,
        fontWeight: typography.fontWeightMedium,
        marginLeft: spacing.xs,
    },
    percentageText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeMD,
    },
    statsContainer: {
        flexDirection: "row",
        width: "100%",
        justifyContent: "space-between",
        marginBottom: spacing.xxl,
    },
    statBox: {
        flex: 1,
        backgroundColor: colors.bgCard,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.borderLight,
        marginHorizontal: spacing.xs,
    },
    statValue: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeXL,
        fontWeight: typography.fontWeightBold,
        marginBottom: 4,
    },
    statLabel: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeXS,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    actionContainer: {
        width: "100%",
        gap: spacing.md,
    },
    primaryButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: "center",
        width: "100%",
    },
    primaryButtonText: {
        color: "#fff",
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightSemiBold,
    },
    secondaryButton: {
        backgroundColor: "transparent",
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: "center",
        width: "100%",
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    secondaryButtonText: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightMedium,
    },
});
