import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
} from "react-native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { EmptyState } from "../../components/EmptyState";
import { dsaApi } from "../../api/dsaApi";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";

export default function DailyChallengesScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [challenge, setChallenge] = useState(null);

    const loadData = async () => {
        try {
            // Note: getDailyChallenge might return null based on the API implementation.
            const data = await dsaApi.getDailyChallenge();
            setChallenge(data);
        } catch (error) {
            console.error("Failed to load daily challenge:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ScreenHeader
                    title="Daily Challenge"
                    onBack={() => navigation.goBack()}
                />
                <LoadingSpinner />
            </View>
        );
    }

    if (!challenge) {
        return (
            <View style={styles.container}>
                <ScreenHeader
                    title="Daily Challenge"
                    onBack={() => navigation.goBack()}
                />
                <EmptyState
                    icon="🎯"
                    title="No Challenge Today"
                    message="Check back tomorrow for a new daily challenge!"
                    actionLabel="Go to DSA Patterns"
                    onAction={() => navigation.navigate("DSAPatterns")}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Daily Challenge"
                onBack={() => navigation.goBack()}
            />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                    />
                }
            >
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.date}>
                            {challenge.date || "Today"}
                        </Text>
                        <View style={styles.streakBadge}>
                            <Text style={styles.streakText}>
                                🔥 {challenge.streak || 0} Day Streak
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.title}>
                        {challenge.title || "Daily Problem"}
                    </Text>
                    <Text style={styles.description} numberOfLines={3}>
                        {challenge.description ||
                            "Solve this problem to maintain your daily streak."}
                    </Text>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() =>
                            navigation.navigate("DSAProblemDetail", {
                                problem: challenge,
                            })
                        }
                    >
                        <Text style={styles.buttonText}>Solve Now</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    scrollContent: {
        padding: spacing.lg,
    },
    card: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.md,
    },
    date: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightSemiBold,
    },
    streakBadge: {
        backgroundColor: "rgba(239, 68, 68, 0.1)", // Light red
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
    },
    streakText: {
        color: "#ef4444", // Red 500
        fontSize: typography.fontSizeXS,
        fontWeight: typography.fontWeightBold,
    },
    title: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeXL,
        fontWeight: typography.fontWeightBold,
        marginBottom: spacing.sm,
    },
    description: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeMD,
        lineHeight: 22,
        marginBottom: spacing.xl,
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: "center",
    },
    buttonText: {
        color: colors.textInverse,
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightBold,
    },
});
