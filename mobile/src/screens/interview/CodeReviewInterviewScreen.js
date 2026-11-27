import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, TextInput, ActivityIndicator } from "react-native";
import * as Haptics from "expo-haptics";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { interviewApi } from "../../api/interviewApi";
import { useAuth } from "../../context/AuthContext";
import { notifyInterviewResult, playHapticNotification } from "../../utils/preferences";

const INITIAL_TIME_SECONDS = 20 * 60;

const PR_DESCRIPTION = `Added user authentication middleware. 
Please review for security vulnerabilities and best practices.`;

const PR_CODE = `app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  // TODO: Add hashing later
  db.query(\`SELECT * FROM users WHERE username='\${username}' AND password='\${password}'\`, (err, results) => {
    if (err) return res.status(500).send("Error");
    if (results.length > 0) {
      res.cookie('auth', 'true');
      res.send("Success");
    } else {
      res.status(401).send("Failed");
    }
  });
});`;

export default function CodeReviewInterviewScreen({ navigation }) {
    const { user } = useAuth();
    const [reviewComments, setReviewComments] = useState("");
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
        const trimmed = reviewComments.trim();
        if (!trimmed) {
            setSubmitError("Please enter your review comments before submitting.");
            return;
        }
        if (submitting) return;

        setSubmitting(true);
        setSubmitError(null);
        try {
            const elapsedSeconds = Math.max(0, INITIAL_TIME_SECONDS - timeLeft);
            const result = await interviewApi.submitDebugCodeReview({
                mode: "review",
                title: "Review PR #42",
                challengePrompt: PR_DESCRIPTION,
                candidateResponse: trimmed,
                submittedCode: PR_CODE,
                durationSeconds: elapsedSeconds,
            });
            setEvaluationResult(result);
            playHapticNotification(Haptics.NotificationFeedbackType.Success, user?.id).catch(() => {});
            notifyInterviewResult(user?.id, result).catch(() => {});
        } catch (err) {
            const msg =
                err?.response?.data?.error ||
                err?.message ||
                "Failed to submit code review. Your draft has been preserved.";
            setSubmitError(msg);
            playHapticNotification(Haptics.NotificationFeedbackType.Error, user?.id).catch(() => {});
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => {
        setEvaluationResult(null);
        setSubmitError(null);
        setReviewComments("");
        setTimeLeft(INITIAL_TIME_SECONDS);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScreenHeader title="Code Review Challenge" onBack={() => navigation.goBack()} />
            
            <ScrollView contentContainerStyle={styles.container}>
                {evaluationResult ? (
                    <View style={styles.resultCard}>
                        <View style={styles.resultHeader}>
                            <Ionicons name="checkmark-circle" size={32} color={colors.success} />
                            <View style={styles.resultHeaderText}>
                                <Text style={styles.resultTitle}>Review Submitted</Text>
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
                            <Text style={styles.feedbackHeading}>Your Submitted Review</Text>
                            <Text style={styles.submittedAnswer}>{reviewComments.trim()}</Text>
                        </View>

                        <View style={styles.resultActions}>
                            <TouchableOpacity style={styles.submitBtn} onPress={() => navigation.goBack()}>
                                <Text style={styles.submitBtnText}>Done</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.secondaryBtn} onPress={handleReset}>
                                <Text style={styles.secondaryBtnText}>Review Again</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <>
                        <View style={styles.headerRow}>
                            <Text style={styles.taskTitle}>Review PR #42</Text>
                            <View style={styles.timerBadge}>
                                <Ionicons name="time-outline" size={16} color={colors.primary} />
                                <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                            </View>
                        </View>

                        <View style={styles.prDescCard}>
                            <Text style={styles.prDescTitle}>Description:</Text>
                            <Text style={styles.prDescText}>{PR_DESCRIPTION}</Text>
                        </View>

                        <Text style={styles.inputLabel}>Changed Files (1)</Text>
                        <View style={styles.codeContainer}>
                            <Text style={styles.codeFileHeader}>backend/auth.js</Text>
                            <Text style={styles.codeText}>{PR_CODE}</Text>
                        </View>

                        <Text style={styles.inputLabel}>Your Review Comments:</Text>
                        <TextInput
                            style={styles.textInput}
                            multiline
                            placeholder="Provide constructive feedback, identify security flaws (e.g. SQL injection), and suggest improvements..."
                            placeholderTextColor={colors.textMuted}
                            value={reviewComments}
                            onChangeText={(text) => {
                                setReviewComments(text);
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
                                <Text style={styles.submitBtnText}>Submit Review</Text>
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
    prDescCard: { backgroundColor: colors.bgCard, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.borderLight, marginBottom: spacing.lg },
    prDescTitle: { color: colors.textSecondary, fontSize: typography.fontSizeXS, textTransform: "uppercase", marginBottom: 4 },
    prDescText: { color: colors.textPrimary, fontSize: typography.fontSizeSM, lineHeight: 20 },
    codeContainer: { backgroundColor: "#1e1e24", borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.borderLight, marginBottom: spacing.xl, overflow: "hidden" },
    codeFileHeader: { backgroundColor: "#2d2d36", color: colors.textSecondary, fontSize: typography.fontSizeXS, padding: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    codeText: { color: "#d4d4d8", fontFamily: "monospace", fontSize: 12, lineHeight: 18, padding: spacing.md },
    inputLabel: { color: colors.textPrimary, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold, marginBottom: spacing.sm },
    textInput: { backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, padding: spacing.md, color: colors.textPrimary, height: 180, fontSize: typography.fontSizeMD, marginBottom: spacing.md },
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
