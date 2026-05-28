import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "./Button";
import { colors, typography, spacing } from "../utils/theme";

export function EmptyState({
    emoji = "📭",
    title,
    message,
    actionLabel,
    onAction,
}) {
    return (
        <View style={styles.container}>
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={styles.title}>{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
            {actionLabel && onAction ? (
                <Button
                    title={actionLabel}
                    onPress={onAction}
                    size="sm"
                    style={styles.btn}
                />
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.xxl,
    },
    emoji: {
        fontSize: 48,
        marginBottom: spacing.md,
        opacity: 0.7,
    },
    title: {
        // Web: --text-primary white
        color: colors.textPrimary,
        fontSize: typography.fontSizeXL,
        fontWeight: typography.fontWeightBold,
        textAlign: "center",
        marginBottom: spacing.sm,
        letterSpacing: -0.2,
    },
    message: {
        // Web: --zinc-400
        color: colors.textSecondary,
        fontSize: typography.fontSizeMD,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: spacing.lg,
    },
    btn: { marginTop: spacing.sm },
});
