import React, { useState, useEffect } from "react";
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    TouchableOpacity, StatusBar, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { userApi } from "../../api/userApi";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";

const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"];

function FieldGroup({ label, children }) {
    return (
        <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>{label}</Text>
            {children}
        </View>
    );
}

export default function EditProfileScreen({ navigation }) {
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Form state
    const [fullName, setFullName] = useState("");
    const [bio, setBio] = useState("");
    const [designation, setDesignation] = useState("");
    const [company, setCompany] = useState("");
    const [skills, setSkills] = useState("");
    const [education, setEducation] = useState("");
    const [experienceLevel, setExperienceLevel] = useState("beginner");
    const [githubUsername, setGithubUsername] = useState("");
    const [linkedinUrl, setLinkedinUrl] = useState("");

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            const p = await userApi.getProfile();
            setFullName(p.full_name || p.fullName || "");
            setBio(p.bio || "");
            setDesignation(p.designation || p.currentRole || "");
            setCompany(p.company || "");
            setSkills(p.skills || "");
            setEducation(p.education || p.qualification || "");
            setExperienceLevel(p.experience_level || p.experienceLevel || "beginner");
            setGithubUsername(p.github_username || p.githubUsername || "");
            setLinkedinUrl(p.linkedin_url || p.linkedinUrl || "");
        } catch {
            // Fall back to user context data
            setFullName(user?.fullName || user?.full_name || "");
            setExperienceLevel(user?.experienceLevel || "beginner");
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!fullName.trim()) {
            setError("Full name is required.");
            return;
        }
        setSaving(true);
        setError("");
        try {
            await userApi.updateProfile({
                fullName: fullName.trim(),
                bio: bio.trim(),
                designation: designation.trim(),
                company: company.trim(),
                skills: skills.trim(),
                education: education.trim(),
                experienceLevel,
                githubUsername: githubUsername.trim(),
                linkedinUrl: linkedinUrl.trim(),
            });
            Alert.alert("Saved", "Your profile has been updated.", [
                { text: "OK", onPress: () => navigation.goBack() },
            ]);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to save changes.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <LoadingSpinner fullScreen message="Loading profile..." />;

    return (
        <View style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
            <View style={[s.header, { paddingTop: Math.max(insets.top + spacing.sm, spacing.lg) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                    <Text style={s.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={s.headerTitle}>Edit Profile</Text>
                <View style={s.backBtn} />
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <ScrollView showsVerticalScrollIndicator={false}
                    contentContainerStyle={s.scrollContent}
                    keyboardShouldPersistTaps="handled">

                    {!!error && (
                        <View style={s.errorBox}>
                            <Text style={s.errorText}>{error}</Text>
                        </View>
                    )}

                    {/* Basic Info */}
                    <Card elevated style={s.section}>
                        <Text style={s.sectionTitle}>Basic Information</Text>
                        <FieldGroup label="Full Name *">
                            <TextInput style={s.input} value={fullName}
                                onChangeText={setFullName} placeholder="Your full name"
                                placeholderTextColor={colors.textMuted} />
                        </FieldGroup>
                        <FieldGroup label="Bio">
                            <TextInput style={[s.input, s.inputMulti]} value={bio}
                                onChangeText={setBio} placeholder="Tell us about yourself..."
                                placeholderTextColor={colors.textMuted}
                                multiline numberOfLines={3} textAlignVertical="top" />
                        </FieldGroup>
                        <FieldGroup label="Experience Level">
                            <View style={s.levelRow}>
                                {EXPERIENCE_LEVELS.map((lvl) => (
                                    <TouchableOpacity key={lvl}
                                        style={[s.levelChip, experienceLevel === lvl && s.levelChipActive]}
                                        onPress={() => setExperienceLevel(lvl)}>
                                        <Text style={[s.levelText, experienceLevel === lvl && s.levelTextActive]}>
                                            {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </FieldGroup>
                    </Card>

                    {/* Professional Info */}
                    <Card elevated style={s.section}>
                        <Text style={s.sectionTitle}>Professional</Text>
                        <FieldGroup label="Current Role / Designation">
                            <TextInput style={s.input} value={designation}
                                onChangeText={setDesignation} placeholder="e.g. Software Engineer"
                                placeholderTextColor={colors.textMuted} />
                        </FieldGroup>
                        <FieldGroup label="Company / Organization">
                            <TextInput style={s.input} value={company}
                                onChangeText={setCompany} placeholder="e.g. Google"
                                placeholderTextColor={colors.textMuted} />
                        </FieldGroup>
                        <FieldGroup label="Skills (comma-separated)">
                            <TextInput style={[s.input, s.inputMulti]} value={skills}
                                onChangeText={setSkills}
                                placeholder="React, Node.js, Python, SQL..."
                                placeholderTextColor={colors.textMuted}
                                multiline numberOfLines={2} textAlignVertical="top" />
                        </FieldGroup>
                        <FieldGroup label="Education">
                            <TextInput style={s.input} value={education}
                                onChangeText={setEducation}
                                placeholder="e.g. B.Tech CS, IIT Delhi"
                                placeholderTextColor={colors.textMuted} />
                        </FieldGroup>
                    </Card>

                    {/* Social Links */}
                    <Card elevated style={s.section}>
                        <Text style={s.sectionTitle}>Social Links</Text>
                        <FieldGroup label="GitHub Username">
                            <TextInput style={s.input} value={githubUsername}
                                onChangeText={setGithubUsername} placeholder="your-username"
                                placeholderTextColor={colors.textMuted}
                                autoCapitalize="none" autoCorrect={false} />
                        </FieldGroup>
                        <FieldGroup label="LinkedIn URL">
                            <TextInput style={s.input} value={linkedinUrl}
                                onChangeText={setLinkedinUrl}
                                placeholder="https://linkedin.com/in/..."
                                placeholderTextColor={colors.textMuted}
                                autoCapitalize="none" autoCorrect={false}
                                keyboardType="url" />
                        </FieldGroup>
                    </Card>

                    {/* Save Button */}
                    <View style={s.btnRow}>
                        <Button title="Cancel" onPress={() => navigation.goBack()}
                            variant="ghost" style={s.btnHalf} />
                        <Button title="Save Changes" onPress={handleSave}
                            loading={saving} style={s.btnHalf} />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
        backgroundColor: colors.bgCardAlt, borderBottomWidth: 1, borderBottomColor: colors.border },
    backBtn: { width: 40, height: 40, justifyContent: "center" },
    backArrow: { color: colors.textPrimary, fontSize: 22, fontWeight: typography.fontWeightBold },
    headerTitle: { color: colors.textPrimary, fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightBold },
    scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
    errorBox: { backgroundColor: "rgba(231,76,60,0.12)", borderColor: colors.error, borderWidth: 1,
        borderRadius: borderRadius.md, padding: spacing.sm, marginBottom: spacing.md },
    errorText: { color: colors.error, fontSize: typography.fontSizeSM },
    section: { marginBottom: spacing.md },
    sectionTitle: { color: colors.textPrimary, fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightBold, marginBottom: spacing.md },
    fieldGroup: { marginBottom: spacing.md },
    fieldLabel: { color: colors.textSecondary, fontSize: typography.fontSizeXS,
        fontWeight: typography.fontWeightMedium, textTransform: "uppercase",
        letterSpacing: 0.8, marginBottom: spacing.xs },
    input: { backgroundColor: "rgba(255,255,255,0.05)", color: colors.textPrimary,
        borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: borderRadius.lg,
        paddingVertical: 10, paddingHorizontal: spacing.md, fontSize: typography.fontSizeMD },
    inputMulti: { minHeight: 70, paddingTop: 10 },
    levelRow: { flexDirection: "row", gap: spacing.sm },
    levelChip: { flex: 1, paddingVertical: 8, borderRadius: borderRadius.lg,
        backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)", alignItems: "center" },
    levelChipActive: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
    levelText: { color: colors.textSecondary, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightMedium },
    levelTextActive: { color: colors.textPrimary, fontWeight: typography.fontWeightBold },
    btnRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
    btnHalf: { flex: 1 },
});
