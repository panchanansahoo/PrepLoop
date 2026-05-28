/**
 * PrepLoop Mobile — GradientText Component
 *
 * Renders text with a gradient fill, matching the web's .text-gradient:
 *   background: linear-gradient(135deg, #a78bfa, #6366f1, #3b82f6)
 *
 * Usage:
 *   <GradientText style={{ fontSize: 28 }}>Career Growth</GradientText>
 */

import React from "react";
import { Text, StyleSheet } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../utils/theme";

export default function GradientText({
    children,
    style,
    colors: gradientColors,
    start,
    end,
    ...props
}) {
    const textStyle = StyleSheet.flatten(style) || {};

    return (
        <MaskedView
            maskElement={
                <Text
                    style={[styles.maskText, textStyle]}
                    {...props}
                >
                    {children}
                </Text>
            }
        >
            <LinearGradient
                colors={gradientColors || [
                    "#a78bfa", // violet-400
                    "#818cf8", // indigo-400
                    "#6366f1", // indigo-500
                    "#3b82f6", // blue-500
                ]}
                start={start || { x: 0, y: 0 }}
                end={end || { x: 1, y: 1 }}
            >
                {/* Invisible text to size the gradient correctly */}
                <Text
                    style={[styles.maskText, textStyle, { opacity: 0 }]}
                    {...props}
                >
                    {children}
                </Text>
            </LinearGradient>
        </MaskedView>
    );
}

/**
 * Preset gradient color arrays matching web design system.
 */
GradientText.presets = {
    primary: ["#a78bfa", "#818cf8", "#6366f1", "#3b82f6"],
    violet: ["#7c3aed", "#6366f1"],
    pink: ["#a855f7", "#ec4899"],
    emerald: ["#34d399", "#10b981"],
    amber: ["#fbbf24", "#f59e0b"],
    hero: ["#f8fafc", "#a1a1aa"], // web: dash-hero-title
};

const styles = StyleSheet.create({
    maskText: {
        // Defaults — caller overrides via style prop
        fontSize: 24,
        fontWeight: "700",
        color: colors.textPrimary,
    },
});
