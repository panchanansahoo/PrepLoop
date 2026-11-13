import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    SafeAreaView,
} from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../../api/apiClient";
import { storage } from "../../utils/storage";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { ScreenHeader } from "../../components/ScreenHeader";

export function getVoiceWsUrl(token) {
    const base = API_BASE_URL.replace(/^http/, "ws");
    return `${base}/ws/voice?token=${encodeURIComponent(token || "")}`;
}

export default function VoiceInterviewScreen({ navigation }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [transcript, setTranscript] = useState("");
    const wsRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        async function initSocket() {
            try {
                const token = await storage.getToken();
                const wsUrl = getVoiceWsUrl(token);
                const ws = new WebSocket(wsUrl);
                wsRef.current = ws;

                ws.onopen = () => {
                    if (isMounted) setIsConnected(true);
                };

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.transcript && isMounted) {
                            setTranscript((prev) => `${prev} ${data.transcript}`);
                        }
                    } catch {}
                };

                ws.onerror = (err) => {
                    console.warn("[VoiceWS] Socket error", err);
                };

                ws.onclose = () => {
                    if (isMounted) setIsConnected(false);
                };
            } catch (err) {
                console.warn("[VoiceWS] Init error", err);
            }
        }

        initSocket();

        return () => {
            isMounted = false;
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

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
                        {isConnected ? "Voice Stream Ready" : "Connecting..."}
                    </Text>
                </View>
                <Text style={styles.transcript}>
                    {transcript || "Speak into your microphone to start..."}
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
        marginBottom: spacing.xl,
    },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.xs },
    statusText: { color: colors.textSecondary, fontSize: typography.fontSizeXS },
    transcript: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeMD,
        lineHeight: 24,
        textAlign: "center",
    },
});
