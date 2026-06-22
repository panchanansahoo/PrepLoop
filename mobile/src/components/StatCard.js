import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, typography, spacing, borderRadius } from "../utils/theme";

export function StatCard({
    label,
    value,
    subtitle,
    iconEmoji,
    accentColor = colors.primary,
}) {
    return (
        <View style={[styles.card, { borderColor: accentColor + "28" }]}>
            {/* Icon badge — matching web's colored circle */}
            <View
                style={[
                    styles.iconBadge,
                    { backgroundColor: accentColor + "15" },
                ]}
            >
                <Text style={styles.icon}>{iconEmoji}</Text>
            </View>
            {/* Value — large, accent colored */}
            <Text
                style={[styles.value, { color: accentColor }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
            >
                {value ?? "—"}
            </Text>
            {/* Label — zinc-400 */}
            <Text style={styles.label} numberOfLines={2}>
                {label}
            </Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        // Web card: rgba(10,10,10,0.6) bg, rgba(255,255,255,0.08) border
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        alignItems: "center",
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 3,
    },
    iconBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.xs,
    },
    icon: { fontSize: 20 },
    value: {
        fontSize: typography.fontSize2XL,
        fontWeight: typography.fontWeightExtraBold,
        letterSpacing: -0.5,
    },
    label: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeXS,
        fontWeight: typography.fontWeightMedium,
        marginTop: 2,
        textAlign: "center",
        lineHeight: 15,
    },
    subtitle: {
        color: colors.textMuted,
        fontSize: 10,
        marginTop: 1,
    },
});
