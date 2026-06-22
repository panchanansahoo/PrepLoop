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
import { API_BASE_URL } from "../../api/apiClient";

const BRAND_FEATURES = [
    { icon: "🎙️", text: "AI Mock Interviews with real-time feedback" },
    { icon: "🧩", text: "DSA Patterns & 500+ Practice Problems" },
    { icon: "🏗️", text: "System Design with interactive diagrams" },
    { icon: "📄", text: "AI Resume Analyzer & Job Matching" },
];

export default function LoginScreen({ navigation }) {
    const { login } = useAuth();
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [focusedField, setFocusedField] = useState(null);

    async function handleLogin() {
        if (!email.trim() || !password.trim()) {
            setError("Please enter your email and password.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            await login(email.trim().toLowerCase(), password);
        } catch (err) {
            const data = err?.response?.data || {};
            if (data.code === "EMAIL_NOT_VERIFIED") {
                setError(
                    "Please verify your email before logging in. Check your inbox for a verification link.",
                );
            } else if (data.code === "ACCOUNT_LOCKED") {
                setError(
                    data.error ||
                        "Account temporarily locked. Please try again later.",
                );
            } else if (err?.message === "Network Error" || !err?.response) {
                setError(
                    `Cannot connect to PrepLoop API (${API_BASE_URL}). ` +
                        "If you are using an Android emulator, start the backend on your computer at port 5000. " +
                        "If you are using a physical phone, set EXPO_PUBLIC_API_URL to your computer's LAN IP or a live backend URL and rebuild the APK.",
                );
            } else {
                setError(
                    data.message ||
                        data.error ||
                        err?.message ||
                        "Login failed. Please check your credentials.",
                );
            }
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
                {/* Orbs — matching web login exactly */}
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
                    {/* Back button — web glass style */}
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backBtn}
                    >
                        <Text style={styles.backBtnText}>← Back</Text>
                    </TouchableOpacity>

                    {/* Brand / left-panel equivalent */}
                    <View style={styles.brandSection}>
                        <View style={styles.logoRow}>
                            <LinearGradient
                                colors={["#7c3aed", "#6366f1"]}
                                style={styles.logoCircle}
                            >
                                <Text style={styles.logoLetter}>P</Text>
                            </LinearGradient>
                            <Text style={styles.brandName}>PrepLoop</Text>
                        </View>
                        <Text style={styles.brandTagline}>
                            Your AI-powered interview coach
                        </Text>
                        <View style={styles.featuresList}>
                            {BRAND_FEATURES.map((f, i) => (
                                <View key={i} style={styles.featureItem}>
                                    <Text style={styles.featureIcon}>
                                        {f.icon}
                                    </Text>
                                    <Text style={styles.featureText}>
                                        {f.text}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Glassmorphic form card — web: rgba(20,20,28,0.4) + rgba(255,255,255,0.08) border */}
                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>Welcome back</Text>
                        <Text style={styles.formSubtitle}>
                            Sign in to your account
                        </Text>

                        {!!error && (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Email address</Text>
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
                                autoCorrect={false}
                                returnKeyType="next"
                            />
                        </View>

                        <View style={styles.fieldGroup}>
                            <View style={styles.labelRow}>
                                <Text style={styles.fieldLabel}>Password</Text>
                                <TouchableOpacity
                                    onPress={() =>
                                        navigation.navigate("ForgotPassword")
                                    }
                                >
                                    <Text style={styles.forgotLink}>
                                        Forgot password?
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View
                                style={[
                                    styles.inputWrap,
                                    focusedField === "password" &&
                                        styles.inputFocused,
                                ]}
                            >
                                <TextInput
                                    style={styles.inputInner}
                                    placeholder="••••••••••••"
                                    placeholderTextColor={colors.textMuted}
                                    value={password}
                                    onChangeText={setPassword}
                                    onFocus={() => setFocusedField("password")}
                                    onBlur={() => setFocusedField(null)}
                                    secureTextEntry={!showPassword}
                                    returnKeyType="done"
                                    onSubmitEditing={handleLogin}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword((v) => !v)}
                                    style={styles.eyeBtn}
                                >
                                    <Text style={styles.eyeIcon}>
                                        {showPassword ? "🙈" : "👁️"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <Button
                            title="Sign In"
                            onPress={handleLogin}
                            loading={loading}
                            fullWidth
                            style={styles.submitBtn}
                        />

                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <TouchableOpacity
                            onPress={() => navigation.navigate("Signup")}
                            style={styles.switchRow}
                        >
                            <Text style={styles.switchText}>
                                Don't have an account?{" "}
                            </Text>
                            <Text style={styles.switchLink}>
                                Sign up for free
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.securityNote}>
                        🔒 256-bit SSL encryption · Your data is safe
                    </Text>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1, backgroundColor: colors.bg },

    // Orbs — exact web login colors
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
        top: "38%",
        right: "15%",
        width: 180,
        height: 180,
        borderRadius: 90,
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

    brandSection: { marginBottom: spacing.xl },
    logoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.xs,
    },
    logoCircle: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginRight: spacing.sm,
        shadowColor: "#7c3aed",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
    },
    logoLetter: {
        color: "#fff",
        fontSize: 20,
        fontWeight: typography.fontWeightExtraBold,
    },
    brandName: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeXL,
        fontWeight: typography.fontWeightExtraBold,
    },
    brandTagline: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        marginBottom: spacing.md,
    },
    featuresList: { gap: spacing.xs },
    featureItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        paddingVertical: 3,
    },
    featureIcon: { fontSize: 16, width: 22 },
    featureText: {
        color: "rgba(255,255,255,0.6)",
        fontSize: typography.fontSizeSM,
        flex: 1,
    },

    // Glassmorphic card
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
    labelRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.xs,
    },
    forgotLink: {
        color: "#818cf8",
        fontSize: typography.fontSizeXS,
        fontWeight: typography.fontWeightMedium,
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

    submitBtn: { marginBottom: spacing.md },

    dividerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: spacing.sm,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "rgba(255,255,255,0.08)",
    },
    dividerText: {
        color: colors.textMuted,
        fontSize: typography.fontSizeXS,
        marginHorizontal: spacing.sm,
    },

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

    securityNote: {
        color: colors.textMuted,
        fontSize: typography.fontSizeXS,
        textAlign: "center",
        marginTop: spacing.lg,
    },
});
