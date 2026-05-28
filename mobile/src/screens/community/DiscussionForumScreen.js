import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput } from "react-native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { communityApi } from "../../api/communityApi";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";

export default function DiscussionForumScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [threads, setThreads] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    const loadData = async () => {
        try {
            const data = await communityApi.getDiscussions();
            setThreads(data || []);
        } catch (error) {
            console.error("Failed to load discussions:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const filteredThreads = threads.filter(t => 
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

    return (
        <View style={styles.container}>
            <ScreenHeader 
                title="Community Forum" 
                onBack={() => navigation.goBack()} 
                right={
                    <TouchableOpacity style={styles.newBtn}>
                        <Text style={styles.newBtnText}>+ New</Text>
                    </TouchableOpacity>
                }
            />
            
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
                {filteredThreads.length === 0 ? (
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
                                <Text style={styles.voteCount}>{thread.votes || 0}</Text>
                            </View>
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTitle}>{thread.title}</Text>
                                <View style={styles.cardFooter}>
                                    <Text style={styles.metaText}>By {thread.author || "Anonymous"}</Text>
                                    <Text style={styles.metaText}>•</Text>
                                    <Text style={styles.metaText}>{thread.comments_count || 0} comments</Text>
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
    
    newBtn: { backgroundColor: "rgba(129, 140, 248, 0.1)", paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.primary },
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
