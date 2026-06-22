import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { TagBadge } from "../../components/TagBadge";
import { companyApi } from "../../api/companyApi";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";

function normalizeCompanyDetails(data, fallbackName) {
    const company = data?.company || data?.details || data || {};
    const questions = Array.isArray(data?.questions)
        ? data.questions
        : Array.isArray(company.questions)
          ? company.questions
          : [];

    return {
        company: {
            id: company.id ?? data?.companyId ?? null,
            name: company.name || fallbackName || "Company",
            description:
                company.description ||
                company.overview ||
                company.summary ||
                "",
            questionCount:
                company.questionCount ??
                company.questions_count ??
                questions.length,
            industry: company.industry || company.domain || "",
            logoUrl: company.logoUrl || company.logo_url || "",
        },
        questions,
    };
}

export default function CompanyDetailsScreen({ route, navigation }) {
    const { companyId, name } = route.params || {};
    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState(null);

    useEffect(() => {
        let mounted = true;

        const loadCompany = async () => {
            if (!companyId) {
                setLoading(false);
                return;
            }

            try {
                const data = await companyApi.getCompanyDetails(companyId);
                if (!mounted) return;
                setDetails(normalizeCompanyDetails(data, name));
            } catch (error) {
                console.error("Failed to load company details:", error);
                if (mounted) {
                    setDetails(null);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadCompany();

        return () => {
            mounted = false;
        };
    }, [companyId, name]);

    const company = details?.company;
    const questions = details?.questions || [];

    const stats = useMemo(
        () => [
            { label: "Questions", value: company?.questionCount ?? questions.length },
            { label: "Industry", value: company?.industry || "General" },
        ],
        [company, questions.length],
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <ScreenHeader
                    title={name || "Company Details"}
                    onBack={() => navigation.goBack()}
                />
                <LoadingSpinner />
            </View>
        );
    }

    if (!companyId || !company) {
        return (
            <View style={styles.container}>
                <ScreenHeader
                    title={name || "Company Details"}
                    onBack={() => navigation.goBack()}
                />
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>Company not found</Text>
                    <Text style={styles.emptyText}>
                        We could not load this company profile.
                    </Text>
                    <Button title="Go Back" onPress={() => navigation.goBack()} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader title={company.name} onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.hero}>
                    <TagBadge label="Company Prep" color={colors.primaryLight} />
                    <Text style={styles.title}>{company.name}</Text>
                    {company.description ? (
                        <Text style={styles.description}>{company.description}</Text>
                    ) : (
                        <Text style={styles.description}>
                            Practice common interview questions and build a target-specific prep plan.
                        </Text>
                    )}
                </View>

                <View style={styles.statsRow}>
                    {stats.map((stat) => (
                        <Card key={stat.label} style={styles.statCard}>
                            <Text style={styles.statValue}>{stat.value || "—"}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </Card>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Question bank</Text>
                    {questions.length === 0 ? (
                        <Card>
                            <Text style={styles.emptyText}>
                                No company-specific questions were returned yet.
                            </Text>
                        </Card>
                    ) : (
                        questions.map((question, index) => {
                            const text =
                                typeof question === "string"
                                    ? question
                                    : question.question ||
                                      question.text ||
                                      question.prompt ||
                                      `Question ${index + 1}`;

                            return (
                                <Card key={question.id || index} style={styles.questionCard}>
                                    <Text style={styles.questionIndex}>
                                        Question {index + 1}
                                    </Text>
                                    <Text style={styles.questionText}>{text}</Text>
                                </Card>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
    hero: { marginBottom: spacing.lg },
    title: {
        color: colors.textPrimary,
        fontSize: typography.fontSize3XL,
        fontWeight: typography.fontWeightExtraBold,
        marginTop: spacing.sm,
        marginBottom: spacing.sm,
    },
    description: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeMD,
        lineHeight: 22,
    },
    statsRow: {
        flexDirection: "row",
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    statCard: {
        flex: 1,
        alignItems: "center",
    },
    statValue: {
        color: colors.textPrimary,
        fontSize: typography.fontSize2XL,
        fontWeight: typography.fontWeightExtraBold,
    },
    statLabel: {
        color: colors.textMuted,
        fontSize: typography.fontSizeXS,
        marginTop: 2,
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    section: { marginBottom: spacing.lg },
    sectionTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightBold,
        marginBottom: spacing.sm,
    },
    questionCard: { marginBottom: spacing.sm },
    questionIndex: {
        color: colors.primaryLight,
        fontSize: typography.fontSizeXS,
        fontWeight: typography.fontWeightBold,
        textTransform: "uppercase",
        marginBottom: spacing.xs,
    },
    questionText: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeMD,
        lineHeight: 22,
    },
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.xl,
    },
    emptyTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightBold,
        marginBottom: spacing.xs,
    },
    emptyText: {
        color: colors.textSecondary,
        textAlign: "center",
        marginBottom: spacing.md,
        lineHeight: 20,
    },
});
