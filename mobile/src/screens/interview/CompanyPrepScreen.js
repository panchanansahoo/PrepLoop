import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image } from "react-native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { companyApi } from "../../api/companyApi";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";

export default function CompanyPrepScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [companies, setCompanies] = useState([]);

    const loadData = async () => {
        try {
            const data = await companyApi.getCompanies();
            setCompanies(data || []);
        } catch (error) {
            console.error("Failed to load companies:", error);
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
                <ScreenHeader title="Company Prep" onBack={() => navigation.goBack()} />
                <LoadingSpinner />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader title="Company Prep" onBack={() => navigation.goBack()} />
            
            <View style={styles.heroSection}>
                <Text style={styles.heroTitle}>Target Top Tier</Text>
                <Text style={styles.heroDesc}>Practice frequently asked questions by top tech companies.</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                <View style={styles.grid}>
                    {companies.map((company, index) => (
                        <TouchableOpacity 
                            key={company.id || index} 
                            style={styles.card}
                            onPress={() => navigation.navigate("CompanyDetails", { companyId: company.id, name: company.name })}
                        >
                            <View style={styles.iconContainer}>
                                <Text style={styles.iconText}>{company.name?.charAt(0) || "C"}</Text>
                            </View>
                            <Text style={styles.companyName}>{company.name}</Text>
                            <Text style={styles.questionCount}>{company.questionCount || 0} questions</Text>
                        </TouchableOpacity>
                    ))}
                    
                    {/* Mock data if API is empty for UI demonstration */}
                    {companies.length === 0 && (
                        <>
                            {["Google", "Meta", "Amazon", "Apple", "Netflix", "Microsoft"].map((name, i) => (
                                <TouchableOpacity key={i} style={styles.card}>
                                    <View style={styles.iconContainer}>
                                        <Text style={styles.iconText}>{name.charAt(0)}</Text>
                                    </View>
                                    <Text style={styles.companyName}>{name}</Text>
                                    <Text style={styles.questionCount}>{Math.floor(Math.random() * 50) + 10} questions</Text>
                                </TouchableOpacity>
                            ))}
                        </>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    heroSection: { padding: spacing.xl, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
    heroTitle: { color: colors.textPrimary, fontSize: typography.fontSizeXL, fontWeight: typography.fontWeightBold, marginBottom: spacing.xs },
    heroDesc: { color: colors.textSecondary, fontSize: typography.fontSizeSM },
    
    scrollContent: { padding: spacing.lg },
    grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    
    card: { 
        width: "48%", 
        backgroundColor: colors.bgCard, 
        padding: spacing.lg, 
        borderRadius: borderRadius.lg, 
        marginBottom: spacing.md, 
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
    },
    iconContainer: { 
        width: 48, 
        height: 48, 
        borderRadius: 24, 
        backgroundColor: "rgba(129, 140, 248, 0.1)", 
        justifyContent: "center", 
        alignItems: "center",
        marginBottom: spacing.md,
    },
    iconText: { color: colors.primary, fontSize: typography.fontSizeXL, fontWeight: typography.fontWeightBold },
    companyName: { color: colors.textPrimary, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightBold, marginBottom: spacing.xs },
    questionCount: { color: colors.textSecondary, fontSize: typography.fontSizeSM },
});
