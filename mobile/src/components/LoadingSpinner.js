import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { colors, typography, spacing } from "../utils/theme";

export function LoadingSpinner({
    message,
    size = "large",
    fullScreen = false,
}) {
    return (
        <View style={[styles.container, fullScreen && styles.fullScreen]}>
            <ActivityIndicator size={size} color={colors.primary} />
            {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.xl,
    },
    fullScreen: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    message: {
        // Web: --text-muted zinc-500
        color: colors.textMuted,
        fontSize: typography.fontSizeSM,
        marginTop: spacing.md,
        textAlign: "center",
        letterSpacing: 0.2,
    },
});
