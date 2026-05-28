/**
 * Button — matches the web app's button styles exactly.
 *
 * Web primary: linear-gradient(135deg, #7c3aed, #6366f1) with glow
 * Web outline: border rgba(255,255,255,0.12), color #fff
 * Web ghost: transparent, color zinc-400
 * Web danger: #ef4444
 */
import React from "react";
import {
    TouchableOpacity,
    Text,
    ActivityIndicator,
    StyleSheet,
    View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, borderRadius } from "../utils/theme";

export function Button({
    title,
    onPress,
    variant = "primary",
    size = "md",
    disabled = false,
    loading = false,
    fullWidth = false,
    leftIcon,
    style,
    textStyle,
}) {
    const isDisabled = disabled || loading;

    const sizeMap = {
        sm: {
            paddingVertical: spacing.xs,
            paddingHorizontal: spacing.md,
            radius: borderRadius.md,
            fontSize: typography.fontSizeSM,
        },
        md: {
            paddingVertical: 12,
            paddingHorizontal: spacing.lg,
            radius: borderRadius.lg,
            fontSize: typography.fontSizeMD,
        },
        lg: {
            paddingVertical: 15,
            paddingHorizontal: spacing.xl,
            radius: borderRadius.xl,
            fontSize: typography.fontSizeLG,
        },
    };

    const sz = sizeMap[size] || sizeMap.md;

    // ── Primary: violet → indigo gradient (matching web exactly) ──
    if (variant === "primary") {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={isDisabled}
                style={[fullWidth && styles.fullWidth, style]}
                activeOpacity={0.85}
            >
                <LinearGradient
                    colors={
                        isDisabled
                            ? ["#3a3a46", "#2a2a36"]
                            : colors.gradientPrimary
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                        styles.base,
                        {
                            paddingVertical: sz.paddingVertical,
                            paddingHorizontal: sz.paddingHorizontal,
                            borderRadius: sz.radius,
                        },
                        fullWidth && styles.fullWidth,
                        // Web: box-shadow: 0 4px 20px rgba(124,58,237,0.25)
                        !isDisabled && {
                            shadowColor: "#7c3aed",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 16,
                            elevation: 8,
                        },
                    ]}
                >
                    {loading ? (
                        <ActivityIndicator
                            color={colors.textPrimary}
                            size="small"
                        />
                    ) : (
                        <View style={styles.row}>
                            {leftIcon && (
                                <View style={styles.iconWrap}>{leftIcon}</View>
                            )}
                            <Text
                                style={[
                                    styles.textPrimary,
                                    { fontSize: sz.fontSize },
                                    textStyle,
                                ]}
                            >
                                {title}
                            </Text>
                        </View>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    // ── Non-primary variants ───────────────────────────────────────
    const variantMap = {
        secondary: {
            bg: colors.secondary,
            text: colors.textPrimary,
            border: "transparent",
            bw: 0,
        },
        // Web outline: border rgba(255,255,255,0.12), white text
        outline: {
            bg: "transparent",
            text: colors.textPrimary,
            border: colors.borderLight,
            bw: 1,
        },
        // Web ghost: transparent
        ghost: {
            bg: "transparent",
            text: colors.textSecondary,
            border: "transparent",
            bw: 0,
        },
        // Web danger: #ef4444
        danger: {
            bg: colors.error,
            text: colors.textPrimary,
            border: "transparent",
            bw: 0,
        },
    };

    const v = variantMap[variant] || {
        bg: colors.bgCard,
        text: colors.textPrimary,
        border: "transparent",
        bw: 0,
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.75}
            style={[
                styles.base,
                {
                    paddingVertical: sz.paddingVertical,
                    paddingHorizontal: sz.paddingHorizontal,
                    borderRadius: sz.radius,
                    backgroundColor: isDisabled ? colors.bgCard : v.bg,
                    borderColor: v.border,
                    borderWidth: v.bw,
                },
                fullWidth && styles.fullWidth,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={v.text} size="small" />
            ) : (
                <View style={styles.row}>
                    {leftIcon && (
                        <View style={styles.iconWrap}>{leftIcon}</View>
                    )}
                    <Text
                        style={[
                            styles.textBase,
                            {
                                fontSize: sz.fontSize,
                                color: isDisabled ? colors.textMuted : v.text,
                            },
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    base: {
        alignItems: "center",
        justifyContent: "center",
    },
    fullWidth: { width: "100%" },
    row: { flexDirection: "row", alignItems: "center" },
    iconWrap: { marginRight: spacing.xs },
    textPrimary: {
        color: colors.textPrimary,
        fontWeight: typography.fontWeightBold,
        letterSpacing: 0.2,
    },
    textBase: {
        fontWeight: typography.fontWeightSemiBold,
        letterSpacing: 0.2,
    },
});
