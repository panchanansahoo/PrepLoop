import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    StatusBar,
    Alert,
    RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../context/AuthContext";
import { userApi } from "../../api/userApi";
import { coinsApi } from "../../api/coinsApi";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"];
const TIER_COLORS = {
    free: colors.textMuted,
    pro: colors.secondary,
    premium: colors.warning,
};
const TIER_LABELS = {
    free: "🆓 Free",
    pro: "⭐ Pro",
    premium: "👑 Premium",
};

function Avatar({ name, size = 72 }) {
    const initials = (name || "?")
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    return (
        <LinearGradient
            colors={colors.gradientPrimary}
            style={[
                avatarStyles.circle,
                { width: size, height: size, borderRadius: size / 2 },
            ]}
        >
            <Text style={[avatarStyles.text, { fontSize: size * 0.38 }]}>
                {initials}
            </Text>
        </LinearGradient>
    );
}
const avatarStyles = StyleSheet.create({
    circle: { alignItems: "center", justifyContent: "center" },
    text: {
        color: colors.textPrimary,
        fontWeight: typography.fontWeightExtraBold,
    },
});

export default function ProfileScreen({ navigation }) {
    const { user, logout } = useAuth();
    const insets = useSafeAreaInsets();
    const [profile, setProfile] = useState(null);
    const [coins, setCoins] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [fullName, setFullName] = useState("");
    const [experienceLevel, setExperienceLevel] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function loadProfile() {
        try {
            const [profileData, coinsData] = await Promise.allSettled([
                userApi.getProfile(),
                coinsApi.getBalance(),
            ]);
            if (profileData.status === "fulfilled") {
                const p = profileData.value;
                setProfile(p);
                setFullName(p.full_name || p.fullName || "");
                setExperienceLevel(
                    p.experience_level || p.experienceLevel || "beginner",
                );
            }
            if (coinsData.status === "fulfilled")
                setCoins(
                    coinsData.value?.balance ?? coinsData.value?.coins ?? null,
                );
        } catch {
            // fallback to cached user
            if (user) {
                setFullName(user.fullName || user.full_name || "");
                setExperienceLevel(
                    user.experienceLevel || user.experience_level || "beginner",
                );
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        loadProfile();
    }, []);

    async function handleSave() {
        setSaving(true);
        setError("");
        try {
            await userApi.updateProfile({ fullName, experienceLevel });
            setProfile((prev) => ({
                ...prev,
                full_name: fullName,
                experience_level: experienceLevel,
            }));
            setEditMode(false);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to save changes.");
        } finally {
            setSaving(false);
        }
    }

    function confirmLogout() {
        Alert.alert("Sign Out", "Are you sure you want to sign out?", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign Out", style: "destructive", onPress: logout },
        ]);
    }

    if (loading && !refreshing)
        return <LoadingSpinner fullScreen message="Loading profile..." />;

    const displayName =
        profile?.full_name ||
        profile?.fullName ||
        user?.fullName ||
        user?.full_name ||
        "User";
    const displayEmail = profile?.email || user?.email || "";
    const tier =
        profile?.subscription_tier ||
        profile?.subscriptionTier ||
        user?.subscriptionTier ||
        "free";
    const expLevel =
        profile?.experience_level ||
        profile?.experienceLevel ||
        user?.experienceLevel ||
        "beginner";

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            loadProfile();
                        }}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                {/* Hero */}
                <LinearGradient
                    colors={["#0a0a0e", "#070709"]}
                    style={[
                        styles.hero,
                        {
                            paddingTop: Math.max(
                                insets.top + spacing.md,
                                spacing.xl,
                            ),
                        },
                    ]}
                >
                    <Avatar name={displayName} size={80} />
                    <Text style={styles.heroName}>{displayName}</Text>
                    <Text style={styles.heroEmail}>{displayEmail}</Text>
                    <View style={styles.tierBadge}>
                        <Text
                            style={[
                                styles.tierText,
                                {
                                    color:
                                        TIER_COLORS[tier] || colors.textMuted,
                                },
                            ]}
                        >
                            {TIER_LABELS[tier] || tier}
                        </Text>
                    </View>
                </LinearGradient>

                <View style={styles.body}>
                    {/* Coins */}
                    <TouchableOpacity
                        onPress={() => navigation.navigate("CoinWallet")}
                        activeOpacity={0.8}
                    >
                        <Card accent={colors.warning} style={styles.coinsCard}>
                            <View style={styles.coinsRow}>
                                <Text style={styles.coinsLabel}>
                                    🪙 Coin Balance
                                </Text>
                                <Text style={styles.coinsValue}>
                                    {coins ?? "—"}
                                </Text>
                            </View>
                            <Text style={styles.coinsSub}>
                                Tap to view history →
                            </Text>
                        </Card>
                    </TouchableOpacity>

                    {/* Edit Profile */}
                    <Card elevated style={styles.editCard}>
                        <View style={styles.editHeader}>
                            <Text style={styles.sectionTitle}>
                                Profile Info
                            </Text>
                            {!editMode ? (
                                <TouchableOpacity
                                    onPress={() => setEditMode(true)}
                                >
                                    <Text style={styles.editLink}>Edit</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        {editMode ? (
                            <>
                                {!!error && (
                                    <View style={styles.errorBox}>
                                        <Text style={styles.errorText}>
                                            {error}
                                        </Text>
                                    </View>
                                )}
                                <Text style={styles.fieldLabel}>Full Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={fullName}
                                    onChangeText={setFullName}
                                    placeholder="Your name"
                                    placeholderTextColor={colors.textMuted}
                                />
                                <Text style={styles.fieldLabel}>
                                    Experience Level
                                </Text>
                                <View style={styles.levelRow}>
                                    {EXPERIENCE_LEVELS.map((lvl) => (
                                        <TouchableOpacity
                                            key={lvl}
                                            style={[
                                                styles.levelChip,
                                                experienceLevel === lvl &&
                                                    styles.levelChipActive,
                                            ]}
                                            onPress={() =>
                                                setExperienceLevel(lvl)
                                            }
                                        >
                                            <Text
                                                style={[
                                                    styles.levelText,
                                                    experienceLevel === lvl &&
                                                        styles.levelTextActive,
                                                ]}
                                            >
                                                {lvl.charAt(0).toUpperCase() +
                                                    lvl.slice(1)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <View style={styles.btnRow}>
                                    <Button
                                        title="Cancel"
                                        onPress={() => setEditMode(false)}
                                        variant="ghost"
                                        style={styles.btnHalf}
                                    />
                                    <Button
                                        title="Save"
                                        onPress={handleSave}
                                        loading={saving}
                                        style={styles.btnHalf}
                                    />
                                </View>
                            </>
                        ) : (
                            <>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Name</Text>
                                    <Text style={styles.infoValue}>
                                        {displayName}
                                    </Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Email</Text>
                                    <Text style={styles.infoValue}>
                                        {displayEmail}
                                    </Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Level</Text>
                                    <Text
                                        style={[
                                            styles.infoValue,
                                            { textTransform: "capitalize" },
                                        ]}
                                    >
                                        {expLevel}
                                    </Text>
                                </View>
                            </>
                        )}
                    </Card>

                    {/* Settings */}
                    <Card elevated style={styles.settingsCard}>
                        <TouchableOpacity
                            style={styles.settingsRow}
                            onPress={() => navigation.navigate("Settings")}
                        >
                            <Text style={styles.settingsLabel}>
                                ⚙️ Settings
                            </Text>
                            <Text style={styles.settingsArrow}>→</Text>
                        </TouchableOpacity>
                    </Card>

                    {/* Resume Analyzer */}
                    <Card elevated style={styles.settingsCard}>
                        <TouchableOpacity
                            style={styles.settingsRow}
                            onPress={() =>
                                navigation.navigate("ResumeAnalyzer")
                            }
                        >
                            <Text style={styles.settingsLabel}>
                                📄 Resume Analyzer
                            </Text>
                            <Text style={styles.settingsArrow}>→</Text>
                        </TouchableOpacity>
                    </Card>

                    {/* Notes & Bookmarks */}
                    <Card elevated style={styles.settingsCard}>
                        <TouchableOpacity
                            style={styles.settingsRow}
                            onPress={() =>
                                navigation.navigate("NotesBookmarks")
                            }
                        >
                            <Text style={styles.settingsLabel}>
                                📝 Notes & Bookmarks
                            </Text>
                            <Text style={styles.settingsArrow}>→</Text>
                        </TouchableOpacity>
                    </Card>

                    {/* FAQ & Support */}
                    <Card elevated style={styles.settingsCard}>
                        <TouchableOpacity
                            style={styles.settingsRow}
                            onPress={() => navigation.navigate("FAQ")}
                        >
                            <Text style={styles.settingsLabel}>
                                ❓ FAQ & Support
                            </Text>
                            <Text style={styles.settingsArrow}>→</Text>
                        </TouchableOpacity>
                    </Card>

                    {/* Sign Out */}
                    <Button
                        title="Sign Out"
                        onPress={confirmLogout}
                        variant="danger"
                        fullWidth
                        style={styles.logoutBtn}
                    />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    hero: {
        paddingBottom: spacing.xl,
        paddingHorizontal: spacing.lg,
        alignItems: "center",
    },
    heroName: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeXL,
        fontWeight: typography.fontWeightExtraBold,
        marginTop: spacing.md,
    },
    heroEmail: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        marginTop: 4,
    },
    tierBadge: {
        marginTop: spacing.sm,
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.full,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    tierText: {
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightBold,
    },
    body: { padding: spacing.lg, gap: spacing.md },
    coinsCard: {},
    coinsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    coinsLabel: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightSemiBold,
    },
    coinsValue: {
        color: colors.warning,
        fontSize: typography.fontSize2XL,
        fontWeight: typography.fontWeightExtraBold,
    },
    coinsSub: {
        color: colors.textMuted,
        fontSize: typography.fontSizeXS,
        marginTop: spacing.xs,
    },
    editCard: {},
    editHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.md,
    },
    sectionTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightBold,
    },
    editLink: {
        color: colors.primary,
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightSemiBold,
    },
    errorBox: {
        backgroundColor: "rgba(231,76,60,0.12)",
        borderColor: colors.error,
        borderWidth: 1,
        borderRadius: borderRadius.md,
        padding: spacing.sm,
        marginBottom: spacing.md,
    },
    errorText: { color: colors.error, fontSize: typography.fontSizeSM },
    fieldLabel: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeXS,
        fontWeight: typography.fontWeightMedium,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: "rgba(255,255,255,0.05)",
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        borderRadius: borderRadius.lg,
        paddingVertical: 10,
        paddingHorizontal: spacing.md,
        fontSize: typography.fontSizeMD,
        marginBottom: spacing.md,
    },
    levelRow: {
        flexDirection: "row",
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    levelChip: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: borderRadius.lg,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        alignItems: "center",
    },
    levelChipActive: {
        backgroundColor: "#7c3aed",
        borderColor: "#7c3aed",
    },
    levelText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightMedium,
    },
    levelTextActive: {
        color: colors.textPrimary,
        fontWeight: typography.fontWeightBold,
    },
    btnRow: { flexDirection: "row", gap: spacing.sm },
    btnHalf: { flex: 1 },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.06)",
    },
    infoLabel: { color: colors.textSecondary, fontSize: typography.fontSizeSM },
    infoValue: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightMedium,
    },
    settingsCard: { padding: 0 },
    settingsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: spacing.md,
    },
    settingsLabel: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightMedium,
    },
    settingsArrow: { color: colors.textMuted, fontSize: typography.fontSizeLG },
    logoutBtn: { marginTop: spacing.sm },
});
