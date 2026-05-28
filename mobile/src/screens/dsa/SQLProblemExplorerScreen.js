import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, TextInput } from "react-native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { Ionicons } from "@expo/vector-icons";

const MOCK_SQL_PROBLEMS = [
    { id: 1, title: "Find Duplicate Emails", difficulty: "Easy", company: "Uber", acceptance: "68%" },
    { id: 2, title: "Department Highest Salary", difficulty: "Medium", company: "Amazon", acceptance: "55%" },
    { id: 3, title: "Trips and Users", difficulty: "Hard", company: "Uber", acceptance: "36%" },
    { id: 4, title: "Employees Earning More Than Their Managers", difficulty: "Easy", company: "Google", acceptance: "72%" },
];

export default function SQLProblemExplorerScreen({ navigation }) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredProblems = MOCK_SQL_PROBLEMS.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.company.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getDifficultyColor = (diff) => {
        switch (diff) {
            case "Easy": return colors.success;
            case "Medium": return colors.warning;
            case "Hard": return colors.error;
            default: return colors.textSecondary;
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScreenHeader title="SQL Problems" onBack={() => navigation.goBack()} />
            
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={colors.textMuted} />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Search SQL problems or companies..."
                        placeholderTextColor={colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.listContainer}>
                    {filteredProblems.map((prob) => (
                        <TouchableOpacity 
                            key={prob.id} 
                            style={styles.problemCard}
                            activeOpacity={0.7}
                            onPress={() => {
                                // Normally navigates to an SQL editor or problem details.
                                // In mobile, we just show details. We can re-use SQLEditorScreen
                                navigation.navigate("SQLEditor", { problemId: prob.id, problemTitle: prob.title });
                            }}
                        >
                            <View style={styles.cardHeader}>
                                <Text style={styles.problemTitle}>{prob.id}. {prob.title}</Text>
                            </View>
                            
                            <View style={styles.cardFooter}>
                                <Text style={[styles.difficultyText, { color: getDifficultyColor(prob.difficulty) }]}>
                                    {prob.difficulty}
                                </Text>
                                <View style={styles.badge}>
                                    <Ionicons name="business" size={12} color={colors.textSecondary} />
                                    <Text style={styles.badgeText}>{prob.company}</Text>
                                </View>
                                <View style={styles.badge}>
                                    <Ionicons name="checkmark-circle-outline" size={12} color={colors.textSecondary} />
                                    <Text style={styles.badgeText}>{prob.acceptance}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                    
                    {filteredProblems.length === 0 && (
                        <View style={styles.emptyState}>
                            <Ionicons name="search-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyText}>No SQL problems found matching "{searchQuery}"</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bg },
    searchContainer: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: colors.bgInput, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, height: 44, borderWidth: 1, borderColor: colors.borderLight },
    searchInput: { flex: 1, marginLeft: spacing.sm, color: colors.textPrimary, fontSize: typography.fontSizeMD },
    container: { padding: spacing.md, paddingBottom: spacing.xxl },
    listContainer: { gap: spacing.md },
    problemCard: { backgroundColor: colors.bgCard, borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.borderLight },
    cardHeader: { marginBottom: spacing.md },
    problemTitle: { color: colors.textPrimary, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold },
    cardFooter: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    difficultyText: { fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightMedium },
    badge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.bgInput, paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.sm },
    badgeText: { color: colors.textSecondary, fontSize: typography.fontSizeXS },
    emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: spacing.xxl },
    emptyText: { color: colors.textSecondary, fontSize: typography.fontSizeMD, marginTop: spacing.md, textAlign: "center" },
});
