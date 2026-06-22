import React, { useState } from "react";
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { resumeApi } from "../../api/resumeApi";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { colors, typography, spacing, borderRadius, shadows } from "../../utils/theme";

const STATUS_COLORS = { strong: "#10b981", needs_work: "#f59e0b", weak: "#ef4444", missing: "#71717a" };
const STATUS_LABELS = { strong: "Strong", needs_work: "Needs Work", weak: "Weak", missing: "Missing" };

function ScoreRing({ score, size = 100 }) {
    const getColor = (s) => s >= 75 ? "#10b981" : s >= 50 ? "#f59e0b" : "#ef4444";
    const color = getColor(score);
    return (
        <View style={[sr.ring, { width: size, height: size, borderRadius: size / 2, borderColor: color + "44" }]}>
            <Text style={[sr.score, { color, fontSize: size * 0.32 }]}>{score}</Text>
            <Text style={sr.label}>ATS Score</Text>
        </View>
    );
}
const sr = StyleSheet.create({
    ring: { borderWidth: 4, alignItems: "center", justifyContent: "center", backgroundColor: colors.bgCard },
    score: { fontWeight: "800" },
    label: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
});

function SectionCard({ section }) {
    const statusColor = STATUS_COLORS[section.status] || colors.textMuted;
    return (
        <View style={sc.card}>
            <View style={sc.header}>
                <Text style={sc.name}>{section.sectionName}</Text>
                <View style={[sc.badge, { backgroundColor: statusColor + "22", borderColor: statusColor + "44" }]}>
                    <Text style={[sc.badgeText, { color: statusColor }]}>
                        {STATUS_LABELS[section.status] || section.status}
                    </Text>
                </View>
            </View>
            <Text style={sc.feedback}>{section.feedback}</Text>
        </View>
    );
}
const sc = StyleSheet.create({
    card: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
    name: { color: colors.textPrimary, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold },
    badge: { borderRadius: borderRadius.full, borderWidth: 1, paddingVertical: 2, paddingHorizontal: spacing.sm },
    badgeText: { fontSize: 10, fontWeight: typography.fontWeightBold },
    feedback: { color: colors.textSecondary, fontSize: typography.fontSizeSM, lineHeight: 20 },
});

