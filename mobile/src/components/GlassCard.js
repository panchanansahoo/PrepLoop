/**
 * PrepLoop Mobile — GlassCard Component
 *
 * Glassmorphism-inspired card matching web's .glass-panel:
 *   background: rgba(18,18,18,0.4)
 *   backdrop-filter: blur(24px)  — approximated with solid bg on RN
 *   border: 1px solid rgba(255,255,255,0.1)
 *
 * Usage:
 *   <GlassCard accent="#6366f1" elevated>
 *     <Text>Content</Text>
 *   </GlassCard>
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, borderRadius, spacing, shadows } from "../utils/theme";

export default function GlassCard({
    children,
    style,
    accent,
    elevated = false,
    gradient = false,
    gradientColors,
    onLayout,
}) {
    const cardContent = (
        <View
            style={[
                styles.card,
                elevated && shadows.card,
                accent && { borderLeftWidth: 3, borderLeftColor: accent },
                style,
            ]}
            onLayout={onLayout}
        >
            {children}
        </View>
    );

    if (gradient) {
        return (
            <LinearGradient
                colors={gradientColors || colors.gradientCard}
                style={[
                    styles.gradientWrapper,
                    elevated && shadows.card,
                    style,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View
                    style={[
                        styles.innerCard,
                        accent && { borderLeftWidth: 3, borderLeftColor: accent },
                    ]}
                >
                    {children}
                </View>
            </LinearGradient>
        );
    }

    return cardContent;
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "rgba(15, 15, 20, 0.85)", // approximates glass-panel
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        // Note: React Native doesn't support backdrop-filter blur
        // We approximate with a slightly opaque background
    },

    gradientWrapper: {
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
    },

    innerCard: {
        padding: spacing.md,
    },
});
