import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { learningApi } from "../../api/learningApi";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";

export default function TopicLearningScreen({ route, navigation }) {
    const { topicId, title } = route.params || {};
    const [loading, setLoading] = useState(true);
    const [topic, setTopic] = useState(null);

    useEffect(() => {
        const loadTopic = async () => {
            try {
                const data = await learningApi.getDSATopic(topicId);
                setTopic(data);
            } catch (error) {
                console.error("Failed to load topic:", error);
            } finally {
                setLoading(false);
            }
        };
        if (topicId) {
            loadTopic();
        } else {
            setLoading(false);
        }
    }, [topicId]);

    const markComplete = async () => {
        try {
            await learningApi.markTopicComplete(topicId);
            navigation.goBack();
        } catch (error) {
            console.error("Failed to mark complete:", error);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ScreenHeader title={title || "Topic"} onBack={() => navigation.goBack()} />
                <LoadingSpinner />
            </View>
        );
    }

    if (!topic) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Error" onBack={() => navigation.goBack()} />
                <View style={styles.center}>
                    <Text style={styles.errorText}>Could not load topic content.</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader title={title || topic.title || "Topic"} onBack={() => navigation.goBack()} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                <Text style={styles.title}>{topic.title}</Text>
                
                {/* Simplified content rendering. In a real app, use a markdown renderer */}
                <View style={styles.contentBox}>
                    <Text style={styles.contentText}>
                        {topic.content || "This topic is currently empty. More content will be added soon."}
                    </Text>
                </View>

                {topic.code_example && (
                    <View style={styles.codeBox}>
                        <Text style={styles.codeText}>{topic.code_example}</Text>
                    </View>
                )}

                <TouchableOpacity style={styles.completeBtn} onPress={markComplete}>
                    <Text style={styles.completeBtnText}>Mark as Complete</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scrollContent: { padding: spacing.lg, paddingBottom: 40 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    errorText: { color: colors.textSecondary },
    
    title: { color: colors.textPrimary, fontSize: typography.fontSize2XL, fontWeight: typography.fontWeightBold, marginBottom: spacing.lg },
    
    contentBox: { marginBottom: spacing.xl },
    contentText: { color: colors.textSecondary, fontSize: typography.fontSizeMD, lineHeight: 24 },
    
    codeBox: { backgroundColor: "#1e1e1e", padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.xl },
    codeText: { color: "#d4d4d4", fontFamily: "monospace", fontSize: typography.fontSizeSM },
    
    completeBtn: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: "center", marginTop: spacing.xl },
    completeBtnText: { color: colors.textInverse, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightBold },
});
