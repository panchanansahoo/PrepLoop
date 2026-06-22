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
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/Button";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";

function PasswordStrength({ password }) {
    if (!password) return null;
    const checks = [
        password.length >= 12,
        /[A-Z]/.test(password),
        /[a-z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ];
    const score = checks.filter(Boolean).length;
    const levels = [
        { label: "Very Weak", color: "#ef4444" },
        { label: "Weak", color: "#f97316" },
        { label: "Fair", color: "#f59e0b" },
        { label: "Good", color: "#22c55e" },
        { label: "Strong", color: "#10b981" },
    ];
    const { label, color } = levels[Math.max(0, score - 1)];
    return (
        <View style={pw.container}>
            <View style={pw.bars}>
                {[0, 1, 2, 3, 4].map((i) => (
                    <View
                        key={i}
                        style={[
                            pw.bar,
                            {
                                backgroundColor:
                                    i < score ? color : "rgba(255,255,255,0.1)",
                            },
                        ]}
                    />
                ))}
            </View>
            <Text style={[pw.label, { color }]}>{label}</Text>
        </View>
    );
}
const pw = StyleSheet.create({
    container: { flexDirection: "row", alignItems: "center", marginTop: 6 },
    bars: { flexDirection: "row", gap: 4, flex: 1 },
    bar: { flex: 1, height: 3, borderRadius: 2 },
    label: {
        fontSize: typography.fontSizeXS,
        fontWeight: typography.fontWeightBold,
        marginLeft: spacing.sm,
    },
});

export default function SignupScreen({ navigation }) {
    const { signup } = useAuth();
    const insets = useSafeAreaInsets();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [focusedField, setFocusedField] = useState(null);

    async function handleSignup() {
        setError("");
        if (
            !fullName.trim() ||
            !email.trim() ||
            !password ||
            !confirmPassword
        ) {
            setError("All fields are required.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 12) {
            setError("Password must be at least 12 characters.");
            return;
        }
        setLoading(true);
        try {
            await signup(email.trim().toLowerCase(), password, fullName.trim());
            setSuccess(
                "Account created! Check your email to verify your account before signing in.",
            );
        } catch (err) {
            const data = err?.response?.data || {};
            setError(
                data.message ||
                    data.error ||
                    err?.message ||
                    "Signup failed. Please try again.",
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
                <View style={styles.orb3} />

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
                        <Text style={styles.backBtnText}>← Back</Text>
                    </TouchableOpacity>

                    <View style={styles.heroRow}>
                        <LinearGradient
                            colors={["#7c3aed", "#6366f1"]}
                            style={styles.logoCircle}
                        >
                            <Text style={styles.logoLetter}>P</Text>
                        </LinearGradient>
                        <View>
                            <Text style={styles.brandName}>PrepLoop</Text>
                            <Text style={styles.brandSub}>
                                Join 15,000+ engineers
                            </Text>
                        </View>
                    </View>

                    {success ? (
                        <View style={styles.formCard}>
                            <Text style={styles.successIcon}>✅</Text>
                            <Text style={styles.successTitle}>
                                Check your email
                            </Text>
                            <Text style={styles.successText}>{success}</Text>
                            <Button
                                title="Sign In"
                                onPress={() => navigation.navigate("Login")}
                                fullWidth
                                style={{ marginTop: spacing.lg }}
                            />
                        </View>
                    ) : (
                        <View style={styles.formCard}>
                            <Text style={styles.formTitle}>Create account</Text>
                            <Text style={styles.formSubtitle}>
                                Start your interview prep journey
                            </Text>

                            {!!error && (
                                <View style={styles.errorBox}>
                                    <Text style={styles.errorText}>
                                        {error}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>Full Name</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        focusedField === "name" &&
                                            styles.inputFocused,
                                    ]}
                                    placeholder="John Doe"
                                    placeholderTextColor={colors.textMuted}
                                    value={fullName}
                                    onChangeText={setFullName}
                                    onFocus={() => setFocusedField("name")}
                                    onBlur={() => setFocusedField(null)}
                                    autoCapitalize="words"
                                />
                            </View>

                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>Email</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        focusedField === "email" &&
                                            styles.inputFocused,
                                    ]}
                                    placeholder="you@example.com"
                                    placeholderTextColor={colors.textMuted}
                                    value={email}
                                    onChangeText={setEmail}
                                    onFocus={() => setFocusedField("email")}
                                    onBlur={() => setFocusedField(null)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>Password</Text>
                                <View
                                    style={[
                                        styles.inputWrap,
                                        focusedField === "password" &&
                                            styles.inputFocused,
                                    ]}
                                >
                                    <TextInput
                                        style={styles.inputInner}
                                        placeholder="Min. 12 characters"
                                        placeholderTextColor={colors.textMuted}
                                        value={password}
                                        onChangeText={setPassword}
                                        onFocus={() =>
                                            setFocusedField("password")
                                        }
                                        onBlur={() => setFocusedField(null)}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity
                                        onPress={() =>
                                            setShowPassword((v) => !v)
                                        }
                                        style={styles.eyeBtn}
                                    >
                                        <Text style={styles.eyeIcon}>
                                            {showPassword ? "🙈" : "👁️"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <PasswordStrength password={password} />
                            </View>

                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>
                                    Confirm Password
                                </Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        focusedField === "confirm" &&
                                            styles.inputFocused,
                                        confirmPassword &&
                                            confirmPassword !== password && {
                                                borderColor:
                                                    "rgba(239,68,68,0.5)",
                                            },
                                    ]}
                                    placeholder="Re-enter password"
                                    placeholderTextColor={colors.textMuted}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    onFocus={() => setFocusedField("confirm")}
                                    onBlur={() => setFocusedField(null)}
                                    secureTextEntry
                                    onSubmitEditing={handleSignup}
                                />
                            </View>

                            <Text style={styles.termsNote}>
                                By signing up you agree to our Terms of Service
                                and Privacy Policy.
                            </Text>

                            <Button
                                title="Create Account"
                                onPress={handleSignup}
                                loading={loading}
                                fullWidth
                                style={styles.submitBtn}
                            />

                            <TouchableOpacity
                                onPress={() => navigation.navigate("Login")}
                                style={styles.switchRow}
                            >
                                <Text style={styles.switchText}>
                                    Already have an account?{" "}
                                </Text>
                                <Text style={styles.switchLink}>Sign in</Text>
                            </TouchableOpacity>
                        </View>
                    )}
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
        width: 280,
        height: 280,
        borderRadius: 140,
        backgroundColor: colors.orbPurple,
    },
    orb2: {
        position: "absolute",
        bottom: -100,
        right: -50,
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: colors.orbPink,
    },
    orb3: {
        position: "absolute",
        top: "40%",
        right: "10%",
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: colors.orbViolet,
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
    heroRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    logoCircle: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    logoLetter: {
        color: "#fff",
        fontSize: 22,
        fontWeight: typography.fontWeightExtraBold,
    },
    brandName: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightExtraBold,
    },
    brandSub: { color: colors.textSecondary, fontSize: typography.fontSizeXS },
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
        fontSize: typography.fontSize2XL,
        fontWeight: typography.fontWeightExtraBold,
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
    inputWrap: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        borderRadius: borderRadius.lg,
    },
    inputInner: {
        flex: 1,
        color: colors.textPrimary,
        paddingVertical: 12,
        paddingHorizontal: spacing.md,
        fontSize: typography.fontSizeMD,
    },
    eyeBtn: { paddingHorizontal: spacing.sm },
    eyeIcon: { fontSize: 18 },
    termsNote: {
        color: colors.textMuted,
        fontSize: typography.fontSizeXS,
        textAlign: "center",
        marginBottom: spacing.md,
        lineHeight: 18,
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
    successIcon: {
        fontSize: 48,
        textAlign: "center",
        marginBottom: spacing.md,
    },
    successTitle: {
        color: "#10b981",
        fontSize: typography.fontSizeXL,
        fontWeight: typography.fontWeightBold,
        textAlign: "center",
        marginBottom: spacing.sm,
    },
    successText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeMD,
        textAlign: "center",
        lineHeight: 22,
    },
});
