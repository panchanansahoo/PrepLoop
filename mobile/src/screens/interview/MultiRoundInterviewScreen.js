import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
} from "react-native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { Ionicons } from "@expo/vector-icons";

const ROUNDS = [
    {
        id: 1,
        title: "Screening",
        duration: "30 mins",
        type: "HR & Behavioral",
        status: "completed",
    },
    {
        id: 2,
        title: "Technical Round 1",
        duration: "45 mins",
        type: "DSA & Problem Solving",
        status: "locked",
    },
    {
        id: 3,
        title: "Technical Round 2",
        duration: "60 mins",
        type: "System Design",
        status: "locked",
    },
    {
        id: 4,
        title: "Hiring Manager",
        duration: "30 mins",
        type: "Cultural Fit & Vision",
        status: "locked",
    },
];

export default function MultiRoundInterviewScreen({ navigation }) {
    const [currentRound, setCurrentRound] = useState(2); // Mock: round 2 is unlocked next

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScreenHeader
                title="Multi-Round Interview"
                onBack={() => navigation.goBack()}
            />

            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.heroSection}>
                    <View style={styles.iconCircle}>
                        <Ionicons
                            name="layers-outline"
                            size={32}
                            color={colors.primary}
                        />
                    </View>
                    <Text style={styles.heroTitle}>Full Loop Simulation</Text>
                    <Text style={styles.heroSubtitle}>
                        Experience a complete end-to-end interview process with
                        4 stages, just like top tech companies.
                    </Text>
                </View>

                <View style={styles.roundsContainer}>
                    {ROUNDS.map((round, index) => {
                        const isUnlocked = round.id <= currentRound;
                        const isCurrent = round.id === currentRound;
                        const isCompleted = round.id < currentRound;

                        return (
                            <View
                                key={round.id}
                                style={styles.roundCardWrapper}
                            >
                                {index !== ROUNDS.length - 1 && (
                                    <View
                                        style={[
                                            styles.connector,
                                            isCompleted &&
                                                styles.connectorActive,
                                        ]}
                                    />
                                )}

                                <TouchableOpacity
                                    style={[
                                        styles.roundCard,
                                        isCurrent && styles.roundCardCurrent,
                                        !isUnlocked && styles.roundCardLocked,
                                    ]}
                                    activeOpacity={0.8}
                                    disabled={!isUnlocked}
                                    onPress={() =>
                                        navigation.navigate("AIInterview", {
                                            interviewType: round,
                                        })
                                    }
                                >
                                    <View style={styles.roundHeader}>
                                        <View style={styles.roundIconContainer}>
                                            {isCompleted ? (
                                                <Ionicons
                                                    name="checkmark-circle"
                                                    size={24}
                                                    color={colors.success}
                                                />
                                            ) : !isUnlocked ? (
                                                <Ionicons
                                                    name="lock-closed"
                                                    size={20}
                                                    color={colors.textMuted}
                                                />
                                            ) : (
                                                <View
                                                    style={styles.activeDot}
                                                />
                                            )}
                                        </View>
                                        <View style={styles.roundInfo}>
                                            <Text
                                                style={[
                                                    styles.roundTitle,
                                                    !isUnlocked &&
                                                        styles.textLocked,
                                                ]}
                                            >
                                                Round {round.id}: {round.title}
                                            </Text>
                                            <Text style={styles.roundType}>
                                                {round.type}
                                            </Text>
                                        </View>
                                        <View style={styles.durationBadge}>
                                            <Ionicons
                                                name="time-outline"
                                                size={12}
                                                color={colors.textSecondary}
                                            />
                                            <Text style={styles.durationText}>
                                                {round.duration}
                                            </Text>
                                        </View>
                                    </View>

                                    {isCurrent && (
                                        <View style={styles.currentAction}>
                                            <Text
                                                style={styles.currentActionText}
                                            >
                                                Start Next Round
                                            </Text>
                                            <Ionicons
                                                name="arrow-forward"
                                                size={16}
                                                color={colors.primary}
                                            />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>

                <View style={styles.disclaimer}>
                    <Ionicons
                        name="information-circle-outline"
                        size={16}
                        color={colors.textSecondary}
                    />
                    <Text style={styles.disclaimerText}>
                        You must pass each round to unlock the next one.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bg },
    container: { padding: spacing.md, paddingBottom: spacing.xxl },
    heroSection: {
        alignItems: "center",
        marginBottom: spacing.xl,
        marginTop: spacing.md,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.primary + "20",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.md,
    },
    heroTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeXL,
        fontWeight: typography.fontWeightBold,
        marginBottom: spacing.xs,
    },
    heroSubtitle: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        textAlign: "center",
        paddingHorizontal: spacing.xl,
        lineHeight: 20,
    },
    roundsContainer: { paddingLeft: spacing.sm },
    roundCardWrapper: { position: "relative", marginBottom: spacing.lg },
    connector: {
        position: "absolute",
        left: 24,
        top: 40,
        bottom: -20,
        width: 2,
        backgroundColor: colors.borderLight,
        zIndex: -1,
    },
    connectorActive: { backgroundColor: colors.primary },
    roundCard: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    roundCardCurrent: {
        borderColor: colors.primary,
        backgroundColor: colors.bgCardAlt,
    },
    roundCardLocked: { opacity: 0.6, backgroundColor: colors.bg },
    roundHeader: { flexDirection: "row", alignItems: "flex-start" },
    roundIconContainer: {
        width: 32,
        alignItems: "center",
        marginRight: spacing.sm,
        paddingTop: 2,
    },
    activeDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.primary,
        marginTop: 4,
    },
    roundInfo: { flex: 1 },
    roundTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightSemiBold,
        marginBottom: 2,
    },
    textLocked: { color: colors.textMuted },
    roundType: { color: colors.textSecondary, fontSize: typography.fontSizeSM },
    durationBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.bgInput,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
        gap: 4,
    },
    durationText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeXS,
    },
    currentAction: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        gap: 4,
    },
    currentActionText: {
        color: colors.primary,
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightSemiBold,
    },
    disclaimer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: spacing.xl,
        gap: 6,
        opacity: 0.8,
    },
    disclaimerText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeXS,
    },
});
