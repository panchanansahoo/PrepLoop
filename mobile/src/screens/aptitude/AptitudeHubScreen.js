import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { Ionicons } from "@expo/vector-icons";

const CATEGORIES = [
    {
        id: "quantitative",
        title: "Quantitative Aptitude",
        icon: "calculator-outline",
        description: "Numbers, algebra, geometry, and data interpretation.",
        color: "#6366f1",
        count: 150,
    },
    {
        id: "logical",
        title: "Logical Reasoning",
        icon: "git-network-outline",
        description: "Puzzles, series, seating arrangements, and syllogism.",
        color: "#8b5cf6",
        count: 120,
    },
    {
        id: "verbal",
        title: "Verbal Ability",
        icon: "chatbubbles-outline",
        description: "Reading comprehension, grammar, and vocabulary.",
        color: "#ec4899",
        count: 100,
    },
];

export default function AptitudeHubScreen({ navigation }) {
    const handleCategoryPress = (category) => {
        navigation.navigate("AptitudePractice", { category: category.id, title: category.title });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Aptitude Hub</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.heroSection}>
                    <Text style={styles.heroTitle}>Master Your Aptitude</Text>
                    <Text style={styles.heroSubtitle}>
                        Practice quantitative, logical, and verbal questions to ace your assessments.
                    </Text>
                </View>

                <View style={styles.grid}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={styles.cardWrapper}
                            activeOpacity={0.8}
                            onPress={() => handleCategoryPress(cat)}
                        >
                            <LinearGradient
                                colors={[colors.bgCard, colors.bgCardAlt]}
                                style={styles.card}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: cat.color + "20" }]}>
                                    <Ionicons name={cat.icon} size={28} color={cat.color} />
                                </View>
                                <Text style={styles.cardTitle}>{cat.title}</Text>
                                <Text style={styles.cardDescription}>{cat.description}</Text>
                                
                                <View style={styles.cardFooter}>
                                    <View style={styles.countBadge}>
                                        <Text style={styles.countText}>{cat.count}+ Questions</Text>
                                    </View>
                                    <Ionicons name="arrow-forward" size={20} color={colors.textSecondary} />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.bgOverlay,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.bgCard,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    headerTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightSemiBold,
    },
    container: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
    },
    heroSection: {
        marginBottom: spacing.xl,
        marginTop: spacing.md,
    },
    heroTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSize2XL,
        fontWeight: typography.fontWeightBold,
        marginBottom: spacing.xs,
    },
    heroSubtitle: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeMD,
        lineHeight: 22,
    },
    grid: {
        gap: spacing.md,
    },
    cardWrapper: {
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.borderLight,
        overflow: "hidden",
    },
    card: {
        padding: spacing.lg,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: borderRadius.md,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.md,
    },
    cardTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightSemiBold,
        marginBottom: spacing.xs,
    },
    cardDescription: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        lineHeight: 20,
        marginBottom: spacing.lg,
    },
    cardFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: spacing.md,
    },
    countBadge: {
        backgroundColor: colors.bgInput,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    countText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeXS,
        fontWeight: typography.fontWeightMedium,
    },
});
