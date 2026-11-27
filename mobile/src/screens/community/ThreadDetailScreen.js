import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { communityApi } from "../../api/communityApi";
import { useAuth } from "../../context/AuthContext";
import { playHapticFeedback } from "../../utils/preferences";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";

export default function ThreadDetailScreen({ route, navigation }) {
    const { id } = route.params || {};
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [thread, setThread] = useState(null);
    const [comment, setComment] = useState("");
    const [posting, setPosting] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [postError, setPostError] = useState("");
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        let active = true;
        if (!id) {
            setThread(null);
            setLoadError("This discussion could not be found.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setLoadError("");
        setThread(null);
        communityApi.getDiscussion(id)
            .then(data => { if (active) setThread(data); })
            .catch(error => {
                if (active) setLoadError(error.response?.status === 404 ? "This discussion could not be found." : "Could not load the discussion.");
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [id, retry]);

    const handlePostComment = async () => {
        const text = comment.trim();
        if (!text || posting || !id) return;
        setPosting(true);
        setPostError("");
        try {
            const response = await communityApi.addComment(id, text);
            setComment("");
            playHapticFeedback(user?.id).catch(() => {});
            if (response.reply) {
                setThread(prev => ({
                    ...prev,
                    reply_count: (prev?.reply_count ?? prev?.comments?.length ?? 0) + 1,
                    comments: [...(prev?.comments || []), response.reply],
                }));
            } else {
                const updated = await communityApi.getDiscussion(id).catch(() => null);
                if (updated) {
                    setThread(updated);
                } else {
                    setRetry(value => value + 1);
                }
            }
        } catch (error) {
            setPostError(error.response?.data?.error || "Could not post your comment. Try again.");
        } finally {
            setPosting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Discussion" onBack={() => navigation.goBack()} />
                <LoadingSpinner />
            </View>
        );
    }

    if (!thread) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Discussion" onBack={() => navigation.goBack()} />
                <View style={styles.center}>
                    <Text style={styles.errorText}>{loadError}</Text>
                    {id ? (
                        <TouchableOpacity onPress={() => setRetry(value => value + 1)}>
                            <Text style={styles.sendBtnText}>Try again</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScreenHeader title="Discussion" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Original Post */}
                <View style={styles.opCard}>
                    <Text style={styles.title}>{thread.title}</Text>
                    <View style={styles.meta}>
                        <Text style={styles.metaText}>By {thread.author_name || "Anonymous"}</Text>
                        <Text style={styles.metaDot}>•</Text>
                        <Text style={styles.metaText}>{new Date(thread.created_at || Date.now()).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.content}>{thread.content || "No content provided."}</Text>
                </View>

                {/* Comments Section */}
                <Text style={styles.commentsHeader}>Comments ({thread.comments?.length ?? thread.reply_count ?? 0})</Text>

                {thread.comments && thread.comments.length > 0 ? (
                    thread.comments.map((c, i) => (
                        <View key={c.id || i} style={styles.commentCard}>
                            <View style={styles.commentMeta}>
                                <Text style={styles.commentAuthor}>{c.author_name || "User"}</Text>
                                <Text style={styles.commentDate}>{new Date(c.created_at || Date.now()).toLocaleDateString()}</Text>
                            </View>
                            <Text style={styles.commentText}>{c.content}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.noCommentsText}>Be the first to share your thoughts.</Text>
                )}
            </ScrollView>

            {postError ? <Text accessibilityRole="alert" style={styles.postErrorText}>{postError}</Text> : null}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Add a comment..."
                    placeholderTextColor={colors.textMuted}
                    value={comment}
                    onChangeText={(text) => {
                        setComment(text);
                        if (postError) setPostError("");
                    }}
                    editable={!posting}
                    maxLength={4000}
                    multiline
                />
                <TouchableOpacity style={styles.sendBtn} onPress={handlePostComment} disabled={posting || !comment.trim()}>
                    <Text style={[styles.sendBtnText, (posting || !comment.trim()) && styles.sendBtnTextDisabled]}>Post</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing.sm },
    errorText: { color: colors.textSecondary },
    postErrorText: { color: colors.error, fontSize: typography.fontSizeSM, paddingHorizontal: spacing.md, paddingTop: spacing.xs, backgroundColor: colors.bgCard },

    scrollContent: { padding: spacing.lg, paddingBottom: 40 },

    opCard: { backgroundColor: colors.bgCard, padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl },
    title: { color: colors.textPrimary, fontSize: typography.fontSizeXL, fontWeight: typography.fontWeightBold, marginBottom: spacing.sm, lineHeight: 28 },
    meta: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    metaText: { color: colors.textSecondary, fontSize: typography.fontSizeSM },
    metaDot: { color: colors.textMuted, marginHorizontal: spacing.sm },
    content: { color: colors.textPrimary, fontSize: typography.fontSizeMD, lineHeight: 24 },

    commentsHeader: { color: colors.textPrimary, fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightBold, marginBottom: spacing.md },
    noCommentsText: { color: colors.textSecondary, fontStyle: "italic", textAlign: "center", marginVertical: spacing.xl },

    commentCard: { backgroundColor: colors.bg, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
    commentMeta: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xs },
    commentAuthor: { color: colors.primary, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightBold },
    commentDate: { color: colors.textMuted, fontSize: typography.fontSizeXS },
    commentText: { color: colors.textPrimary, fontSize: typography.fontSizeMD, lineHeight: 22 },

    inputContainer: { flexDirection: "row", padding: spacing.md, backgroundColor: colors.bgCard, borderTopWidth: 1, borderTopColor: colors.border, alignItems: "center" },
    input: { flex: 1, backgroundColor: colors.bg, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, minHeight: 40, maxHeight: 100 },
    sendBtn: { marginLeft: spacing.md, padding: spacing.sm },
    sendBtnText: { color: colors.primary, fontWeight: typography.fontWeightBold, fontSize: typography.fontSizeMD },
    sendBtnTextDisabled: { color: colors.textMuted },
});
