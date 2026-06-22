import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, typography, spacing, borderRadius } from "../utils/theme";

export function ErrorMessage({ message, onRetry, compact = false }) {
    if (!message) return null;
    return (
        <View style={[styles.container, compact && styles.compact]}>
            <Text style={styles.icon}>⚠️</Text>
            <Text style={styles.message}>{message}</Text>
            {onRetry && (
                <TouchableOpacity
                    onPress={onRetry}
                    style={styles.retryBtn}
                    activeOpacity={0.8}
                >
                    <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        // Web error state: subtle red tint
        backgroundColor: "rgba(239,68,68,0.08)",
        borderColor: "rgba(239,68,68,0.2)",
        borderWidth: 1,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        alignItems: "center",
        margin: spacing.md,
    },
    compact: {
        margin: 0,
        padding: spacing.sm,
    },
    icon: { fontSize: 22, marginBottom: spacing.xs },
    message: {
        color: "#fca5a5",
        fontSize: typography.fontSizeSM,
        textAlign: "center",
        lineHeight: 20,
    },
    retryBtn: {
        marginTop: spacing.sm,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: "rgba(239,68,68,0.3)",
        backgroundColor: "rgba(239,68,68,0.06)",
    },
    retryText: {
        color: "#fca5a5",
        fontSize: typography.fontSizeXS,
        fontWeight: typography.fontWeightSemiBold,
    },
});
