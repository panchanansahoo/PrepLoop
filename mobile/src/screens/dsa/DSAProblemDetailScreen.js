import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    TextInput,
    Alert,
} from "react-native";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { TagBadge } from "../../components/TagBadge";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { dsaApi } from "../../api/dsaApi";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Note: difficulty color is handled by TagBadge component using the difficulty prop

function Section({ title, children }) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {children}
        </View>
    );
}

export default function DSAProblemDetailScreen({ route, navigation }) {
    const { problem } = route.params || {};
    const insets = useSafeAreaInsets();
    const [note, setNote] = useState("");
    const [savingNote, setSavingNote] = useState(false);
    const [noteSaved, setNoteSaved] = useState(false);

    if (!problem) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Problem not found.</Text>
                <Button
                    title="Go Back"
                    onPress={() => navigation.goBack()}
                    variant="outline"
                />
            </View>
        );
    }

    async function handleSaveNote() {
        if (!note.trim()) return;
        setSavingNote(true);
        try {
            await dsaApi.saveNote(problem.id, note.trim());
            setNoteSaved(true);
            setTimeout(() => setNoteSaved(false), 3000);
        } catch {
            Alert.alert("Error", "Could not save note. Please try again.");
        } finally {
            setSavingNote(false);
        }
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

            {/* Header */}
            <View
                style={[
                    styles.header,
                    {
                        paddingTop: Math.max(
                            insets.top + spacing.sm,
                            spacing.lg,
                        ),
                    },
                ]}
            >
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                >
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerMeta}>
                    <TagBadge
                        label={problem.difficulty || "Unknown"}
                        difficulty={problem.difficulty?.toLowerCase()}
                    />
                    {problem.number && (
                        <Text style={styles.problemNumber}>
                            #{problem.number}
                        </Text>
                    )}
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.body}
                showsVerticalScrollIndicator={false}
            >
                {/* Title */}
                <Text style={styles.title}>{problem.title}</Text>

                {/* Tags row */}
                <View style={styles.tagsRow}>
                    {problem.category && (
                        <TagBadge
                            label={problem.category}
                            color={colors.secondary}
                        />
                    )}
                    {problem.pattern && (
                        <TagBadge label={problem.pattern} color={colors.info} />
                    )}
                    {problem.acceptance != null && (
                        <View style={styles.metaChip}>
                            <Text style={styles.metaChipText}>
                                ✅ {Math.round(problem.acceptance)}% accepted
                            </Text>
                        </View>
                    )}
                </View>

                {/* Description */}
                {problem.description && (
                    <Section title="📋 Problem Description">
                        <Text style={styles.bodyText}>
                            {problem.description}
                        </Text>
                    </Section>
                )}

                {/* Examples */}
                {problem.examples?.length > 0 && (
                    <Section title="💡 Examples">
                        {problem.examples.map((ex, i) => (
                            <Card key={i} style={styles.exampleCard}>
                                <Text style={styles.exampleLabel}>
                                    Example {i + 1}
                                </Text>
                                {ex.input != null && (
                                    <Text style={styles.codeText}>
                                        Input: {ex.input}
                                    </Text>
                                )}
                                {ex.output != null && (
                                    <Text style={styles.codeText}>
                                        Output: {ex.output}
                                    </Text>
                                )}
                                {ex.explanation && (
                                    <Text style={styles.exampleExplanation}>
                                        {ex.explanation}
                                    </Text>
                                )}
                            </Card>
                        ))}
                    </Section>
                )}

                {/* Constraints */}
                {problem.constraints?.length > 0 && (
                    <Section title="⚠️ Constraints">
                        {(Array.isArray(problem.constraints)
                            ? problem.constraints
                            : [problem.constraints]
                        ).map((c, i) => (
                            <Text key={i} style={styles.constraintText}>
                                • {c}
                            </Text>
                        ))}
                    </Section>
                )}

                {/* Hints */}
                {problem.hints?.length > 0 && (
                    <Section title="🔍 Hints">
                        {problem.hints.map((h, i) => (
                            <Card key={i} style={styles.hintCard}>
                                <Text style={styles.hintText}>
                                    <Text style={styles.hintLabel}>
                                        Hint {i + 1}:{" "}
                                    </Text>
                                    {h}
                                </Text>
                            </Card>
                        ))}
                    </Section>
                )}

                {/* Companies */}
                {problem.companies?.length > 0 && (
                    <Section title="🏢 Asked by">
                        <View style={styles.companyRow}>
                            {problem.companies.map((c, i) => (
                                <View key={i} style={styles.companyChip}>
                                    <Text style={styles.companyText}>{c}</Text>
                                </View>
                            ))}
                        </View>
                    </Section>
                )}

                {/* Notes */}
                <Section title="📝 My Notes">
                    <TextInput
                        style={styles.noteInput}
                        placeholder="Add your approach, thoughts, or solution sketch here..."
                        placeholderTextColor={colors.textMuted}
                        value={note}
                        onChangeText={setNote}
                        multiline
                        textAlignVertical="top"
                    />
                    <View style={styles.noteBtnRow}>
                        {noteSaved && (
                            <Text style={styles.savedText}>✅ Saved!</Text>
                        )}
                        <Button
                            title="Save Note"
                            onPress={handleSaveNote}
                            loading={savingNote}
                            disabled={!note.trim()}
                            variant="outline"
                            size="sm"
                        />
                    </View>
                </Section>

                {/* Mobile coding note */}
                <Card style={styles.codingCard}>
                    <Text style={styles.codingTitle}>
                        💻 Want to code the solution?
                    </Text>
                    <Text style={styles.codingText}>
                        Open PrepLoop on the web for the full coding environment
                        with an in-browser code editor, test cases, and AI
                        hints.
                    </Text>
                </Card>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    errorContainer: {
        flex: 1,
        backgroundColor: colors.bg,
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.xl,
    },
    errorText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeMD,
        marginBottom: spacing.md,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        backgroundColor: colors.bgCardAlt,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: { padding: spacing.xs },
    backText: {
        color: "rgba(203,213,225,0.8)",
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightSemiBold,
    },
    headerMeta: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    problemNumber: { color: colors.textMuted, fontSize: typography.fontSizeSM },
    body: { padding: spacing.lg, paddingBottom: spacing.xxl },
    title: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeXL,
        fontWeight: typography.fontWeightExtraBold,
        marginBottom: spacing.md,
        lineHeight: 28,
    },
    tagsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.xs,
        marginBottom: spacing.lg,
    },
    metaChip: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: colors.border,
    },
    metaChipText: { color: colors.textMuted, fontSize: typography.fontSizeXS },
    section: { marginBottom: spacing.xl },
    sectionTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightBold,
        marginBottom: spacing.sm,
    },
    bodyText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeMD,
        lineHeight: 24,
    },
    exampleCard: { marginBottom: spacing.sm },
    exampleLabel: {
        color: colors.primary,
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightBold,
        marginBottom: spacing.xs,
    },
    codeText: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeSM,
        fontFamily: "monospace",
        marginBottom: 2,
    },
    exampleExplanation: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        marginTop: spacing.xs,
        lineHeight: 18,
    },
    constraintText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        lineHeight: 22,
    },
    hintCard: { marginBottom: spacing.sm },
    hintText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        lineHeight: 20,
    },
    hintLabel: {
        color: colors.secondary,
        fontWeight: typography.fontWeightBold,
    },
    companyRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    companyChip: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderWidth: 1,
        borderColor: colors.border,
    },
    companyText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeXS,
    },
    noteInput: {
        backgroundColor: "rgba(255,255,255,0.05)",
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        fontSize: typography.fontSizeMD,
        minHeight: 120,
        lineHeight: 22,
    },
    noteBtnRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        marginTop: spacing.sm,
        gap: spacing.md,
    },
    savedText: {
        color: colors.success,
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightSemiBold,
    },
    codingCard: {
        backgroundColor: "rgba(99,102,241,0.06)",
        borderColor: "rgba(99,102,241,0.2)",
        marginTop: spacing.sm,
    },
    codingTitle: {
        color: "#818cf8",
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightBold,
        marginBottom: spacing.xs,
    },
    codingText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        lineHeight: 20,
    },
});
