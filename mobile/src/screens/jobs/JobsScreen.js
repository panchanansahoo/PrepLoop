import React, { useCallback, useEffect, useRef, useState } from "react";
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
const PAGE_LIMIT = 50;
const SEARCH_DEBOUNCE_MS = 350;

function extractJobsList(data) {
    if (Array.isArray(data)) return data;
    return data?.jobs || data?.data || data?.results || [];
}

function getJobKey(job, fallbackIndex) {
    if (job?.id != null) return String(job.id);
    const title = (job?.title || job?.jobTitle || "").trim().toLowerCase();
    const company = (job?.company || job?.companyName || "").trim().toLowerCase();
    const location = (job?.location || job?.jobLocation || "").trim().toLowerCase();
    if (title || company) return `${title}:${company}:${location}`;
    return `idx:${fallbackIndex}`;
}

function mergeUniqueJobs(existing, incoming) {
    const seen = new Set();
    const merged = [];
    for (const list of [existing, incoming]) {
        for (let i = 0; i < list.length; i += 1) {
            const job = list[i];
            const key = getJobKey(job, merged.length);
            if (seen.has(key)) continue;
            seen.add(key);
            merged.push(job);
        }
    }
    return merged;
}

function computeHasMore(data, nextPage, mergedCount, pageCount) {
    if (pageCount === 0) return false;
    if (typeof data?.totalPages === "number") {
        return nextPage < data.totalPages;
    }
    if (typeof data?.total === "number") {
        return mergedCount < data.total;
    }
    if (typeof data?.pagination?.hasMore === "boolean") {
        return data.pagination.hasMore;
    }
    return pageCount >= PAGE_LIMIT;
}

function buildJobsQueryParams({ targetPage = 1, searchQuery = "", selectedType = "All" } = {}) {
    const params = {
        page: targetPage,
        limit: PAGE_LIMIT,
    };
    const trimmed = String(searchQuery || "").trim();
    if (trimmed) {
        params.search = trimmed;
    }
    if (selectedType && selectedType !== "All") {
        params.type = selectedType.toLowerCase();
    }
    return params;
}

function JobCard({ job, onApply }) {
    const applyUrl =
        [job.apply_link, job.applyUrl, job.url]
            .find((v) => typeof v === "string" && /^https?:\/\//i.test(v.trim()))
            ?.trim() || "";
    const salaryText = job.salary || job.salary_range || job.salaryRange;
    const postedDate = job.postedAt || job.created_at;
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
                {salaryText && (
                    <View style={styles.detailChip}>
                        <Text style={styles.detailText}>
                            💰 {salaryText}
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
                {Boolean(applyUrl) && (
                    <TouchableOpacity
                        style={styles.applyBtn}
                        onPress={() => onApply(applyUrl)}
                    >
                        <Text style={styles.applyBtnText}>Apply Now →</Text>
                    </TouchableOpacity>
                )}
                {postedDate && !Number.isNaN(Date.parse(postedDate)) && (
                    <Text style={styles.postedAt}>
                        {new Date(postedDate).toLocaleDateString("en-US", {
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
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const requestSeqRef = useRef(0);
    const jobsRef = useRef([]);

    useEffect(() => {
        if (!search.trim()) {
            setDebouncedSearch("");
            return undefined;
        }
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [search]);

    const loadJobs = useCallback(
        async ({
            targetPage = 1,
            append = false,
            searchQuery = debouncedSearch,
            selectedType = typeFilter,
            isRefresh = false,
        } = {}) => {
            const reqId = ++requestSeqRef.current;
            try {
                if (!append && !isRefresh) setLoading(true);
                if (append) setLoadingMore(true);
                setError("");

                const params = buildJobsQueryParams({
                    targetPage,
                    searchQuery,
                    selectedType,
                });

                const data = await jobsApi.getJobs(params);
                if (reqId !== requestSeqRef.current) return;

                const list = extractJobsList(data);
                const nextJobs = append ? mergeUniqueJobs(jobsRef.current, list) : list;
                jobsRef.current = nextJobs;
                setJobs(nextJobs);
                setHasMore(
                    computeHasMore(
                        data,
                        targetPage,
                        nextJobs.length,
                        list.length,
                    ),
                );
                setPage(targetPage);
            } catch (err) {
                if (reqId !== requestSeqRef.current) return;
                setError(
                    err?.response?.data?.message ||
                        err?.response?.data?.error ||
                        "Failed to load jobs.",
                );
            } finally {
                if (reqId === requestSeqRef.current) {
                    setLoading(false);
                    setLoadingMore(false);
                    setRefreshing(false);
                }
            }
        },
        [debouncedSearch, typeFilter],
    );

    useEffect(() => {
        loadJobs({
            targetPage: 1,
            append: false,
            searchQuery: debouncedSearch,
            selectedType: typeFilter,
        });
    }, [debouncedSearch, typeFilter, loadJobs]);

    const handleLoadMore = useCallback(() => {
        if (loading || loadingMore || refreshing || !hasMore) return;
        loadJobs({
            targetPage: page + 1,
            append: true,
            searchQuery: debouncedSearch,
            selectedType: typeFilter,
        });
    }, [
        loading,
        loadingMore,
        refreshing,
        hasMore,
        page,
        debouncedSearch,
        typeFilter,
        loadJobs,
    ]);

    async function handleApply(url) {
        try {
            await Linking.openURL(url);
        } catch {
            Alert.alert(
                "Cannot Open URL",
                "This job link cannot be opened on your device.",
            );
        }
    }

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
                <ErrorMessage
                    message={error}
                    onRetry={() =>
                        loadJobs({
                            targetPage: 1,
                            append: false,
                            searchQuery: debouncedSearch,
                            selectedType: typeFilter,
                        })
                    }
                />
            ) : loading ? (
                <LoadingSpinner message="Loading jobs..." />
            ) : jobs.length === 0 ? (
                <EmptyState
                    emoji="🔍"
                    title="No jobs found"
                    message="Try a different search or filter."
                />
            ) : (
                <FlatList
                    data={jobs}
                    keyExtractor={(item, i) => getJobKey(item, i)}
                    renderItem={({ item }) => (
                        <JobCard job={item} onApply={handleApply} />
                    )}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.4}
                    ListFooterComponent={
                        loadingMore ? (
                            <LoadingSpinner message="Loading more jobs..." />
                        ) : null
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                loadJobs({
                                    targetPage: 1,
                                    append: false,
                                    searchQuery: debouncedSearch,
                                    selectedType: typeFilter,
                                    isRefresh: true,
                                });
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
