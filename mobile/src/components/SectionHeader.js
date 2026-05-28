/**
 * PrepLoop Mobile — SectionHeader Component
 *
 * Consistent section header matching the web's pattern:
 *   - Optional eyebrow label (small uppercase badge)
 *   - Title (bold)
 *   - Optional subtitle (muted)
 *   - Optional "See All" action link
 *
 * Usage:
 *   <SectionHeader
 *     eyebrow="Most Popular"
 *     title="Quick Actions"
 *     subtitle="Get started with your daily practice"
 *     action={{ label: "See All", onPress: () => {} }}
 *   />
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, typography, spacing, borderRadius } from "../utils/theme";

export default function SectionHeader({
    eyebrow,
    title,
    subtitle,
    action,
    eyebrowColor = "#a78bfa",
    style,
}) {
    return (
        <View style={[styles.container, style]}>
            {/* Eyebrow badge */}
            {eyebrow && (
                <View
                    style={[
                        styles.eyebrow,
                        {
                            backgroundColor: eyebrowColor + "14",
                            borderColor: eyebrowColor + "30",
                        },
                    ]}
                >
                    <Text style={[styles.eyebrowText, { color: eyebrowColor }]}>
                        {eyebrow}
                    </Text>
                </View>
            )}

            {/* Title row with optional action */}
            <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={2}>
                    {title}
                </Text>
                {action && (
                    <TouchableOpacity
                        onPress={action.onPress}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Text style={styles.actionText}>
                            {action.label || "See All"} →
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Subtitle */}
            {subtitle && (
                <Text style={styles.subtitle} numberOfLines={2}>
                    {subtitle}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: spacing.xl,
        marginBottom: spacing.md,
    },

    eyebrow: {
        alignSelf: "flex-start",
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        marginBottom: spacing.sm,
    },

    eyebrowText: {
        fontSize: 10,
        fontWeight: typography.fontWeightBold,
        textTransform: "uppercase",
        letterSpacing: 1.2,
    },

    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    title: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeXL,
        fontWeight: typography.fontWeightBold,
        flex: 1,
        marginRight: spacing.sm,
    },

    actionText: {
        color: colors.primary,
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightSemiBold,
    },

    subtitle: {
        color: colors.textMuted,
        fontSize: typography.fontSizeSM,
        lineHeight: 20,
        marginTop: 4,
    },
});
