import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { blogApi } from "../../api/blogApi";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";

export default function BlogPostScreen({ route, navigation }) {
    const { slug, title } = route.params || {};
    const [loading, setLoading] = useState(true);
    const [post, setPost] = useState(null);

    useEffect(() => {
        const loadPost = async () => {
            try {
                const data = await blogApi.getPostBySlug(slug);
                setPost(data);
            } catch (error) {
                console.error("Failed to load blog post:", error);
            } finally {
                setLoading(false);
            }
        };
        
        if (slug) {
            loadPost();
        } else {
            setLoading(false);
        }
    }, [slug]);

    if (loading) {
        return (
            <View style={styles.container}>
                <ScreenHeader title={title || "Article"} onBack={() => navigation.goBack()} />
                <LoadingSpinner />
            </View>
        );
    }

    if (!post) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Article Not Found" onBack={() => navigation.goBack()} />
                <View style={styles.center}>
                    <Text style={styles.errorText}>Could not load the article. It may have been removed.</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader title="Article" onBack={() => navigation.goBack()} />
            
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.tag}>{post.category || "General"}</Text>
                    <Text style={styles.title}>{post.title}</Text>
                    
                    <View style={styles.meta}>
                        <Text style={styles.metaText}>{post.author || "PrepLoop Team"}</Text>
                        <Text style={styles.metaDot}>•</Text>
                        <Text style={styles.metaText}>{new Date(post.published_at || Date.now()).toLocaleDateString()}</Text>
                        <Text style={styles.metaDot}>•</Text>
                        <Text style={styles.metaText}>{post.read_time || "5 min read"}</Text>
                    </View>
                </View>

                {/* Simulated Markdown Renderer */}
                <View style={styles.content}>
                    <Text style={styles.paragraph}>
                        {post.content || "This is a placeholder for the full article content. In a production environment, this would use a Markdown renderer component to display formatted text, code blocks, images, and headings."}
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Thanks for reading!</Text>
                    <TouchableOpacity style={styles.shareButton}>
                        <Text style={styles.shareText}>Share Article</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl },
    errorText: { color: colors.textSecondary, textAlign: "center" },
    
    scrollContent: { paddingBottom: 40 },
    
    header: { padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
    tag: { color: colors.primary, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightBold, textTransform: "uppercase", marginBottom: spacing.sm },
    title: { color: colors.textPrimary, fontSize: typography.fontSize3XL, fontWeight: typography.fontWeightBold, lineHeight: 36, marginBottom: spacing.md },
    
    meta: { flexDirection: "row", alignItems: "center" },
    metaText: { color: colors.textSecondary, fontSize: typography.fontSizeSM },
    metaDot: { color: colors.textMuted, marginHorizontal: spacing.sm },
    
    content: { padding: spacing.xl },
    paragraph: { color: colors.textPrimary, fontSize: typography.fontSizeMD, lineHeight: 26, marginBottom: spacing.md },
    
    footer: { padding: spacing.xl, alignItems: "center", borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.xl },
    footerText: { color: colors.textSecondary, fontSize: typography.fontSizeMD, marginBottom: spacing.md },
    shareButton: { backgroundColor: colors.bgCard, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border },
    shareText: { color: colors.textPrimary, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold },
});
