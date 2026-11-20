import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    SafeAreaView,
    ActivityIndicator,
} from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import apiClient, { API_BASE_URL } from "../../api/apiClient";
import { storage } from "../../utils/storage";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { ScreenHeader } from "../../components/ScreenHeader";

export function getVoiceWsUrl(token) {
    const base = API_BASE_URL.replace(/^http/, "ws");
    return `${base}/ws/voice?token=${encodeURIComponent(token || "")}`;
}

export default function VoiceInterviewScreen({ navigation }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [recordingDuration, setRecordingDuration] = useState(0);

    const wsRef = useRef(null);
    const recordingRef = useRef(null);
    const timerRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const isMountedRef = useRef(true);

    const connectSocket = useCallback(async () => {
        if (!isMountedRef.current) return;
        try {
            const token = await storage.getToken();
            const wsUrl = getVoiceWsUrl(token);
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                if (isMountedRef.current) {
                    setIsConnected(true);
                    reconnectAttemptsRef.current = 0;
                }
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.transcript && isMountedRef.current) {
                        setTranscript((prev) => `${prev} ${data.transcript}`);
                    }
                } catch {}
            };

            ws.onerror = (err) => {
                console.warn("[VoiceWS] Socket error", err);
            };

            ws.onclose = () => {
                if (isMountedRef.current) {
                    setIsConnected(false);
                    // Exponential backoff reconnect: 1s, 2s, 4s, up to 10s max
                    if (reconnectAttemptsRef.current < 5) {
                        const delay = Math.min(10000, 1000 * Math.pow(2, reconnectAttemptsRef.current));
                        reconnectAttemptsRef.current += 1;
                        reconnectTimeoutRef.current = setTimeout(connectSocket, delay);
                    }
                }
            };
        } catch (err) {
            console.warn("[VoiceWS] Init error", err);
        }
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        connectSocket();

        return () => {
            isMountedRef.current = false;
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (recordingRef.current) {
                recordingRef.current.stopAndUnloadAsync().catch(() => {});
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connectSocket]);

    const startRecording = async () => {
        try {
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status !== "granted") {
                Alert.alert(
                    "Microphone Permission Required",
                    "Please grant microphone permissions to use voice interview.",
                );
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY,
            );

            recordingRef.current = recording;
            setIsRecording(true);
            setRecordingDuration(0);

            timerRef.current = setInterval(() => {
                setRecordingDuration((prev) => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Failed to start voice recording", err);
            Alert.alert("Error", "Could not start recording. Please try again.");
        }
    };

    const stopRecording = async () => {
        setIsRecording(false);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        const recording = recordingRef.current;
        if (!recording) return;

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            recordingRef.current = null;

            if (!uri) return;

            setIsTranscribing(true);
            try {
                const formData = new FormData();
                formData.append("audio", {
                    uri,
                    name: "voice-interview.m4a",
                    type: "audio/m4a",
                });

                const res = await apiClient.post("/api/voice/stt", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                    timeout: 25000,
                });

                const text = res.data?.transcript || res.data?.text;
                if (text && text.trim()) {
                    setTranscript((prev) => prev ? `${prev}\n${text.trim()}` : text.trim());
                    // Send to socket if open
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                        wsRef.current.send(JSON.stringify({ type: "transcript", transcript: text.trim() }));
                    }
                } else {
                    Alert.alert("Voice Notice", "No speech detected in this recording.");
                }
            } catch (err) {
                console.warn("[VoiceInterview] STT upload failed:", err?.message);
                Alert.alert(
                    "Transcription Error",
                    "Could not transcribe audio. Check connection and retry.",
                );
            } finally {
                setIsTranscribing(false);
            }
        } catch (err) {
            console.error("Failed to stop voice recording", err);
            setIsTranscribing(false);
        }
    };

    const formatDuration = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScreenHeader
                title="Voice Interview"
                onBack={() => navigation.goBack()}
            />
            <View style={styles.content}>
                <View style={styles.statusBadge}>
                    <View
                        style={[
                            styles.dot,
                            { backgroundColor: isConnected ? colors.success : colors.error },
                        ]}
                    />
                    <Text style={styles.statusText}>
                        {isConnected ? "Voice Stream Ready" : "Reconnecting..."}
                    </Text>
                </View>

                <View style={styles.transcriptCard}>
                    <Text style={styles.transcriptLabel}>Live Transcript:</Text>
                    <Text style={styles.transcript}>
                        {transcript || "Tap the microphone below and speak your response..."}
                    </Text>
                </View>

                {isRecording && (
                    <View style={styles.recordingStatusContainer}>
                        <View style={styles.recordingPulse} />
                        <Text style={styles.recordingDurationText}>
                            Recording: {formatDuration(recordingDuration)}
                        </Text>
                    </View>
                )}

                {isTranscribing && (
                    <View style={styles.transcribingContainer}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.transcribingText}>Transcribing speech...</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[
                        styles.micButton,
                        isRecording && styles.micButtonActive,
                        isTranscribing && styles.micButtonDisabled,
                    ]}
                    onPress={isRecording ? stopRecording : startRecording}
                    disabled={isTranscribing}
                    accessibilityRole="button"
                    accessibilityLabel={isRecording ? "Stop voice recording" : "Start voice recording"}
                    accessibilityState={{ disabled: isTranscribing, busy: isTranscribing || isRecording }}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name={isRecording ? "stop" : "mic"}
                        size={32}
                        color="#fff"
                    />
                </TouchableOpacity>
                <Text style={styles.micHint}>
                    {isRecording ? "Tap to finish speaking" : "Tap microphone to speak"}
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { flex: 1, padding: spacing.lg, alignItems: "center" },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.bgCard,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        marginBottom: spacing.lg,
    },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.xs },
    statusText: { color: colors.textSecondary, fontSize: typography.fontSizeXS },
    transcriptCard: {
        width: "100%",
        flex: 1,
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.xl,
    },
    transcriptLabel: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeXS,
        fontWeight: "600",
        marginBottom: spacing.xs,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    transcript: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeMD,
        lineHeight: 24,
    },
    recordingStatusContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.md,
    },
    recordingPulse: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.error,
        marginRight: spacing.xs,
    },
    recordingDurationText: {
        color: colors.error,
        fontSize: typography.fontSizeSM,
        fontWeight: "600",
    },
    transcribingContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.md,
        gap: spacing.xs,
    },
    transcribingText: {
        color: colors.primary,
        fontSize: typography.fontSizeSM,
    },
    micButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    micButtonActive: {
        backgroundColor: colors.error,
        shadowColor: colors.error,
    },
    micButtonDisabled: {
        opacity: 0.6,
    },
    micHint: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        marginTop: spacing.sm,
    },
});
