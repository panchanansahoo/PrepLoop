import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { learningApi } from "../../api/learningApi";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";

export default function LearningPathScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pathData, setPathData] = useState([]);
    
    // In a real app, this might have a top-tab selector for DSA/System Design. 
    // Here we focus on DSA primarily as a single scrollable path.

    const loadData = async () => {
        try {
            const data = await learningApi.getDSAPath();
            // Data shape expected: [{ id, title, description, progress, total_topics }]
            setPathData(data || []);
        } catch (error) {
            console.error("Failed to load learning path:", error);
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
                <ScreenHeader title="Learning Path" onBack={() => navigation.goBack()} />
                <LoadingSpinner />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader title="DSA Learning Path" onBack={() => navigation.goBack()} />
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
                {pathData.length === 0 ? (
                    <Text style={styles.emptyText}>No learning path available right now.</Text>
                ) : (
                    <View style={styles.timeline}>
                        {pathData.map((module, index) => {
                            const isLast = index === pathData.length - 1;
                            const percent = module.total_topics > 0 
                                ? Math.round(((module.completed_topics || 0) / module.total_topics) * 100)
                                : 0;
                            const isCompleted = percent === 100;

                            return (
                                <View key={module.id || index} style={styles.timelineItem}>
                                    {/* Timeline Line */}
                                    {!isLast && <View style={[styles.timelineLine, isCompleted && styles.timelineLineActive]} />}
                                    
                                    {/* Timeline Dot */}
                                    <View style={[styles.timelineDot, isCompleted && styles.timelineDotActive]}>
                                        {isCompleted && <Text style={styles.checkIcon}>✓</Text>}
                                    </View>

                                    {/* Content Card */}
                                    <TouchableOpacity 
                                        style={styles.card}
                                        onPress={() => navigation.navigate("TopicLearning", { topicId: module.id, title: module.title })}
                                    >
                                        <View style={styles.cardHeader}>
                                            <Text style={styles.cardTitle}>{module.title}</Text>
                                            <Text style={styles.percentText}>{percent}%</Text>
                                        </View>
                                        <Text style={styles.cardDesc} numberOfLines={2}>{module.description}</Text>
                                        
                                        <View style={styles.progressBg}>
                                            <View style={[styles.progressFill, { width: `${percent}%` }]} />
                                        </View>
                                        
                                        <Text style={styles.topicsCount}>
                                            {module.completed_topics || 0} / {module.total_topics || 0} Topics Completed
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scrollContent: { padding: spacing.lg, paddingBottom: 40 },
    emptyText: { color: colors.textSecondary, textAlign: "center", marginTop: spacing.xl },
    
    timeline: { paddingLeft: 10 },
    timelineItem: { position: "relative", paddingLeft: 40, marginBottom: spacing.xl },
    timelineLine: { position: "absolute", left: 15, top: 30, bottom: -30, width: 2, backgroundColor: colors.border, zIndex: 1 },
    timelineLineActive: { backgroundColor: colors.primary },
    timelineDot: { position: "absolute", left: 0, top: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bgCardAlt, borderWidth: 2, borderColor: colors.border, zIndex: 2, justifyContent: "center", alignItems: "center" },
    timelineDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    checkIcon: { color: colors.textInverse, fontSize: 16, fontWeight: "bold" },
    
    card: { backgroundColor: colors.bgCard, padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
    cardTitle: { color: colors.textPrimary, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightBold, flex: 1 },
    percentText: { color: colors.primary, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightBold },
    cardDesc: { color: colors.textSecondary, fontSize: typography.fontSizeSM, marginBottom: spacing.md, lineHeight: 20 },
    
    progressBg: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden", marginBottom: spacing.sm },
    progressFill: { height: "100%", backgroundColor: colors.primary },
    topicsCount: { color: colors.textSecondary, fontSize: typography.fontSizeXS },
});
