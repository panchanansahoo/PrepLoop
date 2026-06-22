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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/Card";
import { notifications } from "../../utils/notifications";
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

function SettingToggle({ emoji, label, value, onValueChange }) {
    return (
        <View style={s.row}>
            <View style={s.rowLeft}>
                <Text style={s.rowEmoji}>{emoji}</Text>
                <Text style={s.rowLabel}>{label}</Text>
            </View>
            <Switch
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
    const [streakReminders, setStreakReminders] = useState(true);
    const [dailyChallenge, setDailyChallenge] = useState(true);
    const [interviewResults, setInterviewResults] = useState(true);
    const [soundEffects, setSoundEffects] = useState(false);
    const [hapticFeedback, setHapticFeedback] = useState(true);

    // Load persisted notification/preference toggles on mount
    useEffect(() => {
        async function loadPrefs() {
            try {
                const keys = [
                    "pref_streakReminders",
                    "pref_dailyChallenge",
                    "pref_interviewResults",
                    "pref_soundEffects",
                    "pref_hapticFeedback",
                ];
                const pairs = await AsyncStorage.multiGet(keys);
                pairs.forEach(([key, value]) => {
                    if (value === null) return; // never saved — keep default
                    const bool = value === "true";
                    if (key === "pref_streakReminders")
                        setStreakReminders(bool);
                    else if (key === "pref_dailyChallenge")
                        setDailyChallenge(bool);
                    else if (key === "pref_interviewResults")
                        setInterviewResults(bool);
                    else if (key === "pref_soundEffects") setSoundEffects(bool);
                    else if (key === "pref_hapticFeedback")
                        setHapticFeedback(bool);
                });
            } catch (e) {
                console.warn("Failed to load preferences:", e);
            }
        }
        loadPrefs();
    }, []);

    const appVersion = Constants.expoConfig?.version || "1.0.0";
    const tier = user?.subscriptionTier || user?.subscription_tier || "free";

    function confirmLogout() {
        Alert.alert("Sign Out", "Are you sure you want to sign out?", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign Out", style: "destructive", onPress: logout },
        ]);
    }

    function confirmDeleteAccount() {
        Alert.alert(
            "Delete Account",
            "This is irreversible. All data will be permanently deleted.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () =>
                        Alert.alert(
                            "Not Available",
                            "Account deletion requires email verification. Contact support@preploop.com.",
                        ),
                },
            ],
        );
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
                        value={streakReminders}
                        onValueChange={(val) => {
                            setStreakReminders(val);
                            AsyncStorage.setItem(
                                "pref_streakReminders",
                                String(val),
                            ).catch(() => {});
                            try {
                                if (val) {
                                    notifications.scheduleDailyReminder(20, 0);
                                } else {
                                    notifications.cancelByTag(
                                        "streak_reminder",
                                    );
                                }
                            } catch {
                                console.log("Notification preference saved");
                            }
                        }}
                    />
                    <Div />
                    <SettingToggle
                        emoji="⚡"
                        label="Daily Challenge"
                        value={dailyChallenge}
                        onValueChange={(val) => {
                            setDailyChallenge(val);
                            AsyncStorage.setItem(
                                "pref_dailyChallenge",
                                String(val),
                            ).catch(() => {});
                        }}
                    />
                    <Div />
                    <SettingToggle
                        emoji="📊"
                        label="Interview Results"
                        value={interviewResults}
                        onValueChange={(val) => {
                            setInterviewResults(val);
                            AsyncStorage.setItem(
                                "pref_interviewResults",
                                String(val),
                            ).catch(() => {});
                        }}
                    />
                </Card>

                <SectionHeader title="PREFERENCES" />
                <Card style={s.card}>
                    <SettingToggle
                        emoji="🔊"
                        label="Sound Effects"
                        value={soundEffects}
                        onValueChange={(val) => {
                            setSoundEffects(val);
                            AsyncStorage.setItem(
                                "pref_soundEffects",
                                String(val),
                            ).catch(() => {});
                        }}
                    />
                    <Div />
                    <SettingToggle
                        emoji="📳"
                        label="Haptic Feedback"
                        value={hapticFeedback}
                        onValueChange={(val) => {
                            setHapticFeedback(val);
                            AsyncStorage.setItem(
                                "pref_hapticFeedback",
                                String(val),
                            ).catch(() => {});
                        }}
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
