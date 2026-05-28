/**
 * Card — matching web's glass card style.
 * Web: background rgba(10,10,10,0.6), border rgba(255,255,255,0.08)
 */
import React from "react";
import { View, StyleSheet } from "react-native";
import { colors, borderRadius, spacing } from "../utils/theme";

export function Card({ children, style, elevated = false, accent = null }) {
    return (
        <View
            style={[
                styles.card,
                elevated && styles.elevated,
                accent && { borderLeftColor: accent, borderLeftWidth: 3 },
                style,
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    // Web card: background rgba(10,10,10,0.6), border rgba(255,255,255,0.08)
    card: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    elevated: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 5,
    },
});
