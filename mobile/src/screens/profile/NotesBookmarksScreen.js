import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    TextInput,
    Modal,
    Alert,
    ActivityIndicator,
} from "react-native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { EmptyState } from "../../components/EmptyState";
import { notesApi } from "../../api/notesApi";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { Ionicons } from "@expo/vector-icons";

export default function NotesBookmarksScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [bookmarks, setBookmarks] = useState([]);
    const [activeTab, setActiveTab] = useState("bookmarks"); // 'bookmarks' | 'notes'

    // Tag filtering
    const [selectedTag, setSelectedTag] = useState("All");

    // Edit Modal state
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editNote, setEditNote] = useState("");
    const [editTags, setEditTags] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const loadData = async () => {
        try {
            const data = await notesApi.getBookmarks();
            setBookmarks(data || []);
        } catch (error) {
            console.error("Failed to load bookmarks:", error);
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

    const handleDelete = async (id) => {
        Alert.alert(
            "Delete Saved Item",
            "Are you sure you want to delete this?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await notesApi.removeBookmark(id);
                            setBookmarks(bookmarks.filter((b) => b.id !== id));
                        } catch (e) {
                            Alert.alert("Error", "Failed to delete.");
                        }
                    },
                },
            ],
        );
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setEditNote(item.note || "");
        setEditTags(item.tags ? item.tags.join(", ") : "");
        setEditModalVisible(true);
    };

    const handleSaveEdit = async () => {
        if (!editingItem) return;
        setIsSaving(true);
        try {
            const tagsArray = editTags
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t.length > 0);
            await notesApi.updateBookmarkNote(editingItem.id, {
                note: editNote,
                tags: tagsArray,
            });
            setBookmarks(
                bookmarks.map((b) =>
                    b.id === editingItem.id
                        ? { ...b, note: editNote, tags: tagsArray }
                        : b,
                ),
            );
            setEditModalVisible(false);
        } catch (e) {
            Alert.alert("Error", "Failed to save updates.");
        } finally {
            setIsSaving(false);
        }
    };

    // Filter logic
    const filteredItems = bookmarks.filter((item) => {
        if (activeTab === "notes" && (!item.note || item.note.trim() === ""))
            return false;
        if (selectedTag !== "All") {
            if (!item.tags || !item.tags.includes(selectedTag)) return false;
        }
        return true;
    });

    // Get unique tags for the current tab
    const availableTags = [
        "All",
        ...new Set(
            bookmarks
                .filter(
                    (b) =>
                        activeTab === "bookmarks" ||
                        (activeTab === "notes" && b.note),
                )
                .flatMap((b) => b.tags || []),
        ),
    ];

    const renderTabs = () => (
        <View style={styles.tabContainer}>
            <TouchableOpacity
                style={[
                    styles.tab,
                    activeTab === "bookmarks" && styles.activeTab,
                ]}
                onPress={() => {
                    setActiveTab("bookmarks");
                    setSelectedTag("All");
                }}
            >
                <Text
                    style={[
                        styles.tabText,
                        activeTab === "bookmarks" && styles.activeTabText,
                    ]}
                >
                    Bookmarks
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tab, activeTab === "notes" && styles.activeTab]}
                onPress={() => {
                    setActiveTab("notes");
                    setSelectedTag("All");
                }}
            >
                <Text
                    style={[
                        styles.tabText,
                        activeTab === "notes" && styles.activeTabText,
                    ]}
                >
                    My Notes
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderTagFilters = () => {
        if (availableTags.length <= 1) return null;
        return (
            <View style={styles.tagFilterContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: spacing.md }}
                >
                    {availableTags.map((tag) => (
                        <TouchableOpacity
                            key={tag}
                            style={[
                                styles.tagPill,
                                selectedTag === tag && styles.tagPillActive,
                            ]}
                            onPress={() => setSelectedTag(tag)}
                        >
                            <Text
                                style={[
                                    styles.tagPillText,
                                    selectedTag === tag &&
                                        styles.tagPillTextActive,
                                ]}
                            >
                                {tag}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ScreenHeader
                    title="Saved"
                    onBack={() => navigation.goBack()}
                />
                {renderTabs()}
                <LoadingSpinner />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader title="Saved" onBack={() => navigation.goBack()} />
            {renderTabs()}
            {renderTagFilters()}

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                    />
                }
            >
                {filteredItems.length === 0 ? (
                    <EmptyState
                        icon={activeTab === "bookmarks" ? "🔖" : "📝"}
                        title={`No ${activeTab === "bookmarks" ? "Bookmarks" : "Notes"} Found`}
                        message={`You haven't saved any ${activeTab} matching this filter.`}
                        actionLabel="Explore Problems"
                        onAction={() => navigation.navigate("DSAPatterns")}
                    />
                ) : (
                    filteredItems.map((item, index) => (
                        <View key={item.id || index} style={styles.card}>
                            <TouchableOpacity
                                style={styles.cardContent}
                                onPress={() =>
                                    navigation.navigate("DSAProblemDetail", {
                                        id: item.question_id || item.questionId,
                                    })
                                }
                            >
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardType}>
                                        {item.question_type || "Problem"}
                                    </Text>
                                    <Text style={styles.date}>
                                        {new Date(
                                            item.created_at,
                                        ).toLocaleDateString()}
                                    </Text>
                                </View>
                                <Text style={styles.cardTitle}>
                                    {item.question_title || "Untitled Problem"}
                                </Text>

                                {item.tags && item.tags.length > 0 && (
                                    <View style={styles.tagsContainer}>
                                        {item.tags.map((t) => (
                                            <View
                                                key={t}
                                                style={styles.smallTag}
                                            >
                                                <Text
                                                    style={styles.smallTagText}
                                                >
                                                    {t}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {item.note ? (
                                    <View style={styles.noteBox}>
                                        <Text
                                            style={styles.cardNote}
                                            numberOfLines={3}
                                        >
                                            📝 {item.note}
                                        </Text>
                                    </View>
                                ) : null}
                            </TouchableOpacity>

                            <View style={styles.cardActions}>
                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={() => openEditModal(item)}
                                >
                                    <Ionicons
                                        name="pencil"
                                        size={18}
                                        color={colors.textSecondary}
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={() => handleDelete(item.id)}
                                >
                                    <Ionicons
                                        name="trash"
                                        size={18}
                                        color={colors.error}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            <Modal visible={editModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Saved Item</Text>

                        <Text style={styles.inputLabel}>
                            Tags (comma separated)
                        </Text>
                        <TextInput
                            style={styles.textInput}
                            value={editTags}
                            onChangeText={setEditTags}
                            placeholder="e.g. array, hard, review"
                            placeholderTextColor={colors.textMuted}
                        />

                        <Text style={styles.inputLabel}>Note</Text>
                        <TextInput
                            style={[styles.textInput, styles.textArea]}
                            value={editNote}
                            onChangeText={setEditNote}
                            placeholder="Add your notes here..."
                            placeholderTextColor={colors.textMuted}
                            multiline
                            textAlignVertical="top"
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnCancel]}
                                onPress={() => setEditModalVisible(false)}
                                disabled={isSaving}
                            >
                                <Text style={styles.modalBtnCancelText}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnSave]}
                                onPress={handleSaveEdit}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#fff"
                                    />
                                ) : (
                                    <Text style={styles.modalBtnSaveText}>
                                        Save
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scrollContent: { padding: spacing.md },

    tabContainer: {
        flexDirection: "row",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tab: { flex: 1, paddingVertical: spacing.md, alignItems: "center" },
    activeTab: { borderBottomWidth: 2, borderBottomColor: colors.primary },
    tabText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightSemiBold,
    },
    activeTabText: { color: colors.primary },

    tagFilterContainer: {
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.bgSecondary,
    },
    tagPill: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        backgroundColor: colors.bgCard,
        marginRight: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    tagPillActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    tagPillText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
    },
    tagPillTextActive: { color: "#fff", fontWeight: typography.fontWeightBold },

    card: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
    },
    cardContent: { padding: spacing.lg },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.xs,
    },
    cardType: {
        color: colors.primary,
        fontSize: typography.fontSizeXS,
        fontWeight: typography.fontWeightBold,
        textTransform: "uppercase",
    },
    date: { color: colors.textSecondary, fontSize: typography.fontSizeXS },
    cardTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightBold,
        marginBottom: spacing.sm,
    },

    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: spacing.sm,
    },
    smallTag: {
        backgroundColor: colors.bgSecondary,
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        marginRight: spacing.xs,
        marginBottom: spacing.xs,
    },
    smallTagText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeXS,
    },

    noteBox: {
        backgroundColor: colors.bgSecondary,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        marginTop: spacing.xs,
    },
    cardNote: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        fontStyle: "italic",
        lineHeight: 20,
    },

    cardActions: {
        flexDirection: "row",
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.bgSecondary,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: "center",
        justifyContent: "center",
    },

    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        padding: spacing.lg,
    },
    modalContent: {
        backgroundColor: colors.bgCard,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
    },
    modalTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightBold,
        marginBottom: spacing.md,
    },
    inputLabel: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        marginBottom: spacing.xs,
    },
    textInput: {
        backgroundColor: colors.bgSecondary,
        color: colors.textPrimary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    textArea: { height: 100 },
    modalActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: spacing.md,
        marginTop: spacing.md,
    },
    modalBtn: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
    },
    modalBtnCancel: { backgroundColor: colors.bgSecondary },
    modalBtnCancelText: {
        color: colors.textPrimary,
        fontWeight: typography.fontWeightSemiBold,
    },
    modalBtnSave: { backgroundColor: colors.primary },
    modalBtnSaveText: { color: "#fff", fontWeight: typography.fontWeightBold },
});
