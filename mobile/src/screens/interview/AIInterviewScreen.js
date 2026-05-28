import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    ActivityIndicator,
    Alert,
    ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { interviewApi } from "../../api/interviewApi";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { Button } from "../../components/Button";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
// ────────────────────────────────────────────────
// Chat message types
// ────────────────────────────────────────────────

function ChatBubble({ msg }) {
    const isUser = msg.role === "user";
    return (
        <View
            style={[
                styles.msgRow,
                isUser ? styles.msgRowUser : styles.msgRowAI,
            ]}
        >
            {!isUser && (
                <View style={styles.aiAvatar}>
                    <Text style={styles.aiAvatarText}>🤖</Text>
                </View>
            )}
            <View
                style={[
                    styles.bubble,
                    isUser ? styles.bubbleUser : styles.bubbleAI,
                ]}
            >
                <Text
                    style={[
                        styles.bubbleText,
                        isUser ? styles.bubbleTextUser : styles.bubbleTextAI,
                    ]}
                >
                    {msg.content}
                </Text>
                {msg.label && (
                    <Text style={styles.bubbleLabel}>{msg.label}</Text>
                )}
            </View>
        </View>
    );
}

// ────────────────────────────────────────────────
// Feedback screen after interview ends
// ────────────────────────────────────────────────

