import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from "react-native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { EmptyState } from "../../components/EmptyState";
import { analyticsApi } from "../../api/analyticsApi";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { BarChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export default function InterviewAnalyticsScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState(null);

    const loadData = async () => {
        try {
            const overview = await analyticsApi.getOverview();
            setData(overview);
        } catch (error) {
            console.error("Failed to load analytics:", error);
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
                <ScreenHeader title="Analytics" onBack={() => navigation.goBack()} />
                <LoadingSpinner />
            </View>
        );
    }

    if (!data || !data.totalInterviews) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Analytics" onBack={() => navigation.goBack()} />
                <EmptyState
                    icon="📊"
                    title="No Data Yet"
                    message="Complete an interview to see your analytics."
                    actionLabel="Take Interview"
                    onAction={() => navigation.navigate("InterviewHub")}
                />
            </View>
        );
    }

    const { stats, recentScores } = data;

    return (
        <View style={styles.container}>
            <ScreenHeader title="Analytics" onBack={() => navigation.goBack()} />
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
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Interviews</Text>
                        <Text style={styles.statValue}>{data.totalInterviews || 0}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Avg Score</Text>
                        <Text style={styles.statValue}>{data.averageScore || 0}%</Text>
                    </View>
                </View>

                {recentScores && recentScores.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Recent Performance</Text>
                        <BarChart
                            data={{
                                labels: recentScores.map((_, i) => `${i + 1}`),
                                datasets: [
                                    {
                                        data: recentScores
                                    }
                                ]
                            }}
                            width={screenWidth - spacing.lg * 2}
                            height={220}
                            yAxisLabel=""
                            yAxisSuffix="%"
                            chartConfig={{
                                backgroundColor: colors.bgCard,
                                backgroundGradientFrom: colors.bgCard,
                                backgroundGradientTo: colors.bgCard,
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(56, 189, 248, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
                                style: {
                                    borderRadius: 16
                                },
                                propsForDots: {
                                    r: "6",
                                    strokeWidth: "2",
                                    stroke: colors.primary
                                }
                            }}
                            style={{
                                marginVertical: 8,
                                borderRadius: 16
                            }}
                        />
                    </View>
                )}

                {stats && stats.categories && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>By Category</Text>
                        {Object.entries(stats.categories).map(([category, score]) => (
                            <View key={category} style={styles.categoryRow}>
                                <Text style={styles.categoryName}>{category}</Text>
                                <View style={styles.progressBg}>
                                    <View style={[styles.progressFill, { width: `${score}%` }]} />
                                </View>
                                <Text style={styles.categoryScore}>{score}%</Text>
                            </View>
                        ))}
                    </View>
                )}
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
    statsGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.xl,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.bgCard,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginHorizontal: spacing.xs,
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
    },
    statLabel: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        marginBottom: spacing.xs,
    },
    statValue: {
        color: colors.textPrimary,
        fontSize: typography.fontSize2XL,
        fontWeight: typography.fontWeightBold,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightBold,
        marginBottom: spacing.md,
    },
    chartContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-around",
        height: 150,
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    barWrapper: {
        alignItems: "center",
        justifyContent: "flex-end",
        height: "100%",
    },
    bar: {
        width: 24,
        backgroundColor: colors.primary,
        borderRadius: 4,
        minHeight: 4,
    },
    barLabel: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeXS,
        marginTop: spacing.xs,
    },
    categoryRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.md,
    },
    categoryName: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: typography.fontSizeSM,
    },
    progressBg: {
        flex: 2,
        height: 8,
        backgroundColor: colors.border,
        borderRadius: 4,
        marginHorizontal: spacing.md,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: colors.primary,
    },
    categoryScore: {
        width: 40,
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        textAlign: "right",
    },
});
