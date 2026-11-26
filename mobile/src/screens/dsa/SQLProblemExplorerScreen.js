import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, TextInput, ActivityIndicator } from "react-native";
import { sqlApi } from "../../api/sqlApi";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { Ionicons } from "@expo/vector-icons";

export default function SQLProblemExplorerScreen({ navigation }) {
    const [searchQuery, setSearchQuery] = useState("");

    const [problems, setProblems] = useState([]);
    const [status, setStatus] = useState("loading");
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let active = true;
        setStatus("loading");
        setProblems([]);
        sqlApi.getProblems()
            .then(result => {
                if (!active) return;
                setProblems(Array.isArray(result) ? result : []);
                setStatus("ready");
            })
            .catch(() => { if (active) setStatus("error"); });
        return () => { active = false; };
    }, [attempt]);

    const query = searchQuery.trim().toLowerCase();
    const filteredProblems = problems.filter(problem =>
        [problem?.title, ...(Array.isArray(problem?.companies) ? problem.companies : [])]
            .some(value => String(value || "").toLowerCase().includes(query))
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
                                navigation.navigate("SQLEditor", { problemId: prob.id, problemTitle: prob.title });
                            }}
                        >
                            <View style={styles.cardHeader}>
                                <Text style={styles.problemTitle}>{prob.title}</Text>
                            </View>
                            
                            <View style={styles.cardFooter}>
                                <Text style={[styles.difficultyText, { color: getDifficultyColor(prob.difficulty) }]}>
                                    {prob.difficulty}
                                </Text>
                                {!!prob.companies?.length && (
                                    <Text style={styles.badgeText}>{prob.companies.slice(0, 3).join(", ")}</Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                    
                    {status === "loading" && (
                        <View style={styles.emptyState}>
                            <ActivityIndicator size="small" color={colors.primary} />
                            <Text style={styles.emptyText}>Loading SQL problems…</Text>
                        </View>
                    )}
                    {status === "error" && (
                        <TouchableOpacity onPress={() => setAttempt(value => value + 1)}>
                            <Text style={styles.emptyText}>Could not load problems. Tap to retry.</Text>
                        </TouchableOpacity>
                    )}
                    {status === "ready" && filteredProblems.length === 0 && (
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
