import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    StatusBar,
    Alert,
    Linking,
    Modal,
    TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { changePreference, clearPreferences, playHapticFeedback, readPreferences } from "../../utils/preferences";
import { clearRoundProgress } from "../../utils/multiRoundProgress";
import { cache } from "../../utils/cache";
import { userApi } from "../../api/userApi";
import { Button } from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/Card";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";

function SettingRow({ emoji, label, value, onPress, rightElement }) {
    return (
        <TouchableOpacity
            style={s.row}
            activeOpacity={onPress ? 0.7 : 1}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={s.rowLeft}>
                <Text style={s.rowEmoji}>{emoji}</Text>
                <Text style={s.rowLabel}>{label}</Text>
            </View>
            {rightElement || (
                <View style={s.rowRight}>
                    {value ? <Text style={s.rowValue}>{value}</Text> : null}
                    {onPress ? <Text style={s.rowArrow}>→</Text> : null}
                </View>
            )}
        </TouchableOpacity>
    );
}

function SettingToggle({ emoji, label, value, onValueChange, disabled }) {
    return (
        <View style={s.row}>
            <View style={s.rowLeft}>
                <Text style={s.rowEmoji}>{emoji}</Text>
                <Text style={s.rowLabel}>{label}</Text>
            </View>
            <Switch
                disabled={disabled}
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: colors.border, true: "#7c3aed" }}
                thumbColor={value ? "#a78bfa" : colors.textMuted}
            />
        </View>
    );
}

function SectionHeader({ title }) {
    return <Text style={s.sectionHeader}>{title}</Text>;
}

