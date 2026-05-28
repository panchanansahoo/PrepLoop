/**
 * ScreenHeader — reusable header with safe-area insets.
 * Matches web's dark near-black header bar style.
 */
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius } from "../utils/theme";

export function ScreenHeader({
    title,
    subtitle,
    onBack,
    right,
    style,
    noBorder = false,
}) {
    const insets = useSafeAreaInsets();

    return (
        <View
            style={[
                styles.container,
                { paddingTop: Math.max(insets.top + spacing.sm, spacing.lg) },
                noBorder && styles.noBorder,
                style,
            ]}
        >
            <View style={styles.row}>
                {onBack && (
                    <TouchableOpacity
                        onPress={onBack}
                        style={styles.backBtn}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                )}
                <View style={styles.titleWrap}>
                    <Text style={styles.title} numberOfLines={1}>
                        {title}
                    </Text>
                    {subtitle ? (
                        <Text style={styles.subtitle} numberOfLines={1}>
                            {subtitle}
                        </Text>
                    ) : null}
                </View>
                {right ? <View style={styles.rightWrap}>{right}</View> : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.bgCardAlt,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    noBorder: { borderBottomWidth: 0 },
    row: { flexDirection: "row", alignItems: "center" },
    backBtn: { marginRight: spacing.md, padding: spacing.xs },
    backIcon: {
        // Web: rgba(203,213,225,0.8)
        color: "rgba(203,213,225,0.8)",
        fontSize: typography.fontSizeXL,
        fontWeight: typography.fontWeightBold,
    },
    titleWrap: { flex: 1 },
    title: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightBold,
        letterSpacing: -0.2,
    },
    subtitle: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        marginTop: 2,
    },
    rightWrap: { marginLeft: spacing.sm },
});
