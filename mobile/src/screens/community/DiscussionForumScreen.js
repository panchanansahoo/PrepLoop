import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { communityApi } from "../../api/communityApi";
import { useAuth } from "../../context/AuthContext";
import { playHapticFeedback } from "../../utils/preferences";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";

export default function DiscussionForumScreen({ navigation }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [threads, setThreads] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loadError, setLoadError] = useState(false);
    const [composing, setComposing] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [postError, setPostError] = useState("");

    const openComposer = () => {
        setPostError("");
        setComposing(true);
        playHapticFeedback(user?.id).catch(() => {});
    };

    const closeComposer = () => {
        if (submitting) return;
        setPostError("");
        setComposing(false);
    };

    const createPost = async () => {
        if (submitting || !title.trim() || !content.trim()) return;
        setSubmitting(true);
        setPostError("");
        try {
            const created = await communityApi.createDiscussion({ title: title.trim(), content: content.trim() });
            setTitle("");
            setContent("");
            setComposing(false);
            playHapticFeedback(user?.id).catch(() => {});
            if (created?.post) {
                setThreads(prev => [created.post, ...prev.filter(t => String(t.id) !== String(created.post.id))]);
            }
            await loadData();
        } catch (error) {
            setPostError(error.response?.data?.error || "Could not publish your discussion. Try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const loadData = useCallback(async () => {
        try {
            setLoadError(false);
            const data = await communityApi.getDiscussions({ filter: "recent" });
            const list = Array.isArray(data)
                ? data
                : Array.isArray(data?.posts)
                ? data.posts
                : [];
            setThreads(list);
        } catch {
            setLoadError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(useCallback(() => {
        loadData();
    }, [loadData]));

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const filteredThreads = (Array.isArray(threads) ? threads : []).filter(t =>
        t.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Community" onBack={() => navigation.goBack()} />
                <LoadingSpinner />
            </View>
        );
    }

    const canPublish = Boolean(title.trim() && content.trim()) && !submitting;

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Community Forum"
                onBack={() => navigation.goBack()}
                right={
                    <TouchableOpacity style={styles.newBtn} disabled={submitting} onPress={openComposer}>
                        <Text style={styles.newBtnText}>+ New</Text>
                    </TouchableOpacity>
                }
            />

            {composing && (
                <View style={[styles.searchContainer, styles.composer]}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Discussion title"
                        placeholderTextColor={colors.textMuted}
                        accessibilityLabel="Discussion title"
                        value={title}
                        onChangeText={setTitle}
                        maxLength={300}
                        editable={!submitting}
                    />
                    <TextInput
                        style={[styles.searchInput, styles.contentInput]}
                        placeholder="What would you like to discuss?"
                        placeholderTextColor={colors.textMuted}
                        accessibilityLabel="Discussion content"
                        value={content}
                        onChangeText={setContent}
                        maxLength={10000}
                        multiline
                        editable={!submitting}
                    />
                    {postError ? <Text accessibilityRole="alert" style={styles.errorText}>{postError}</Text> : null}
                    <View style={styles.composerActions}>
                        <TouchableOpacity onPress={closeComposer} disabled={submitting}>
                            <Text style={styles.metaText}>Close</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.newBtn, !canPublish && styles.newBtnDisabled]}
                            onPress={createPost}
                            disabled={!canPublish}
                        >
                            <Text style={styles.newBtnText}>{submitting ? "Publishing…" : "Publish"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search discussions..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {loadError && (
                    <TouchableOpacity onPress={loadData}><Text style={styles.errorText}>Could not load discussions. Tap to retry.</Text></TouchableOpacity>
                )}
                {filteredThreads.length === 0 ? !loadError && (
                    <Text style={styles.emptyText}>No discussions found.</Text>
                ) : (
                    filteredThreads.map((thread, index) => (
                        <TouchableOpacity
                            key={thread.id || index}
                            style={styles.card}
                            onPress={() => navigation.navigate("ThreadDetail", { id: thread.id, title: thread.title })}
                        >
                            <View style={styles.votesContainer}>
                                <Text style={styles.voteIcon}>▲</Text>
                                <Text style={styles.voteCount}>{thread.likes ?? 0}</Text>
                            </View>
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTitle}>{thread.title}</Text>
                                <View style={styles.cardFooter}>
                                    <Text style={styles.metaText}>By {thread.author_name || "Anonymous"}</Text>
                                    <Text style={styles.metaText}>•</Text>
                                    <Text style={styles.metaText}>{thread.reply_count ?? 0} comments</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },

    composer: { gap: spacing.sm },
    composerActions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.md, alignItems: "center" },
    contentInput: { minHeight: 88, textAlignVertical: "top" },
    errorText: { color: colors.error },
    newBtn: { backgroundColor: "rgba(129, 140, 248, 0.1)", paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.primary },
    newBtnDisabled: { opacity: 0.45 },
    newBtnText: { color: colors.primary, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightBold },

    searchContainer: { padding: spacing.md, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
    searchInput: { backgroundColor: colors.bg, padding: spacing.md, borderRadius: borderRadius.md, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },

    scrollContent: { padding: spacing.lg, paddingBottom: 40 },
    emptyText: { color: colors.textSecondary, textAlign: "center", marginTop: spacing.xl },

    card: { flexDirection: "row", backgroundColor: colors.bgCard, padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
    votesContainer: { alignItems: "center", justifyContent: "center", marginRight: spacing.md, width: 40 },
    voteIcon: { color: colors.textSecondary, fontSize: 18, marginBottom: 4 },
    voteCount: { color: colors.textPrimary, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightBold },

    cardContent: { flex: 1, justifyContent: "center" },
    cardTitle: { color: colors.textPrimary, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold, marginBottom: spacing.sm, lineHeight: 22 },
    cardFooter: { flexDirection: "row", alignItems: "center" },
    metaText: { color: colors.textSecondary, fontSize: typography.fontSizeXS, marginRight: spacing.xs },
});