export default function SettingsScreen({ navigation }) {
    const { user, logout } = useAuth();
    const insets = useSafeAreaInsets();
    const userId = user?.id;
    const [preferences, setPreferences] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [deleteVisible, setDeleteVisible] = useState(false);
    const [confirmation, setConfirmation] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        let active = true;
        setPreferences(null);
        readPreferences(userId)
            .then(value => { if (active) setPreferences(value); })
            .catch(() => { if (active) Alert.alert("Could not load preferences"); });
        return () => { active = false; };
    }, [userId]);

    async function updatePreference(name, value) {
        if (updating || !userId) return;
        setUpdating(true);
        try {
            const next = await changePreference(userId, name, value);
            setPreferences(next);
            if (next.hapticFeedback) {
                playHapticFeedback(userId).catch(() => {});
            }
        } catch (error) {
            Alert.alert("Preference unavailable", error.message || "Try again.");
        } finally {
            setUpdating(false);
        }
    }

    const appVersion = Constants.expoConfig?.version || "1.0.0";
    const tier = user?.subscriptionTier || user?.subscription_tier || "free";

    function confirmLogout() {
        Alert.alert("Sign Out", "Are you sure you want to sign out?", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign Out", style: "destructive", onPress: logout },
        ]);
    }

    function confirmDeleteAccount() {
        setConfirmation("");
        setDeleteError("");
        setDeleteVisible(true);
    }

    async function deleteAccount() {
        if (deleting || confirmation.trim() !== "DELETE") return;
        setDeleting(true);
        setDeleteError("");
        try {
            await userApi.deleteAccount(confirmation.trim());
            setDeleteVisible(false);
            await Promise.allSettled([
                cache.clear(),
                clearPreferences(userId),
                clearRoundProgress(userId),
            ]);
            await logout();
        } catch (error) {
            setDeleteError(error.response?.data?.error || error.message || "Could not delete your account.");
        } finally {
            setDeleting(false);
        }
    }

    const Div = () => <View style={s.divider} />;

    return (
        <View style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
            <View
                style={[
                    s.header,
                    {
                        paddingTop: Math.max(
                            insets.top + spacing.sm,
                            spacing.lg,
                        ),
                    },
                ]}
            >
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={s.backBtn}
                >
                    <Text style={s.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={s.headerTitle}>Settings</Text>
                <View style={s.backBtn} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.scrollContent}
            >
                <SectionHeader title="ACCOUNT" />
                <Card style={s.card}>
                    <SettingRow
                        emoji="👤"
                        label="Edit Profile"
                        onPress={() => navigation.navigate("EditProfile")}
                    />
                    <Div />
                    <SettingRow
                        emoji="📧"
                        label="Email"
                        value={user?.email || "—"}
                    />
                    <Div />
                    <SettingRow
                        emoji="⭐"
                        label="Subscription"
                        value={tier.charAt(0).toUpperCase() + tier.slice(1)}
                    />
                    <Div />
                    <SettingRow
                        emoji="🪙"
                        label="Coin Wallet"
                        onPress={() => navigation.navigate("CoinWallet")}
                    />
                </Card>

                <SectionHeader title="NOTIFICATIONS" />
                <Card style={s.card}>
                    <SettingToggle
                        emoji="🔥"
                        label="Streak Reminders"
                        value={Boolean(preferences?.streakReminders)}
                        disabled={!preferences || updating || !userId}
                        onValueChange={value => updatePreference("streakReminders", value)}
                    />
                    <Div />
                    <SettingToggle
                        emoji="⚡"
                        label="Daily Challenge"
                        value={Boolean(preferences?.dailyChallenge)}
                        disabled={!preferences || updating || !userId}
                        onValueChange={value => updatePreference("dailyChallenge", value)}
                    />
                    <Div />
                    <SettingToggle
                        emoji="📊"
                        label="Interview Results"
                        value={Boolean(preferences?.interviewResults)}
                        disabled={!preferences || updating || !userId}
                        onValueChange={value => updatePreference("interviewResults", value)}
                    />
                </Card>

                <SectionHeader title="PREFERENCES" />
                <Card style={s.card}>
                    <SettingToggle
                        emoji="🔊"
                        label="Notification Sound"
                        value={Boolean(preferences?.notificationSound)}
                        disabled={!preferences || updating || !userId}
                        onValueChange={value => updatePreference("notificationSound", value)}
                    />
                    <Div />
                    <SettingToggle
                        emoji="📳"
                        label="Haptic Feedback"
                        value={Boolean(preferences?.hapticFeedback)}
                        disabled={!preferences || updating || !userId}
                        onValueChange={value => updatePreference("hapticFeedback", value)}
                    />
                </Card>

                <SectionHeader title="SUPPORT" />
                <Card style={s.card}>
                    <SettingRow
                        emoji="❓"
                        label="Help Center"
                        onPress={() =>
                            Linking.openURL("https://preploop.com/help").catch(
                                () =>
                                    Alert.alert(
                                        "Cannot open link",
                                        "Please check your browser settings.",
                                    ),
                            )
                        }
                    />
                    <Div />
                    <SettingRow
                        emoji="📬"
                        label="Contact Support"
                        onPress={() =>
                            Linking.openURL(
                                "mailto:support@preploop.com",
                            ).catch(() =>
                                Alert.alert(
                                    "Cannot open link",
                                    "Please check your browser settings.",
                                ),
                            )
                        }
                    />
                    <Div />
                    <SettingRow
                        emoji="📄"
                        label="Privacy Policy"
                        onPress={() =>
                            Linking.openURL(
                                "https://preploop.com/privacy",
                            ).catch(() =>
                                Alert.alert(
                                    "Cannot open link",
                                    "Please check your browser settings.",
                                ),
                            )
                        }
                    />
                    <Div />
                    <SettingRow
                        emoji="📜"
                        label="Terms of Service"
                        onPress={() =>
                            Linking.openURL("https://preploop.com/terms").catch(
                                () =>
                                    Alert.alert(
                                        "Cannot open link",
                                        "Please check your browser settings.",
                                    ),
                            )
                        }
                    />
                </Card>

                <SectionHeader title="DANGER ZONE" />
                <Card style={[s.card, s.dangerCard]}>
                    <TouchableOpacity
                        style={s.dangerRow}
                        onPress={confirmDeleteAccount}
                    >
                        <Text style={s.dangerEmoji}>⚠️</Text>
                        <Text style={s.dangerLabel}>Delete Account</Text>
                    </TouchableOpacity>
                </Card>

                <TouchableOpacity
                    style={s.signOutBtn}
                    onPress={confirmLogout}
                    activeOpacity={0.8}
                >
                    <Text style={s.signOutText}>Sign Out</Text>
                </TouchableOpacity>

                <View style={s.versionBox}>
                    <Text style={s.versionText}>PrepLoop v{appVersion}</Text>
                    <Text style={s.versionSub}>Made with 💜 for engineers</Text>
                </View>
            </ScrollView>
            <Modal visible={deleteVisible} transparent animationType="fade" onRequestClose={() => { if (!deleting) setDeleteVisible(false); }}>
                <View style={s.modalBackdrop}>
                    <Card style={s.deleteDialog}>
                        <Text style={s.headerTitle}>Delete account</Text>
                        <Text style={s.rowLabel}>This permanently deletes your account and its data. Type DELETE to confirm.</Text>
                        <TextInput
                            accessibilityLabel="Type DELETE to confirm"
                            style={s.confirmInput}
                            value={confirmation}
                            onChangeText={setConfirmation}
                            editable={!deleting}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            maxLength={10}
                        />
                        {deleteError ? <Text accessibilityRole="alert" style={s.dangerLabel}>{deleteError}</Text> : null}
                        <Button title="Delete account" onPress={deleteAccount} loading={deleting} disabled={!userId || deleting || confirmation.trim() !== "DELETE"} />
                        <Button title="Cancel" variant="outline" onPress={() => { setDeleteError(""); setDeleteVisible(false); }} disabled={deleting} />
                    </Card>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        backgroundColor: colors.bgCardAlt,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: { width: 40, height: 40, justifyContent: "center" },
    backArrow: {
        color: colors.textPrimary,
        fontSize: 22,
        fontWeight: typography.fontWeightBold,
    },
    headerTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightBold,
    },
    scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
    sectionHeader: {
        color: colors.textMuted,
        fontSize: typography.fontSizeXS,
        fontWeight: typography.fontWeightBold,
        letterSpacing: 1.2,
        marginTop: spacing.xl,
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
    },
    card: { padding: 0, overflow: "hidden" },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: spacing.md,
    },
    rowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
    rowEmoji: { fontSize: 18, marginRight: spacing.md, width: 24 },
    rowLabel: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightMedium,
    },
    rowRight: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    rowValue: { color: colors.textMuted, fontSize: typography.fontSizeSM },
    rowArrow: { color: colors.textMuted, fontSize: 16 },
    divider: {
        height: 1,
        backgroundColor: "rgba(255,255,255,0.06)",
        marginHorizontal: spacing.md,
    },
    modalBackdrop: { flex: 1, justifyContent: "center", padding: spacing.lg, backgroundColor: "rgba(0,0,0,0.65)" },
    deleteDialog: { gap: spacing.md },
    confirmInput: { color: colors.textPrimary, borderColor: colors.border, borderWidth: 1, borderRadius: borderRadius.md, padding: spacing.md },
    dangerCard: { borderColor: "rgba(239,68,68,0.25)" },
    dangerRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: spacing.md,
    },
    dangerEmoji: { fontSize: 18, marginRight: spacing.md },
    dangerLabel: {
        color: colors.error,
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightMedium,
    },
    signOutBtn: {
        marginTop: spacing.xl,
        backgroundColor: "rgba(239,68,68,0.1)",
        borderWidth: 1,
        borderColor: "rgba(239,68,68,0.3)",
        borderRadius: borderRadius.lg,
        paddingVertical: 14,
        alignItems: "center",
    },
    signOutText: {
        color: colors.error,
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightBold,
    },
    versionBox: {
        alignItems: "center",
        marginTop: spacing.xl,
        paddingBottom: spacing.lg,
    },
    versionText: { color: colors.textMuted, fontSize: typography.fontSizeXS },
    versionSub: {
        color: colors.textMuted,
        fontSize: 10,
        marginTop: 4,
        opacity: 0.6,
    },
});
