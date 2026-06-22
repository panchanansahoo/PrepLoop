import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { analyticsApi } from "../../api/analyticsApi";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";

export default function ImprovementPlanScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [plan, setPlan] = useState(null);

    const loadData = async () => {
        try {
            const data = await analyticsApi.getImprovementPlan();
            setPlan(data);
        } catch (error) {
            console.error("Failed to load improvement plan:", error);
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
                <ScreenHeader title="AI Improvement Plan" onBack={() => navigation.goBack()} />
                <LoadingSpinner />
            </View>
        );
    }

    if (!plan || (!plan.weaknesses && !plan.actionItems)) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="AI Improvement Plan" onBack={() => navigation.goBack()} />
                <View style={styles.centerContent}>
                    <Text style={styles.emoji}>🌱</Text>
                    <Text style={styles.emptyTitle}>Keep Practicing!</Text>
                    <Text style={styles.emptyDesc}>Take more interviews to generate a personalized AI improvement plan based on your performance.</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader title="AI Improvement Plan" onBack={() => navigation.goBack()} />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>AI Assessment</Text>
                    <Text style={styles.summaryText}>
                        {plan.summary || "Based on your recent interviews, here is your personalized improvement plan."}
                    </Text>
                </View>

                {plan.weaknesses && plan.weaknesses.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Areas to Improve</Text>
                        {plan.weaknesses.map((item, index) => (
                            <View key={index} style={styles.bulletItem}>
                                <Text style={styles.bulletIcon}>⚠️</Text>
                                <Text style={styles.bulletText}>{item}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {plan.actionItems && plan.actionItems.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Action Items</Text>
                        {plan.actionItems.map((item, index) => (
                            <View key={index} style={styles.actionCard}>
                                <View style={styles.actionHeader}>
                                    <View style={styles.actionNum}>
                                        <Text style={styles.actionNumText}>{index + 1}</Text>
                                    </View>
                                    <Text style={styles.actionTitle}>{item.title || "Practice"}</Text>
                                </View>
                                <Text style={styles.actionDesc}>{item.description || item}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    centerContent: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl },
    emoji: { fontSize: 48, marginBottom: spacing.md },
    emptyTitle: { color: colors.textPrimary, fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightBold, marginBottom: spacing.xs },
    emptyDesc: { color: colors.textSecondary, textAlign: "center", lineHeight: 22 },
    
    scrollContent: { padding: spacing.lg, paddingBottom: 40 },
    
    summaryCard: { backgroundColor: "rgba(129, 140, 248, 0.1)", padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.primary, marginBottom: spacing.xl },
    summaryTitle: { color: colors.primary, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightBold, marginBottom: spacing.sm },
    summaryText: { color: colors.textPrimary, fontSize: typography.fontSizeSM, lineHeight: 22 },
    
    section: { marginBottom: spacing.xl },
    sectionTitle: { color: colors.textPrimary, fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightBold, marginBottom: spacing.md },
    
    bulletItem: { flexDirection: "row", marginBottom: spacing.sm, alignItems: "flex-start" },
    bulletIcon: { marginRight: spacing.sm, fontSize: 16 },
    bulletText: { color: colors.textSecondary, fontSize: typography.fontSizeMD, flex: 1, lineHeight: 22 },
    
    actionCard: { backgroundColor: colors.bgCard, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
    actionHeader: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm },
    actionNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center", marginRight: spacing.sm },
    actionNumText: { color: colors.textInverse, fontSize: typography.fontSizeXS, fontWeight: typography.fontWeightBold },
    actionTitle: { color: colors.textPrimary, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightBold },
    actionDesc: { color: colors.textSecondary, fontSize: typography.fontSizeSM, lineHeight: 20 },
});
