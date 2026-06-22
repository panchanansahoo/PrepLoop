import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, typography, spacing, borderRadius } from "../utils/theme";

// Web difficulty colors (exact from web App.css)
const DIFFICULTY_MAP = {
    easy: {
        color: "#10b981",
        bg: "rgba(16,185,129,0.12)",
        border: "rgba(16,185,129,0.25)",
    },
    medium: {
        color: "#f59e0b",
        bg: "rgba(245,158,11,0.12)",
        border: "rgba(245,158,11,0.25)",
    },
    hard: {
        color: "#ef4444",
        bg: "rgba(239,68,68,0.12)",
        border: "rgba(239,68,68,0.25)",
    },
};

export function TagBadge({ label, color, difficulty }) {
    const diff = difficulty?.toLowerCase();
    const d = DIFFICULTY_MAP[diff];

    const bgColor = d ? d.bg : color ? color + "18" : "rgba(99,102,241,0.12)";
    const txtColor = d ? d.color : color || colors.primary;
    const brdColor = d
        ? d.border
        : color
          ? color + "33"
          : "rgba(99,102,241,0.3)";

    return (
        <View
            style={[
                styles.badge,
                { backgroundColor: bgColor, borderColor: brdColor },
            ]}
        >
            <Text style={[styles.text, { color: txtColor }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingVertical: 3,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        alignSelf: "flex-start",
    },
    text: {
        fontSize: typography.fontSizeXS,
        fontWeight: typography.fontWeightBold,
        textTransform: "capitalize",
        letterSpacing: 0.3,
    },
});
