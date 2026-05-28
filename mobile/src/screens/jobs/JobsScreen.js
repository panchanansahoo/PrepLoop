import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    StatusBar,
    RefreshControl,
    Linking,
    Alert,
} from "react-native";
import { jobsApi } from "../../api/jobsApi";
import { Card } from "../../components/Card";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { ErrorMessage } from "../../components/ErrorMessage";
import { EmptyState } from "../../components/EmptyState";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const JOB_TYPES = ["All", "Full-time", "Remote", "Internship", "Contract"];

function JobCard({ job, onApply }) {
    return (
        <Card elevated style={styles.jobCard}>
            <View style={styles.jobHeader}>
                <View style={styles.companyLogoBox}>
                    <Text style={styles.companyLogoText}>
                        {(job.company ||
                            job.companyName ||
                            "?")[0].toUpperCase()}
                    </Text>
                </View>
                <View style={styles.jobMeta}>
                    <Text style={styles.jobTitle} numberOfLines={2}>
                        {job.title || job.jobTitle}
                    </Text>
                    <Text style={styles.companyName}>
                        {job.company || job.companyName}
                    </Text>
                </View>
            </View>
            <View style={styles.jobDetails}>
                {(job.location || job.jobLocation) && (
                    <View style={styles.detailChip}>
                        <Text style={styles.detailText}>
                            📍 {job.location || job.jobLocation}
                        </Text>
                    </View>
                )}
                {job.type && (
                    <View style={styles.detailChip}>
                        <Text style={styles.detailText}>⏰ {job.type}</Text>
                    </View>
                )}
                {(job.salary || job.salaryRange) && (
                    <View style={styles.detailChip}>
                        <Text style={styles.detailText}>
                            💰 {job.salary || job.salaryRange}
                        </Text>
                    </View>
                )}
            </View>
            {job.description && (
                <Text style={styles.jobDesc} numberOfLines={3}>
                    {job.description}
                </Text>
            )}
            <View style={styles.jobActions}>
                {(job.url || job.applyUrl) && (
                    <TouchableOpacity
                        style={styles.applyBtn}
                        onPress={() => onApply(job.url || job.applyUrl)}
                    >
                        <Text style={styles.applyBtnText}>Apply Now →</Text>
                    </TouchableOpacity>
                )}
                {job.postedAt && (
                    <Text style={styles.postedAt}>
                        {new Date(job.postedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                        })}
                    </Text>
                )}
            </View>
        </Card>
    );
}

export default function JobsScreen() {
    const insets = useSafeAreaInsets();
    const [jobs, setJobs] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");

    async function loadJobs() {
        try {
            setError("");
            const data = await jobsApi.getJobs({ limit: 50 });
            const list = Array.isArray(data)
                ? data
                : data.jobs || data.data || data.results || [];
            setJobs(list);
            setFiltered(list);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to load jobs.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        loadJobs();
    }, []);

    useEffect(() => {
        let result = jobs;
        if (typeFilter !== "All") {
            result = result.filter((j) =>
                j.type?.toLowerCase().includes(typeFilter.toLowerCase()),
            );
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (j) =>
                    (j.title || j.jobTitle || "").toLowerCase().includes(q) ||
                    (j.company || j.companyName || "")
                        .toLowerCase()
                        .includes(q),
            );
        }
        setFiltered(result);
    }, [jobs, search, typeFilter]);

    async function handleApply(url) {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            Linking.openURL(url);
        } else {
            Alert.alert(
                "Cannot Open URL",
                "This job link cannot be opened on your device.",
            );
        }
    }

    if (loading) return <LoadingSpinner fullScreen message="Loading jobs..." />;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
            <View
                style={[
                    styles.header,
                    {
                        paddingTop: Math.max(
                            insets.top + spacing.sm,
                            spacing.lg,
                        ),
                    },
                ]}
            >
                <Text style={styles.title}>💼 Job Board</Text>
                <Text style={styles.subtitle}>
                    Latest tech job opportunities
                </Text>
                <View style={styles.searchBox}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search jobs or companies..."
                        placeholderTextColor={colors.textMuted}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                <FlatList
                    horizontal
                    data={JOB_TYPES}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                typeFilter === item && styles.filterChipActive,
                            ]}
                            onPress={() => setTypeFilter(item)}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    typeFilter === item &&
                                        styles.filterChipTextActive,
                                ]}
                            >
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.filterRow}
                    showsHorizontalScrollIndicator={false}
                />
            </View>

            {error ? (
                <ErrorMessage message={error} onRetry={loadJobs} />
            ) : filtered.length === 0 ? (
                <EmptyState
                    emoji="🔍"
                    title="No jobs found"
                    message="Try a different search or filter."
                />
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item, i) => item.id?.toString() || String(i)}
                    renderItem={({ item }) => (
                        <JobCard job={item} onApply={handleApply} />
                    )}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                loadJobs();
                            }}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                        />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
        backgroundColor: colors.bgCardAlt,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        color: colors.textPrimary,
        fontSize: typography.fontSize2XL,
        fontWeight: typography.fontWeightExtraBold,
    },
    subtitle: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        marginTop: 2,
        marginBottom: spacing.md,
    },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
    },
    searchIcon: { fontSize: 15, marginRight: spacing.xs, opacity: 0.5 },
    searchInput: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: typography.fontSizeMD,
        paddingVertical: 10,
    },
    filterRow: { paddingBottom: spacing.sm, gap: spacing.xs },
    filterChip: {
        paddingVertical: 6,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        marginRight: spacing.xs,
    },
    filterChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterChipText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightMedium,
    },
    filterChipTextActive: {
        color: "#fff",
        fontWeight: typography.fontWeightBold,
    },
    list: { padding: spacing.md, gap: spacing.sm },
    jobCard: {},
    jobHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: spacing.sm,
    },
    companyLogoBox: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.md,
        backgroundColor: colors.primary + "22",
        borderWidth: 1,
        borderColor: colors.primary + "44",
        alignItems: "center",
        justifyContent: "center",
        marginRight: spacing.md,
    },
    companyLogoText: {
        color: colors.primary,
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightBold,
    },
    jobMeta: { flex: 1 },
    jobTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightBold,
    },
    companyName: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        marginTop: 2,
    },
    jobDetails: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.xs,
        marginBottom: spacing.sm,
    },
    detailChip: {
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: borderRadius.full,
        paddingVertical: 2,
        paddingHorizontal: spacing.sm,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    detailText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeXS,
    },
    jobDesc: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        lineHeight: 20,
        marginBottom: spacing.sm,
    },
    jobActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: spacing.xs,
    },
    applyBtn: {
        // Web: violet gradient btn
        backgroundColor: "#7c3aed",
        borderRadius: borderRadius.full,
        paddingVertical: 6,
        paddingHorizontal: spacing.md,
        shadowColor: "#7c3aed",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 3,
    },
    applyBtnText: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightBold,
    },
    postedAt: { color: colors.textMuted, fontSize: typography.fontSizeXS },
});
