import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, TextInput, ActivityIndicator } from "react-native";
import * as Haptics from "expo-haptics";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { interviewApi } from "../../api/interviewApi";
import { useAuth } from "../../context/AuthContext";
import { notifyInterviewResult, playHapticNotification } from "../../utils/preferences";

const INITIAL_TIME_SECONDS = 15 * 60;

const BUGGY_CODE = `function findMax(arr) {
  let max = 0;
  for (let i = 1; i <= arr.length; i++) {
    if (arr[i] > max) {
      max = arr[i];
    }
  }
  return max;
}`;

export default function DebuggingInterviewScreen({ navigation }) {
    const { user } = useAuth();
    const [feedback, setFeedback] = useState("");
    const [timeLeft, setTimeLeft] = useState(INITIAL_TIME_SECONDS);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [evaluationResult, setEvaluationResult] = useState(null);

    useEffect(() => {
        if (evaluationResult) return undefined;
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [evaluationResult]);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const handleSubmit = async () => {
        const trimmed = feedback.trim();
        if (!trimmed) {
            setSubmitError("Please describe the bugs and fixes before submitting.");
            return;
        }
        if (submitting) return;

        setSubmitting(true);
        setSubmitError(null);
        try {
            const elapsedSeconds = Math.max(0, INITIAL_TIME_SECONDS - timeLeft);
            const result = await interviewApi.submitDebugCodeReview({
                mode: "debug",
                title: "Find the Bugs",
                challengePrompt: "Identify and describe the bugs in the JavaScript function.",
                candidateResponse: trimmed,
                submittedCode: BUGGY_CODE,
                durationSeconds: elapsedSeconds,
            });
            setEvaluationResult(result);
            playHapticNotification(Haptics.NotificationFeedbackType.Success, user?.id).catch(() => {});
            notifyInterviewResult(user?.id, result).catch(() => {});
        } catch (err) {
            const msg =
                err?.response?.data?.error ||
                err?.message ||
                "Failed to submit analysis. Your draft has been preserved.";
            setSubmitError(msg);
            playHapticNotification(Haptics.NotificationFeedbackType.Error, user?.id).catch(() => {});
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => {
        setEvaluationResult(null);
        setSubmitError(null);
        setFeedback("");
        setTimeLeft(INITIAL_TIME_SECONDS);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScreenHeader title="Debugging Challenge" onBack={() => navigation.goBack()} />
            
            <ScrollView contentContainerStyle={styles.container}>
                {evaluationResult ? (
                    <View style={styles.resultCard}>
                        <View style={styles.resultHeader}>
                            <Ionicons name="checkmark-circle" size={32} color={colors.success} />
                            <View style={styles.resultHeaderText}>
                                <Text style={styles.resultTitle}>Analysis Submitted</Text>
                                <Text style={styles.resultSub}>
                                    Score: {evaluationResult.score ?? 0}/100 • {String(evaluationResult.verdict || "pass").replace(/_/g, " ")}
                                </Text>
                            </View>
                        </View>

                        {Array.isArray(evaluationResult.feedback) && evaluationResult.feedback.length > 0 ? (
                            <View style={styles.feedbackSection}>
                                <Text style={styles.feedbackHeading}>Evaluation Feedback</Text>
                                {evaluationResult.feedback.map((item, idx) => (
                                    <Text key={idx} style={styles.feedbackItem}>
                                        • {item}
                                    </Text>
                                ))}
                            </View>
                        ) : null}

                        <View style={styles.feedbackSection}>
                            <Text style={styles.feedbackHeading}>Your Submitted Analysis</Text>
                            <Text style={styles.submittedAnswer}>{feedback.trim()}</Text>
                        </View>

                        <View style={styles.resultActions}>
                            <TouchableOpacity style={styles.submitBtn} onPress={() => navigation.goBack()}>
                                <Text style={styles.submitBtnText}>Done</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.secondaryBtn} onPress={handleReset}>
                                <Text style={styles.secondaryBtnText}>Try Again</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <>
                        <View style={styles.headerRow}>
                            <Text style={styles.taskTitle}>Find the Bugs</Text>
                            <View style={styles.timerBadge}>
                                <Ionicons name="time-outline" size={16} color={colors.primary} />
                                <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                            </View>
                        </View>

                        <Text style={styles.instructions}>
                            Identify and describe the bugs in the JavaScript function below.
                        </Text>

                        <View style={styles.codeContainer}>
                            <Text style={styles.codeText}>{BUGGY_CODE}</Text>
                        </View>

                        <Text style={styles.inputLabel}>Your Analysis & Fixes:</Text>
                        <TextInput
                            style={styles.textInput}
                            multiline
                            placeholder="Describe the bugs you found and how to fix them..."
                            placeholderTextColor={colors.textMuted}
                            value={feedback}
                            onChangeText={(text) => {
                                setFeedback(text);
                                if (submitError) setSubmitError(null);
                            }}
                            textAlignVertical="top"
                            editable={!submitting}
                        />

                        {submitError ? (
                            <View style={styles.errorBanner}>
                                <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                                <Text style={styles.errorText}>{submitError}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitBtnText}>Submit Analysis</Text>
                            )}
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bg },
    container: { padding: spacing.md, paddingBottom: spacing.xxl },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
    taskTitle: { color: colors.textPrimary, fontSize: typography.fontSizeXL, fontWeight: typography.fontWeightBold },
    timerBadge: { flexDirection: "row", alignItems: "center", backgroundColor: colors.bgInput, paddingHorizontal: 10, paddingVertical: 6, borderRadius: borderRadius.sm, gap: 6, borderWidth: 1, borderColor: colors.borderLight },
    timerText: { color: colors.primary, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightBold, fontVariant: ["tabular-nums"] },
    instructions: { color: colors.textSecondary, fontSize: typography.fontSizeMD, marginBottom: spacing.lg, lineHeight: 22 },
    codeContainer: { backgroundColor: "#1e1e24", padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.borderLight, marginBottom: spacing.xl },
    codeText: { color: "#d4d4d8", fontFamily: "monospace", fontSize: 13, lineHeight: 20 },
    inputLabel: { color: colors.textPrimary, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold, marginBottom: spacing.sm },
    textInput: { backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, padding: spacing.md, color: colors.textPrimary, height: 150, fontSize: typography.fontSizeMD, marginBottom: spacing.md },
    errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(239, 68, 68, 0.12)", borderWidth: 1, borderColor: colors.error, borderRadius: borderRadius.md, padding: spacing.sm, marginBottom: spacing.md },
    errorText: { color: colors.error, fontSize: typography.fontSizeSM, flex: 1 },
    submitBtn: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: "center" },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: "#fff", fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold },
    resultCard: { backgroundColor: colors.bgCard, padding: spacing.lg, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.borderLight, gap: spacing.md },
    resultHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    resultHeaderText: { flex: 1 },
    resultTitle: { color: colors.textPrimary, fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightBold },
    resultSub: { color: colors.primary, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold, marginTop: 2, textTransform: "capitalize" },
    feedbackSection: { backgroundColor: colors.bgInput, padding: spacing.md, borderRadius: borderRadius.sm, gap: 6 },
    feedbackHeading: { color: colors.textSecondary, fontSize: typography.fontSizeXS, fontWeight: typography.fontWeightBold, textTransform: "uppercase" },
    feedbackItem: { color: colors.textPrimary, fontSize: typography.fontSizeSM, lineHeight: 20 },
    submittedAnswer: { color: colors.textSecondary, fontSize: typography.fontSizeSM, lineHeight: 20 },
    resultActions: { gap: spacing.sm, marginTop: spacing.sm },
    secondaryBtn: { borderWidth: 1, borderColor: colors.borderLight, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: "center" },
    secondaryBtnText: { color: colors.textPrimary, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold },
});