export default function ResumeAnalyzerScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [fileName, setFileName] = useState("");

    async function pickAndAnalyze() {
        try {
            const res = await DocumentPicker.getDocumentAsync({
                type: ["application/pdf", "text/plain"],
                copyToCacheDirectory: true,
            });
            if (res.canceled || !res.assets?.[0]) return;
            const file = res.assets[0];
            setFileName(file.name || "resume.pdf");
            setAnalyzing(true);
            setResult(null);
            const data = await resumeApi.analyzeResume(file.uri);
            setResult(data);
        } catch (err) {
            Alert.alert("Error", err?.response?.data?.error || err?.message || "Failed to analyze resume.");
        } finally {
            setAnalyzing(false);
        }
    }

    const analysis = result?.analysis;

    return (
        <View style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
            <View style={[s.header, { paddingTop: Math.max(insets.top + spacing.sm, spacing.lg) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                    <Text style={s.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={s.headerTitle}>Resume Analyzer</Text>
                <View style={s.backBtn} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
                {/* Upload CTA */}
                {!result && !analyzing && (
                    <View style={s.uploadSection}>
                        <View style={s.uploadIcon}><Text style={{ fontSize: 48 }}>📄</Text></View>
                        <Text style={s.uploadTitle}>Analyze Your Resume</Text>
                        <Text style={s.uploadSub}>
                            Upload your resume to get an AI-powered ATS score, section-by-section feedback, and actionable suggestions.
                        </Text>
                        <TouchableOpacity activeOpacity={0.85} onPress={pickAndAnalyze}>
                            <LinearGradient colors={["#8b5cf6", "#6d28d9"]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.uploadBtn}>
                                <Text style={s.uploadBtnText}>📎 Upload PDF</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <Text style={s.uploadHint}>Supports PDF and plain text • Max 5MB</Text>
                    </View>
                )}

                {/* Loading */}
                {analyzing && (
                    <View style={s.loadingBox}>
                        <LoadingSpinner message={`Analyzing ${fileName}...`} />
                        <Text style={s.loadingSub}>Our AI is reviewing your resume. This may take 15-30 seconds.</Text>
                    </View>
                )}

                {/* Results */}
                {analysis && (
                    <>
                        {/* Score */}
                        <Card elevated style={s.scoreCard}>
                            <View style={s.scoreRow}>
                                <ScoreRing score={analysis.atsScore || 0} />
                                <View style={s.scoreInfo}>
                                    <Text style={s.scoreLabel}>Your ATS Score</Text>
                                    <Text style={s.scoreHint}>
                                        {analysis.atsScore >= 75 ? "Great! Your resume is well-optimized." :
                                         analysis.atsScore >= 50 ? "Good start. Room for improvement." :
                                         "Needs significant improvement."}
                                    </Text>
                                </View>
                            </View>
                        </Card>

                        {/* Section Analysis */}
                        {analysis.sectionAnalysis?.length > 0 && (
                            <Card elevated style={s.resultsCard}>
                                <Text style={s.sectionTitle}>Section Analysis</Text>
                                {analysis.sectionAnalysis.map((sec, i) => (
                                    <SectionCard key={i} section={sec} />
                                ))}
                            </Card>
                        )}

                        {/* Strengths */}
                        {analysis.strengths?.length > 0 && (
                            <Card elevated style={s.resultsCard}>
                                <Text style={s.sectionTitle}>✅ Strengths</Text>
                                {analysis.strengths.map((s, i) => (
                                    <Text key={i} style={ss.item}>• {s}</Text>
                                ))}
                            </Card>
                        )}

                        {/* Weaknesses */}
                        {analysis.weaknesses?.length > 0 && (
                            <Card elevated style={s.resultsCard}>
                                <Text style={s.sectionTitle}>⚠️ Areas to Improve</Text>
                                {analysis.weaknesses.map((w, i) => (
                                    <Text key={i} style={ss.itemWarn}>• {w}</Text>
                                ))}
                            </Card>
                        )}

                        {/* Quick Wins */}
                        {analysis.quickWins?.length > 0 && (
                            <Card elevated style={s.resultsCard}>
                                <Text style={s.sectionTitle}>🚀 Quick Wins</Text>
                                {analysis.quickWins.map((q, i) => (
                                    <Text key={i} style={ss.item}>• {q}</Text>
                                ))}
                            </Card>
                        )}

                        {/* Re-analyze */}
                        <Button title="Analyze Another Resume" onPress={() => { setResult(null); pickAndAnalyze(); }}
                            variant="outline" fullWidth style={{ marginTop: spacing.lg }} />
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const ss = StyleSheet.create({
    item: { color: colors.textSecondary, fontSize: typography.fontSizeSM, lineHeight: 22, marginBottom: 4 },
    itemWarn: { color: "#f59e0b", fontSize: typography.fontSizeSM, lineHeight: 22, marginBottom: 4 },
});

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
        backgroundColor: colors.bgCardAlt, borderBottomWidth: 1, borderBottomColor: colors.border },
    backBtn: { width: 40, height: 40, justifyContent: "center" },
    backArrow: { color: colors.textPrimary, fontSize: 22, fontWeight: typography.fontWeightBold },
    headerTitle: { color: colors.textPrimary, fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightBold },
    scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },

    // Upload
    uploadSection: { alignItems: "center", paddingTop: spacing.xxl },
    uploadIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.bgCard,
        borderWidth: 1, borderColor: colors.borderLight, alignItems: "center", justifyContent: "center",
        marginBottom: spacing.xl, ...shadows.md },
    uploadTitle: { color: colors.textPrimary, fontSize: typography.fontSize2XL,
        fontWeight: typography.fontWeightExtraBold, marginBottom: spacing.sm, textAlign: "center" },
    uploadSub: { color: colors.textSecondary, fontSize: typography.fontSizeMD, textAlign: "center",
        lineHeight: 22, marginBottom: spacing.xl, paddingHorizontal: spacing.md },
    uploadBtn: { paddingVertical: 16, paddingHorizontal: spacing.xxl, borderRadius: borderRadius.full,
        ...shadows.glow },
    uploadBtnText: { color: "#fff", fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightBold },
    uploadHint: { color: colors.textMuted, fontSize: typography.fontSizeXS, marginTop: spacing.md },

    // Loading
    loadingBox: { alignItems: "center", paddingTop: spacing.xxl },
    loadingSub: { color: colors.textMuted, fontSize: typography.fontSizeSM, textAlign: "center",
        marginTop: spacing.md, paddingHorizontal: spacing.lg },

    // Results
    scoreCard: { marginBottom: spacing.md },
    scoreRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
    scoreInfo: { flex: 1 },
    scoreLabel: { color: colors.textPrimary, fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightBold },
    scoreHint: { color: colors.textSecondary, fontSize: typography.fontSizeSM, marginTop: 4, lineHeight: 20 },
    resultsCard: { marginBottom: spacing.md },
    sectionTitle: { color: colors.textPrimary, fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightBold, marginBottom: spacing.sm },
});
