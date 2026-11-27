import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { learningApi } from "../../api/learningApi";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";

export default function TopicLearningScreen({ route, navigation }) {
    const { topicId, title, pathType } = route.params || {};
    const [loading, setLoading] = useState(true);
    const [topic, setTopic] = useState(null);
    const [saving, setSaving] = useState(false);
    const [actionError, setActionError] = useState(null);

    useEffect(() => {
        let active = true;
        const loadTopic = async () => {
            try {
                const data = await learningApi.getTopic(topicId, pathType);
                if (active) setTopic(data);
            } catch (error) {
                console.error("Failed to load topic:", error);
            } finally {
                if (active) setLoading(false);
            }
        };
        if (topicId) {
            loadTopic();
        } else {
            setLoading(false);
        }
        return () => {
            active = false;
        };
    }, [topicId, pathType]);

    const markComplete = async () => {
        if (saving || topic?.completed) return;
        setSaving(true);
        setActionError(null);
        try {
            await learningApi.markTopicComplete(topicId);
            setTopic((prev) =>
                prev
                    ? {
                          ...prev,
                          completed: true,
                          completed_topics: prev.total_topics ?? prev.completed_topics,
                      }
                    : prev,
            );
            navigation.goBack();
        } catch (error) {
            console.error("Failed to mark complete:", error);
            setActionError(
                error?.response?.data?.error ||
                    error?.message ||
                    "Could not save progress. Please try again.",
            );
        } finally {
            setSaving(false);
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

    const fallbackTopicsList = Array.isArray(topic.topics) && topic.topics.length > 0
        ? topic.topics.map((item) => `• ${item}`).join("\n")
        : "";
    const bodyContent =
        topic.content ||
        [topic.description, fallbackTopicsList].filter(Boolean).join("\n\n") ||
        "This topic is currently empty. More content will be added soon.";

    return (
        <View style={styles.container}>
            <ScreenHeader title={title || topic.title || "Topic"} onBack={() => navigation.goBack()} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>{topic.title}</Text>

                <View style={styles.contentBox}>
                    <Text style={styles.contentText}>{bodyContent}</Text>
                </View>

                {topic.code_example ? (
                    <View style={styles.codeBox}>
                        <Text style={styles.codeText}>{topic.code_example}</Text>
                    </View>
                ) : null}

                {actionError ? (
                    <Text style={styles.actionErrorText}>{actionError}</Text>
                ) : null}

                <TouchableOpacity
                    style={[
                        styles.completeBtn,
                        (topic.completed || saving) && styles.completeBtnDone,
                    ]}
                    onPress={markComplete}
                    disabled={saving || Boolean(topic.completed)}
                >
                    {saving ? (
                        <ActivityIndicator color={colors.textInverse} />
                    ) : (
                        <Text style={styles.completeBtnText}>
                            {topic.completed ? "Completed ✓" : "Mark as Complete"}
                        </Text>
                    )}
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
    actionErrorText: { color: colors.error, fontSize: typography.fontSizeSM, marginBottom: spacing.sm },

    title: { color: colors.textPrimary, fontSize: typography.fontSize2XL, fontWeight: typography.fontWeightBold, marginBottom: spacing.lg },

    contentBox: { marginBottom: spacing.xl },
    contentText: { color: colors.textSecondary, fontSize: typography.fontSizeMD, lineHeight: 24 },

    codeBox: { backgroundColor: "#1e1e1e", padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.xl },
    codeText: { color: "#d4d4d4", fontFamily: "monospace", fontSize: typography.fontSizeSM },

    completeBtn: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: "center", marginTop: spacing.xl },
    completeBtnDone: { opacity: 0.7 },
    completeBtnText: { color: colors.textInverse, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightBold },
});
