import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, TextInput } from "react-native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { Ionicons } from "@expo/vector-icons";

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
    const [reviewComments, setReviewComments] = useState("");
    const [timeLeft, setTimeLeft] = useState(20 * 60);

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
            <ScreenHeader title="Code Review Challenge" onBack={() => navigation.goBack()} />
            
            <ScrollView contentContainerStyle={styles.container}>
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
                    onChangeText={setReviewComments}
                    textAlignVertical="top"
                />

                <TouchableOpacity 
                    style={styles.submitBtn}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.submitBtnText}>Submit Review</Text>
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
    prDescCard: { backgroundColor: colors.bgCard, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.borderLight, marginBottom: spacing.lg },
    prDescTitle: { color: colors.textSecondary, fontSize: typography.fontSizeXS, textTransform: "uppercase", marginBottom: 4 },
    prDescText: { color: colors.textPrimary, fontSize: typography.fontSizeSM, lineHeight: 20 },
    codeContainer: { backgroundColor: "#1e1e24", borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.borderLight, marginBottom: spacing.xl, overflow: "hidden" },
    codeFileHeader: { backgroundColor: "#2d2d36", color: colors.textSecondary, fontSize: typography.fontSizeXS, padding: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    codeText: { color: "#d4d4d8", fontFamily: "monospace", fontSize: 12, lineHeight: 18, padding: spacing.md },
    inputLabel: { color: colors.textPrimary, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold, marginBottom: spacing.sm },
    textInput: { backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, padding: spacing.md, color: colors.textPrimary, height: 180, fontSize: typography.fontSizeMD, marginBottom: spacing.xl },
    submitBtn: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: "center" },
    submitBtnText: { color: "#fff", fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold },
});
