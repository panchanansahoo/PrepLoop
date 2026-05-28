import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authApi } from "../../api/authApi";
import { Button } from "../../components/Button";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";

export default function ForgotPasswordScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);
    const [focused, setFocused] = useState(false);

    async function handleSubmit() {
        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            await authApi.forgotPassword(email.trim().toLowerCase());
            setSent(true);
        } catch (err) {
            const data = err?.response?.data || {};
            setError(
                data.message ||
                    data.error ||
                    err?.message ||
                    "Request failed. Please try again.",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
            <View style={styles.container}>
                <View style={styles.orb1} />
                <View style={styles.orb2} />

                <ScrollView
                    contentContainerStyle={[
                        styles.scroll,
                        {
                            paddingTop: Math.max(
                                insets.top + spacing.md,
                                spacing.xl,
                            ),
                        },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backBtn}
                    >
                        <Text style={styles.backBtnText}>
                            ← Back to Sign In
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.heroSection}>
                        <LinearGradient
                            colors={["#7c3aed", "#6366f1"]}
                            style={styles.keyIcon}
                        >
                            <Text style={styles.keyIconText}>🔑</Text>
                        </LinearGradient>
                        <Text style={styles.heroTitle}>
                            Reset your password
                        </Text>
                        <Text style={styles.heroSubtitle}>
                            Enter your email and we'll send you a secure reset
                            link.
                        </Text>
                    </View>

                    <View style={styles.formCard}>
                        {sent ? (
                            <View style={styles.sentSection}>
                                <Text style={styles.sentIcon}>📬</Text>
                                <Text style={styles.sentTitle}>
                                    Email sent!
                                </Text>
                                <Text style={styles.sentText}>
                                    Check your inbox for a password reset link.
                                    It may take a few minutes to arrive.
                                </Text>
                                <Button
                                    title="Back to Sign In"
                                    onPress={() => navigation.navigate("Login")}
                                    fullWidth
                                    style={{ marginTop: spacing.lg }}
                                />
                            </View>
                        ) : (
                            <>
                                <Text style={styles.formTitle}>
                                    Forgot password?
                                </Text>
                                <Text style={styles.formSubtitle}>
                                    No worries — we'll send you reset
                                    instructions.
                                </Text>

                                {!!error && (
                                    <View style={styles.errorBox}>
                                        <Text style={styles.errorText}>
                                            {error}
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.fieldGroup}>
                                    <Text style={styles.fieldLabel}>
                                        Email address
                                    </Text>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            focused && styles.inputFocused,
                                        ]}
                                        placeholder="you@example.com"
                                        placeholderTextColor={colors.textMuted}
                                        value={email}
                                        onChangeText={setEmail}
                                        onFocus={() => setFocused(true)}
                                        onBlur={() => setFocused(false)}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        returnKeyType="done"
                                        onSubmitEditing={handleSubmit}
                                    />
                                </View>

                                <Button
                                    title="Send Reset Link"
                                    onPress={handleSubmit}
                                    loading={loading}
                                    fullWidth
                                    style={styles.submitBtn}
                                />

                                <TouchableOpacity
                                    onPress={() => navigation.navigate("Login")}
                                    style={styles.switchRow}
                                >
                                    <Text style={styles.switchText}>
                                        Remembered it?{" "}
                                    </Text>
                                    <Text style={styles.switchLink}>
                                        Sign in
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1, backgroundColor: colors.bg },
    orb1: {
        position: "absolute",
        top: -80,
        left: -60,
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: colors.orbPurple,
    },
    orb2: {
        position: "absolute",
        bottom: -80,
        right: -50,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: colors.orbPink,
    },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    backBtn: {
        alignSelf: "flex-start",
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.lg,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        marginBottom: spacing.xl,
    },
    backBtnText: {
        color: "rgba(203,213,225,0.8)",
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightSemiBold,
    },
    heroSection: { alignItems: "center", marginBottom: spacing.xl },
    keyIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.md,
        shadowColor: "#7c3aed",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
    },
    keyIconText: { fontSize: 30 },
    heroTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSize2XL,
        fontWeight: typography.fontWeightExtraBold,
        textAlign: "center",
        marginBottom: spacing.xs,
        letterSpacing: -0.3,
    },
    heroSubtitle: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeMD,
        textAlign: "center",
        lineHeight: 22,
        paddingHorizontal: spacing.sm,
    },
    formCard: {
        backgroundColor: "rgba(20,20,28,0.65)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        borderRadius: borderRadius.xxl,
        padding: spacing.xl,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.45,
        shadowRadius: 40,
        elevation: 10,
    },
    formTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeXL,
        fontWeight: typography.fontWeightBold,
        marginBottom: 4,
        letterSpacing: -0.3,
    },
    formSubtitle: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeMD,
        marginBottom: spacing.lg,
    },
    errorBox: {
        backgroundColor: "rgba(239,68,68,0.1)",
        borderColor: "rgba(239,68,68,0.3)",
        borderWidth: 1,
        borderRadius: borderRadius.lg,
        padding: spacing.sm,
        marginBottom: spacing.md,
    },
    errorText: {
        color: "#fca5a5",
        fontSize: typography.fontSizeSM,
        textAlign: "center",
    },
    fieldGroup: { marginBottom: spacing.md },
    fieldLabel: {
        color: "rgba(255,255,255,0.5)",
        fontSize: typography.fontSizeXS,
        fontWeight: typography.fontWeightSemiBold,
        marginBottom: spacing.xs,
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    input: {
        backgroundColor: "rgba(255,255,255,0.05)",
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        borderRadius: borderRadius.lg,
        paddingVertical: 12,
        paddingHorizontal: spacing.md,
        fontSize: typography.fontSizeMD,
    },
    inputFocused: {
        borderColor: colors.primary,
        backgroundColor: "rgba(99,102,241,0.06)",
    },
    submitBtn: { marginBottom: spacing.md },
    switchRow: {
        flexDirection: "row",
        justifyContent: "center",
        paddingTop: spacing.xs,
    },
    switchText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeMD,
    },
    switchLink: {
        color: "#818cf8",
        fontWeight: typography.fontWeightSemiBold,
        fontSize: typography.fontSizeMD,
    },
    sentSection: { alignItems: "center" },
    sentIcon: { fontSize: 48, marginBottom: spacing.md },
    sentTitle: {
        color: "#10b981",
        fontSize: typography.fontSizeXL,
        fontWeight: typography.fontWeightBold,
        marginBottom: spacing.sm,
    },
    sentText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeMD,
        textAlign: "center",
        lineHeight: 22,
    },
});