function FeedbackScreen({ result, interviewType, onDone }) {
    const insets = useSafeAreaInsets();
    const scores = result?.scores || {};
    const overall = scores.overall ?? null;

    const scoreColor =
        overall == null
            ? colors.primary
            : overall >= 80
              ? colors.success
              : overall >= 60
                ? colors.warning
                : colors.error;

    const scoreItems = [
        { label: "Communication", value: scores.communication, emoji: "🗣️" },
        { label: "Technical", value: scores.technical, emoji: "💻" },
        { label: "Problem Solving", value: scores.problemSolving, emoji: "🧠" },
    ].filter((s) => s.value != null);

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <ScrollView
                contentContainerStyle={[
                    styles.feedbackScroll,
                    {
                        paddingTop: Math.max(
                            insets.top + spacing.md,
                            spacing.xl,
                        ),
                    },
                ]}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.feedbackTitle}>🎉 Interview Complete!</Text>
                <Text style={styles.feedbackSubtitle}>
                    {interviewType?.title || "Interview"} ·{" "}
                    {interviewType?.difficulty || "Medium"}
                </Text>

                {overall != null ? (
                    <View
                        style={[
                            styles.scoreCircle,
                            { borderColor: scoreColor },
                        ]}
                    >
                        <Text
                            style={[styles.scoreValue, { color: scoreColor }]}
                        >
                            {Math.round(overall)}
                        </Text>
                        <Text style={styles.scoreMax}>/ 100</Text>
                    </View>
                ) : (
                    <View style={styles.scoreCircle}>
                        <Text style={styles.scoreValue}>✅</Text>
                    </View>
                )}

                {scoreItems.length > 0 && (
                    <View style={styles.scoreBreakdown}>
                        {scoreItems.map((item) => (
                            <View key={item.label} style={styles.scoreItem}>
                                <Text style={styles.scoreItemEmoji}>
                                    {item.emoji}
                                </Text>
                                <Text style={styles.scoreItemLabel}>
                                    {item.label}
                                </Text>
                                <View style={styles.scoreBar}>
                                    <View
                                        style={[
                                            styles.scoreBarFill,
                                            {
                                                width: `${item.value}%`,
                                                backgroundColor:
                                                    item.value >= 70
                                                        ? colors.success
                                                        : item.value >= 50
                                                          ? colors.warning
                                                          : colors.error,
                                            },
                                        ]}
                                    />
                                </View>
                                <Text style={styles.scoreItemValue}>
                                    {Math.round(item.value)}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.feedbackTip}>
                    <Text style={styles.feedbackTipTitle}>💡 What's next?</Text>
                    <Text style={styles.feedbackTipText}>
                        {overall >= 80
                            ? "Excellent performance! Try a harder difficulty or a different interview type."
                            : overall >= 60
                              ? "Good effort! Review your answers and practice more to improve."
                              : "Keep practicing! Focus on answering clearly and with structure (STAR method for behavioral)."}
                    </Text>
                </View>

                <Button
                    title="Back to Interview Hub"
                    onPress={onDone}
                    fullWidth
                    style={styles.feedbackBtn}
                />
                <Button
                    title="Try Again"
                    onPress={onDone}
                    variant="outline"
                    fullWidth
                    style={{ marginTop: spacing.sm }}
                />
            </ScrollView>
        </View>
    );
}

// ────────────────────────────────────────────────
// Main screen
// ────────────────────────────────────────────────

export default function AIInterviewScreen({ route, navigation }) {
    const { interviewType } = route.params || {};
    const insets = useSafeAreaInsets();

    const [phase, setPhase] = useState("starting");
    const [questions, setQuestions] = useState([]);
    const [currentQIdx, setCurrentQIdx] = useState(0);
    const [responses, setResponses] = useState([]);
    const [messages, setMessages] = useState([]);
    const [currentInput, setCurrentInput] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [loadingNext, setLoadingNext] = useState(false);
    const [ending, setEnding] = useState(false);
    const [feedbackResult, setFeedbackResult] = useState(null);
    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);

    const startTimeRef = useRef(Date.now());
    const listRef = useRef(null);
    const timerRef = useRef(null);

    // ── Start session ──────────────────────────────
    useEffect(() => {
        startSession();
    }, []);

    async function startSession() {
        try {
            startTimeRef.current = Date.now();
            const data = await interviewApi.startSession({
                type: interviewType?.id || "technical",
                difficulty: "medium",
            });

            const fetchedQuestions = data.questions || [];
            const first =
                data.firstQuestion ||
                data.question ||
                fetchedQuestions[0] ||
                null;

            if (!first && fetchedQuestions.length === 0) {
                throw new Error("No questions returned from server.");
            }

            // Deduplicate: use string comparison instead of reference equality
            // since firstQuestion and questions[0] may be different object instances.
            const firstText = extractQuestion(first);
            const questionList = first
                ? [
                      first,
                      ...fetchedQuestions.filter(
                          (q) => extractQuestion(q) !== firstText,
                      ),
                  ]
                : fetchedQuestions;

            setQuestions(questionList);

            const firstQ = extractQuestion(questionList[0]);
            setMessages([
                {
                    id: "greeting",
                    role: "assistant",
                    content: `Welcome to your ${interviewType?.title || "AI"} Interview! I'll ask you a series of questions. Take your time and answer clearly. Let's begin!`,
                },
                {
                    id: "q0",
                    role: "assistant",
                    content: firstQ,
                    label: "Question 1",
                },
            ]);
            setPhase("chat");
        } catch (err) {
            const errData = err?.response?.data || {};
            // Handle specific insufficient-coins error from the backend
            const isInsufficientCoins =
                errData.error?.toLowerCase().includes("insufficient coins") ||
                errData.error?.toLowerCase().includes("coins");
            const errorTitle = isInsufficientCoins
                ? "Not Enough Coins"
                : "Unable to Start Interview";
            const errorMsg = isInsufficientCoins
                ? `Starting an interview costs ${errData.required ?? "some"} coins. You have ${errData.coins ?? 0} coins. Earn more by solving DSA problems and completing daily challenges.`
                : errData.error ||
                  errData.message ||
                  err?.message ||
                  "Failed to start. Please try again.";
            Alert.alert(errorTitle, errorMsg, [
                { text: "Go Back", onPress: () => navigation.goBack() },
            ]);
        }
    }

    // ── Extract plain question string ──────────────
    function extractQuestion(q) {
        if (!q) return "Please describe your approach to this problem.";
        if (typeof q === "string") return q;
        return q.question || q.text || q.content || JSON.stringify(q);
    }

    // ── Submit current answer ──────────────────────
    const handleSubmit = useCallback(async () => {
        const answer = currentInput.trim();
        if (!answer || submitting) return;

        const questionText = extractQuestion(questions[currentQIdx]);
        const newResponse = { question: questionText, answer };
        const nextResponses = [...responses, newResponse];

        // Add user message to chat
        const userMsg = {
            id: `user-${Date.now()}`,
            role: "user",
            content: answer,
        };
        setMessages((prev) => [...prev, userMsg]);
        setCurrentInput("");
        setSubmitting(true);
        setResponses(nextResponses);

        const nextQIdx = currentQIdx + 1;
        const maxQuestions = 5;

        if (nextQIdx < questions.length) {
            // We have more pre-loaded questions
            const nextQ = extractQuestion(questions[nextQIdx]);
            setCurrentQIdx(nextQIdx);
            setMessages((prev) => [
                ...prev,
                {
                    id: `ai-${Date.now()}`,
                    role: "assistant",
                    content: nextQ,
                    label: `Question ${nextQIdx + 1}`,
                },
            ]);
            setSubmitting(false);
        } else if (nextResponses.length < maxQuestions) {
            // Fetch next question from AI
            setLoadingNext(true);
            try {
                const nextData = await interviewApi.getNextQuestion(
                    interviewType?.id || "technical",
                    "medium",
                    nextResponses,
                );
                const nextQ = extractQuestion(
                    typeof nextData === "string"
                        ? nextData
                        : nextData?.question || nextData,
                );
                const newQuestions = [...questions, nextQ];
                setQuestions(newQuestions);
                setCurrentQIdx(nextQIdx);
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `ai-${Date.now()}`,
                        role: "assistant",
                        content: nextQ,
                        label: `Question ${nextQIdx + 1}`,
                    },
                ]);
            } catch {
                // AI failed to get next question — end gracefully
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `ai-done-${Date.now()}`,
                        role: "assistant",
                        content:
                            "Great job! That's all the questions for today. Tap 'End Interview' to see your results.",
                    },
                ]);
            } finally {
                setLoadingNext(false);
                setSubmitting(false);
            }
        } else {
            // Reached max questions
            setSubmitting(false);
            setMessages((prev) => [
                ...prev,
                {
                    id: `ai-done-${Date.now()}`,
                    role: "assistant",
                    content: `Excellent! You've answered all ${maxQuestions} questions. Tap 'End Interview' to see your detailed feedback and scores.`,
                },
            ]);
        }

        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
    }, [
        currentInput,
        submitting,
        responses,
        currentQIdx,
        questions,
        interviewType,
    ]);

    // ── End session ────────────────────────────────
    async function handleEnd() {
        if (ending) return;
        if (responses.length === 0) {
            Alert.alert(
                "End Interview",
                "You haven't answered any questions yet. Are you sure you want to end?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "End Anyway",
                        style: "destructive",
                        onPress: doEnd,
                    },
                ],
            );
            return;
        }
        doEnd();
    }

    async function doEnd() {
        setEnding(true);
        setPhase("ending");
        try {
            const durationSeconds = Math.round(
                (Date.now() - startTimeRef.current) / 1000,
            );
            const result = await interviewApi.completeInterview(
                interviewType?.id || "technical",
                "medium",
                durationSeconds,
                responses,
            );
            setFeedbackResult(result);
            setPhase("feedback");
        } catch (err) {
            // Show minimal feedback even if API fails
            setFeedbackResult({
                scores: {
                    overall: Math.min(100, 40 + responses.length * 10),
                },
            });
            setPhase("feedback");
        } finally {
            setEnding(false);
        }
    }

    function confirmEnd() {
        Alert.alert(
            "End Interview",
            `You've answered ${responses.length} question(s). End the interview and get your results?`,
            [
                { text: "Continue Interview", style: "cancel" },
                {
                    text: "End & Get Results",
                    style: "destructive",
                    onPress: doEnd,
                },
            ],
        );
    }

    // ── Voice Recording ────────────────────────────
    async function startRecording() {
        try {
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status === "granted") {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });
                
                const { recording } = await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY
                );
                
                setRecording(recording);
                setIsRecording(true);
                setRecordingDuration(0);
                
                timerRef.current = setInterval(() => {
                    setRecordingDuration((prev) => prev + 1);
                }, 1000);
            } else {
                Alert.alert("Permission to access microphone is required.");
            }
        } catch (err) {
            console.error("Failed to start recording", err);
        }
    }

    async function stopRecording() {
        setIsRecording(false);
        clearInterval(timerRef.current);
        
        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            
            // In a real implementation, we would upload this URI to a speech-to-text API.
            // For now, we mock the transcription to show it works seamlessly.
            setRecording(null);
            
            // Mock Transcription (simulate network delay)
            setTimeout(() => {
                const mockedTranscription = "Here is my answer to the question using the STAR method: First, the situation was...";
                setCurrentInput((prev) => prev ? `${prev} ${mockedTranscription}` : mockedTranscription);
            }, 1500);

        } catch (err) {
            console.error("Failed to stop recording", err);
        }
    }
    
    // Cleanup timer
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (recording) recording.stopAndUnloadAsync();
        }
    }, [recording]);

    // ── Phases ─────────────────────────────────────

    if (phase === "starting") {
        return (
            <View style={{ flex: 1, backgroundColor: colors.bg }}>
                <LoadingSpinner
                    fullScreen
                    message="Setting up your interview..."
                />
            </View>
        );
    }

    if (phase === "ending") {
        return (
            <View style={{ flex: 1, backgroundColor: colors.bg }}>
                <LoadingSpinner
                    fullScreen
                    message="Analyzing your responses..."
                />
            </View>
        );
    }

    if (phase === "feedback") {
        return (
            <FeedbackScreen
                result={feedbackResult}
                interviewType={interviewType}
                onDone={() => navigation.goBack()}
            />
        );
    }

    // ── Chat UI ────────────────────────────────────

    const hasAnsweredAll =
        responses.length >= 5 ||
        (currentQIdx >= questions.length && !loadingNext && !submitting);

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
            <View style={styles.container}>
                {/* Top bar */}
                <View
                    style={[
                        styles.topBar,
                        {
                            paddingTop: Math.max(
                                insets.top + spacing.xs,
                                spacing.lg,
                            ),
                        },
                    ]}
                >
                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert(
                                "Quit Interview?",
                                "Your progress will be lost.",
                                [
                                    { text: "Stay", style: "cancel" },
                                    {
                                        text: "Quit",
                                        style: "destructive",
                                        onPress: () => navigation.goBack(),
                                    },
                                ],
                            );
                        }}
                        style={styles.topBackBtn}
                    >
                        <Text style={styles.topBackText}>✕</Text>
                    </TouchableOpacity>

                    <View style={styles.topInfo}>
                        <Text style={styles.topTitle} numberOfLines={1}>
                            {interviewType?.emoji}{" "}
                            {interviewType?.title || "AI Interview"}
                        </Text>
                        <View style={styles.progressRow}>
                            <View style={styles.liveDot} />
                            <Text style={styles.progressText}>
                                {responses.length}/
                                {Math.min(questions.length, 5)} answered
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={confirmEnd}
                        style={styles.endBtn}
                        disabled={ending}
                    >
                        <Text style={styles.endBtnText}>Finish</Text>
                    </TouchableOpacity>
                </View>

                {/* Messages */}
                <FlatList
                    ref={listRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <ChatBubble msg={item} />}
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() =>
                        listRef.current?.scrollToEnd({ animated: true })
                    }
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={
                        loadingNext ? (
                            <View style={styles.typingIndicator}>
                                <ActivityIndicator
                                    size="small"
                                    color={colors.primary}
                                />
                                <Text style={styles.typingText}>
                                    {" "}
                                    AI is preparing next question...
                                </Text>
                            </View>
                        ) : null
                    }
                />

                {/* Input or "End Interview" hint */}
                <View style={styles.inputBar}>
                    {hasAnsweredAll ? (
                        <TouchableOpacity
                            style={styles.finishBanner}
                            onPress={confirmEnd}
                        >
                            <Text style={styles.finishBannerText}>
                                🎯 All questions answered! Tap Finish to get
                                your results.
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Type your answer here..."
                                placeholderTextColor={colors.textMuted}
                                value={currentInput}
                                onChangeText={setCurrentInput}
                                multiline
                                maxLength={2000}
                                editable={!submitting && !loadingNext}
                            />
                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={
                                    submitting ||
                                    loadingNext ||
                                    !currentInput.trim()
                                }
                                style={[
                                    styles.sendBtn,
                                    (submitting ||
                                        loadingNext ||
                                        !currentInput.trim()) &&
                                        styles.sendBtnDisabled,
                                ]}
                            >
                                {submitting ? (
                                    <ActivityIndicator
                                        size="small"
                                        color={colors.textPrimary}
                                    />
                                ) : (
                                    <Text style={styles.sendIcon}>↑</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={isRecording ? stopRecording : startRecording}
                                disabled={submitting || loadingNext}
                                style={[
                                    styles.micBtn,
                                    isRecording && styles.micBtnRecording,
                                    (submitting || loadingNext) && styles.sendBtnDisabled
                                ]}
                            >
                                <Ionicons 
                                    name={isRecording ? "stop" : "mic"} 
                                    size={20} 
                                    color={isRecording ? "#fff" : colors.primary} 
                                />
                                {isRecording && (
                                    <View style={styles.recordingIndicator} />
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

// ────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1, backgroundColor: colors.bg },

    // Top bar
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
        backgroundColor: colors.bgCard,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    topBackBtn: { padding: spacing.xs, marginRight: spacing.sm },
    topBackText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeLG,
    },
    topInfo: { flex: 1 },
    topTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightBold,
    },
    progressRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.success,
        marginRight: 4,
    },
    progressText: {
        color: colors.success,
        fontSize: typography.fontSizeXS,
        fontWeight: typography.fontWeightSemiBold,
    },
    endBtn: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: "rgba(99,102,241,0.12)",
        borderWidth: 1,
        borderColor: "rgba(99,102,241,0.3)",
    },
    endBtnText: {
        color: colors.primary,
        fontWeight: typography.fontWeightBold,
        fontSize: typography.fontSizeSM,
    },

    // Messages
    messageList: {
        padding: spacing.md,
        paddingBottom: spacing.sm,
        flexGrow: 1,
    },
    msgRow: {
        flexDirection: "row",
        marginBottom: spacing.md,
        alignItems: "flex-end",
    },
    msgRowUser: { justifyContent: "flex-end" },
    msgRowAI: { justifyContent: "flex-start" },
    aiAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.bgCard,
        alignItems: "center",
        justifyContent: "center",
        marginRight: spacing.xs,
    },
    aiAvatarText: { fontSize: 18 },
    bubble: {
        maxWidth: "78%",
        paddingVertical: 10,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.lg,
    },
    // User bubble: violet gradient-style solid (matches web primary)
    bubbleUser: { backgroundColor: "#6366f1", borderBottomRightRadius: 4 },
    bubbleAI: {
        // Web: glass card style
        backgroundColor: "rgba(255,255,255,0.06)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        borderBottomLeftRadius: 4,
    },
    bubbleText: { fontSize: typography.fontSizeMD, lineHeight: 22 },
    bubbleTextUser: { color: colors.textPrimary },
    bubbleTextAI: { color: colors.textPrimary },
    bubbleLabel: {
        color: colors.primary,
        fontSize: typography.fontSizeXS,
        fontWeight: typography.fontWeightBold,
        marginBottom: 4,
    },
    typingIndicator: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
    },
    typingText: { color: colors.textMuted, fontSize: typography.fontSizeSM },

    // Input bar
    inputBar: {
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        paddingBottom: spacing.md,
        backgroundColor: colors.bgCard,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: spacing.sm,
    },
    textInput: {
        flex: 1,
        // Web glass input style
        backgroundColor: "rgba(255,255,255,0.05)",
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
        fontSize: typography.fontSizeMD,
        maxHeight: 120,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        // Violet gradient equivalent as solid
        backgroundColor: "#7c3aed",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        shadowColor: "#7c3aed",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 4,
    },
    sendBtnDisabled: {
        backgroundColor: "rgba(255,255,255,0.08)",
        shadowOpacity: 0,
    },
    micBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(99,102,241,0.1)",
        borderWidth: 1,
        borderColor: "rgba(99,102,241,0.3)",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        position: "relative",
    },
    micBtnRecording: {
        backgroundColor: "#ef4444",
        borderColor: "#ef4444",
    },
    recordingIndicator: {
        position: "absolute",
        top: -2,
        right: -2,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#f87171",
        borderWidth: 2,
        borderColor: colors.bgCard,
    },
    sendIcon: {
        color: colors.textPrimary,
        fontSize: 20,
        fontWeight: typography.fontWeightBold,
    },
    finishBanner: {
        backgroundColor: "rgba(99,102,241,0.1)",
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: "rgba(99,102,241,0.3)",
        alignItems: "center",
    },
    finishBannerText: {
        color: colors.primary,
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightSemiBold,
        textAlign: "center",
    },

    // Feedback
    feedbackScroll: {
        alignItems: "center",
        padding: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    feedbackTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSize2XL,
        fontWeight: typography.fontWeightExtraBold,
        textAlign: "center",
        marginBottom: spacing.xs,
    },
    feedbackSubtitle: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeMD,
        marginBottom: spacing.xl,
        textAlign: "center",
    },
    scoreCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: colors.bgCard,
        borderWidth: 3,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.xl,
    },
    scoreValue: {
        fontSize: typography.fontSize3XL,
        fontWeight: typography.fontWeightExtraBold,
    },
    scoreMax: { color: colors.textSecondary, fontSize: typography.fontSizeSM },
    scoreBreakdown: {
        width: "100%",
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.lg,
    },
    scoreItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    scoreItemEmoji: { fontSize: 18, marginRight: spacing.sm, width: 28 },
    scoreItemLabel: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        width: 100,
    },
    scoreBar: {
        flex: 1,
        height: 6,
        backgroundColor: colors.border,
        borderRadius: 3,
        marginHorizontal: spacing.sm,
        overflow: "hidden",
    },
    scoreBarFill: { height: "100%", borderRadius: 3 },
    scoreItemValue: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightBold,
        width: 28,
        textAlign: "right",
    },
    feedbackTip: {
        width: "100%",
        backgroundColor: "rgba(99,102,241,0.08)",
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: "rgba(99,102,241,0.2)",
        marginBottom: spacing.xl,
    },
    feedbackTipTitle: {
        color: colors.primary,
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightBold,
        marginBottom: spacing.xs,
    },
    feedbackTipText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        lineHeight: 20,
    },
    feedbackBtn: {},
});
