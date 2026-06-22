import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput } from "react-native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { dsaApi } from "../../api/dsaApi";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";

export default function ProblemExplorerScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [problems, setProblems] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState("All");

    const loadData = async () => {
        try {
            const data = await dsaApi.getProblems();
            setProblems(data || []);
        } catch (error) {
            console.error("Failed to load problems:", error);
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

    const filteredProblems = problems.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === "All" || p.difficulty === filter;
        return matchesSearch && matchesFilter;
    });

    const renderFilters = () => (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
            {["All", "Easy", "Medium", "Hard"].map(f => (
                <TouchableOpacity 
                    key={f} 
                    style={[styles.filterChip, filter === f && styles.filterChipActive]}
                    onPress={() => setFilter(f)}
                >
                    <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    const getDifficultyColor = (diff) => {
        switch (diff?.toLowerCase()) {
            case "easy": return "#10b981"; // Green
            case "medium": return "#f59e0b"; // Yellow
            case "hard": return "#ef4444"; // Red
            default: return colors.textSecondary;
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Explore Problems" onBack={() => navigation.goBack()} />
                <LoadingSpinner />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader title="Explore Problems" onBack={() => navigation.goBack()} />
            
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search problems..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <View>
                {renderFilters()}
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {filteredProblems.length === 0 ? (
                    <Text style={styles.emptyText}>No problems found.</Text>
                ) : (
                    filteredProblems.map((problem, index) => (
                        <TouchableOpacity 
                            key={problem.id || index}
                            style={styles.card}
                            onPress={() => navigation.navigate("CodeEditor", { problemId: problem.id, problemTitle: problem.title })}
                        >
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>{problem.title}</Text>
                                <Text style={[styles.difficulty, { color: getDifficultyColor(problem.difficulty) }]}>
                                    {problem.difficulty}
                                </Text>
                            </View>
                            <View style={styles.tagsContainer}>
                                {problem.tags && problem.tags.slice(0, 3).map((tag, i) => (
                                    <View key={i} style={styles.tag}>
                                        <Text style={styles.tagText}>{tag}</Text>
                                    </View>
                                ))}
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
    
    searchContainer: { padding: spacing.md, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
    searchInput: { backgroundColor: colors.bg, padding: spacing.md, borderRadius: borderRadius.md, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },
    
    filterContainer: { padding: spacing.md, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row" },
    filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, marginRight: spacing.sm },
    filterChipActive: { backgroundColor: "rgba(129, 140, 248, 0.1)", borderColor: colors.primary },
    filterText: { color: colors.textSecondary, fontSize: typography.fontSizeSM },
    filterTextActive: { color: colors.primary, fontWeight: typography.fontWeightBold },
    
    scrollContent: { padding: spacing.lg, paddingBottom: 40 },
    emptyText: { color: colors.textSecondary, textAlign: "center", marginTop: spacing.xl },
    
    card: { backgroundColor: colors.bgCard, padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
    cardTitle: { color: colors.textPrimary, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold, flex: 1 },
    difficulty: { fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightBold, marginLeft: spacing.sm },
    
    tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    tag: { backgroundColor: colors.bg, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border },
    tagText: { color: colors.textSecondary, fontSize: typography.fontSizeXS },
});
