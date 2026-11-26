import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Share, Linking, TouchableOpacity } from "react-native";
import { WebView } from "react-native-webview";
import { ScreenHeader } from "../../components/ScreenHeader";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { blogApi } from "../../api/blogApi";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";

function formatReadTime(readTime) {
    if (typeof readTime === "number" && Number.isFinite(readTime) && readTime > 0) {
        return `${readTime} min read`;
    }
    if (typeof readTime === "string" && readTime.trim()) {
        return /min/i.test(readTime) ? readTime.trim() : `${readTime.trim()} min read`;
    }
    return "5 min read";
}

function escapeHtml(text) {
    return String(text ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[char]);
}

function renderFallbackArticleHtml(content) {
    if (!content) return "";
    let raw = typeof content === "string" ? content : "";
    if (raw.startsWith('"')) {
        try {
            const decoded = JSON.parse(raw);
            if (typeof decoded === "string") raw = decoded;
        } catch {
            // Plain text starting with a quote
        }
    }
    if (Array.isArray(content) || raw.trim().startsWith("[")) {
        try {
            const blocks = Array.isArray(content) ? content : JSON.parse(raw);
            if (Array.isArray(blocks)) {
                const renderBlocks = (items) =>
                    items
                        .map((block) => {
                            const inline = Array.isArray(block?.content)
                                ? block.content
                                      .map((part) => {
                                          if (part?.type === "link" && Array.isArray(part.content)) {
                                              const href = /^https?:\/\//i.test(String(part.href || ""))
                                                  ? escapeHtml(part.href)
                                                  : "#";
                                              return `<a href="${href}">${part.content.map((c) => escapeHtml(c?.text)).join("")}</a>`;
                                          }
                                          let text = escapeHtml(part?.text);
                                          for (const [style, tag] of [["bold", "strong"], ["italic", "em"], ["code", "code"]]) {
                                              if (part?.styles?.[style]) text = `<${tag}>${text}</${tag}>`;
                                          }
                                          return text;
                                      })
                                      .join("")
                                : escapeHtml(block?.content);
                            const tags = { heading: "h2", codeBlock: "pre", bulletListItem: "p", numberedListItem: "p", quote: "blockquote" };
                            const tag = tags[block?.type] || "p";
                            const formatted =
                                block?.type === "image"
                                    ? (/^https?:\/\//i.test(String(block?.props?.url || ""))
                                          ? `<img src="${escapeHtml(block.props.url)}" alt="${escapeHtml(block.props.caption)}">`
                                          : "")
                                    : `<${tag}>${block?.type === "bulletListItem" ? "• " : ""}${inline}</${tag}>`;
                            return formatted + (Array.isArray(block?.children) ? renderBlocks(block.children) : "");
                        })
                        .join("");
                return renderBlocks(blocks);
            }
        } catch {
            return `<p>${escapeHtml(raw)}</p>`;
        }
    }
    return raw
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
        .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}

export default function BlogPostScreen({ route, navigation }) {
    const { slug, title, source } = route.params || {};
    const [loading, setLoading] = useState(true);
    const [post, setPost] = useState(null);

    useEffect(() => {
        let active = true;
        setLoading(Boolean(slug));
        setPost(null);
        const loadPost = async () => {
            try {
                const data = await blogApi.getPostBySlug(slug, source);
                if (active) setPost(data);
            } catch (error) {
                console.error("Failed to load blog post:", error);
            } finally {
                if (active) setLoading(false);
            }
        };
        
        if (slug) loadPost();
        return () => { active = false; };
    }, [slug, source]);

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

    const resolvedSource = post.source || source;
    const articleUrl = `https://preploop.me/blog/${encodeURIComponent(slug)}${resolvedSource === "editorial" ? "?source=editorial" : ""}`;
    const rawDate = post.published_at || post.created_at;
    const formattedDate = rawDate && !Number.isNaN(Date.parse(rawDate))
        ? new Date(rawDate).toLocaleDateString()
        : null;
    const bodyHtml = post.rendered_content || renderFallbackArticleHtml(post.content) || "<p>Article content is unavailable in the app.</p>";
    const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https:; style-src 'unsafe-inline'">
        <style>body{background:${colors.bg};color:${colors.textPrimary};font:16px/1.65 sans-serif;padding:0 16px;overflow-wrap:anywhere}
        img{max-width:100%;height:auto}pre{overflow:auto;padding:12px;background:${colors.bgCard}}a{color:${colors.primary}}table{display:block;overflow:auto}</style>
        </head><body>${bodyHtml}</body></html>`;

    return (
        <View style={styles.container}>
            <ScreenHeader title="Article" onBack={() => navigation.goBack()} />

                <View style={styles.header}>
                    <Text style={styles.tag}>{post.category || "General"}</Text>
                    <Text style={styles.title}>{post.title}</Text>
                    
                    <View style={styles.meta}>
                        <Text style={styles.metaText}>{post.author?.full_name || (typeof post.author === "string" ? post.author : null) || "PrepLoop Team"}</Text>
                        {formattedDate && <>
                            <Text style={styles.metaDot}>•</Text>
                            <Text style={styles.metaText}>{formattedDate}</Text>
                        </>}
                        <Text style={styles.metaDot}>•</Text>
                        <Text style={styles.metaText}>{formatReadTime(post.read_time)}</Text>
                    </View>
                </View>

            <WebView
                source={{ html }}
                style={styles.reader}
                javaScriptEnabled={false}
                domStorageEnabled={false}
                allowFileAccess={false}
                originWhitelist={["*"]}
                onShouldStartLoadWithRequest={(request) => {
                    if (request.url === "about:blank") return true;
                    if (/^https?:\/\//i.test(request.url)) Linking.openURL(request.url).catch(() => {});
                    return false;
                }}
            />
            <View style={styles.footer}>
                <TouchableOpacity style={styles.shareButton} onPress={() => Share.share({ message: articleUrl }).catch(() => {})}>
                    <Text style={styles.shareText}>Share Article</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl },
    errorText: { color: colors.textSecondary, textAlign: "center" },
    
    reader: { flex: 1, backgroundColor: colors.bg },
    
    header: { padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
    tag: { color: colors.primary, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightBold, textTransform: "uppercase", marginBottom: spacing.sm },
    title: { color: colors.textPrimary, fontSize: typography.fontSize3XL, fontWeight: typography.fontWeightBold, lineHeight: 36, marginBottom: spacing.md },
    
    meta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
    metaText: { color: colors.textSecondary, fontSize: typography.fontSizeSM },
    metaDot: { color: colors.textMuted, marginHorizontal: spacing.sm },
    
    
    footer: { padding: spacing.xl, alignItems: "center", borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.sm },
    shareButton: { backgroundColor: colors.bgCard, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border },
    shareText: { color: colors.textPrimary, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold },
});
