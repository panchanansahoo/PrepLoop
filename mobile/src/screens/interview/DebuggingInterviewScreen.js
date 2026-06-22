import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, TextInput } from "react-native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { Ionicons } from "@expo/vector-icons";

const BUGGY_CODE = `function findMax(arr) {
  let max = 0; // BUG: What if all numbers are negative?
  for (let i = 1; i <= arr.length; i++) { // BUG: Out of bounds
    if (arr[i] > max) {
      max = arr[i];
    }
  }
  return max;
}`;

export default function DebuggingInterviewScreen({ navigation }) {
    const [feedback, setFeedback] = useState("");
    const [timeLeft, setTimeLeft] = useState(15 * 60);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScreenHeader title="Debugging Challenge" onBack={() => navigation.goBack()} />
            
            <ScrollView contentContainerStyle={styles.container}>
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
                    onChangeText={setFeedback}
                    textAlignVertical="top"
                />

                <TouchableOpacity 
                    style={styles.submitBtn}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.submitBtnText}>Submit Analysis</Text>
                </TouchableOpacity>
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
    textInput: { backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, padding: spacing.md, color: colors.textPrimary, height: 150, fontSize: typography.fontSizeMD, marginBottom: spacing.xl },
    submitBtn: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: "center" },
    submitBtnText: { color: "#fff", fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold },
});
