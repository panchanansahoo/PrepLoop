import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { blogApi } from "../../api/blogApi";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";

export default function BlogListScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [posts, setPosts] = useState([]);

    const loadData = async () => {
        try {
            const data = await blogApi.getPosts();
            setPosts(data || []);
        } catch (error) {
            console.error("Failed to load blog posts:", error);
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

    if (loading) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Engineering Blog" onBack={() => navigation.goBack()} />
                <LoadingSpinner />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader title="Engineering Blog" onBack={() => navigation.goBack()} />
            
            <View style={styles.heroSection}>
                <Text style={styles.heroTitle}>PrepLoop Insights</Text>
                <Text style={styles.heroDesc}>Tips, guides, and engineering deep dives to ace your interviews.</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {posts.length === 0 ? (
                    <Text style={styles.emptyText}>No articles published yet.</Text>
                ) : (
                    posts.map((post, index) => (
                        <TouchableOpacity 
                            key={post.id || index}
                            style={styles.card}
                            onPress={() => navigation.navigate("BlogPost", { slug: post.slug, title: post.title })}
                        >
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTag}>{post.category || "General"}</Text>
                                <Text style={styles.cardTitle}>{post.title}</Text>
                                <Text style={styles.cardExcerpt} numberOfLines={2}>
                                    {post.excerpt || "Read more about this topic..."}
                                </Text>
                                <View style={styles.cardFooter}>
                                    <Text style={styles.date}>{new Date(post.published_at || Date.now()).toLocaleDateString()}</Text>
                                    <Text style={styles.readTime}>{post.read_time || "5 min read"}</Text>
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
    heroSection: { padding: spacing.xl, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
    heroTitle: { color: colors.textPrimary, fontSize: typography.fontSizeXL, fontWeight: typography.fontWeightBold, marginBottom: spacing.xs },
    heroDesc: { color: colors.textSecondary, fontSize: typography.fontSizeSM, lineHeight: 20 },
    
    scrollContent: { padding: spacing.lg, paddingBottom: 40 },
    emptyText: { color: colors.textSecondary, textAlign: "center", marginTop: spacing.xl },
    
    card: { backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
    cardContent: { padding: spacing.lg },
    cardTag: { color: colors.primary, fontSize: typography.fontSizeXS, fontWeight: typography.fontWeightBold, textTransform: "uppercase", marginBottom: spacing.xs },
    cardTitle: { color: colors.textPrimary, fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightBold, marginBottom: spacing.sm, lineHeight: 26 },
    cardExcerpt: { color: colors.textSecondary, fontSize: typography.fontSizeSM, lineHeight: 20, marginBottom: spacing.md },
    
    cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    date: { color: colors.textMuted, fontSize: typography.fontSizeXS },
    readTime: { color: colors.textMuted, fontSize: typography.fontSizeXS },
});
