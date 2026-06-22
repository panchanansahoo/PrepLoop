import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    StatusBar,
    RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { coinsApi } from "../../api/coinsApi";
import { Card } from "../../components/Card";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { ErrorMessage } from "../../components/ErrorMessage";
import { EmptyState } from "../../components/EmptyState";
import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TX_ICONS = {
    interview_complete: "🎯",
    dsa_solve: "✅",
    daily_challenge: "🔥",
    streak_bonus: "⚡",
    purchase: "💳",
    spend: "🛒",
    refund: "↩️",
    bonus: "🎁",
    default: "🪙",
};

function TxCard({ tx }) {
    // Backend stores amount as positive magnitude; use type to determine direction.
    // displayType is normalized by backend ('earn','spend','redeem'); fall back to type.
    const effectiveType = tx.displayType || tx.type || "";
    const CREDIT_TYPES = new Set([
        "earn",
        "bonus",
        "refund",
        "interview_complete",
        "dsa_solve",
        "daily_challenge",
        "streak_bonus",
    ]);
    const isCredit = CREDIT_TYPES.has(effectiveType);
    const icon =
        TX_ICONS[effectiveType] || TX_ICONS[tx.type] || TX_ICONS.default;
    const date = new Date(tx.createdAt || tx.created_at || Date.now());
    const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
    return (
        <Card style={styles.txCard}>
            <View style={styles.txRow}>
                <View style={styles.txLeft}>
                    <Text style={styles.txIcon}>{icon}</Text>
                    <View style={styles.txTextWrap}>
                        <Text style={styles.txDesc} numberOfLines={2}>
                            {tx.description ||
                                tx.reason ||
                                tx.type?.replace(/_/g, " ") ||
                                "Transaction"}
                        </Text>
                        <Text style={styles.txDate}>{dateStr}</Text>
                    </View>
                </View>
                <Text
                    style={[
                        styles.txAmount,
                        isCredit ? styles.credit : styles.debit,
                    ]}
                >
                    {isCredit ? "+" : ""}
                    {tx.amount} 🪙
                </Text>
            </View>
        </Card>
    );
}

export default function CoinWalletScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [balance, setBalance] = useState(null);
    const [totalEarned, setTotalEarned] = useState(null);
    const [totalSpent, setTotalSpent] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    async function load() {
        try {
            setError("");
            const [balData, txData] = await Promise.allSettled([
                coinsApi.getBalance(),
                coinsApi.getTransactions(),
            ]);
            if (balData.status === "fulfilled") {
                setBalance(balData.value?.balance ?? 0);
                setTotalEarned(balData.value?.totalEarned ?? null);
                setTotalSpent(balData.value?.totalSpent ?? null);
            }
            if (txData.status === "fulfilled") {
                const list = Array.isArray(txData.value)
                    ? txData.value
                    : txData.value?.transactions || txData.value?.data || [];
                setTransactions(list);
            }
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to load wallet.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    if (loading)
        return <LoadingSpinner fullScreen message="Loading wallet..." />;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

            <View
                style={[
                    styles.header,
                    {
                        paddingTop: Math.max(
                            insets.top + spacing.sm,
                            spacing.lg,
                        ),
                    },
                ]}
            >
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                >
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Coin Wallet</Text>
            </View>

            <FlatList
                data={transactions}
                keyExtractor={(item, i) => item.id?.toString() || String(i)}
                renderItem={({ item }) => <TxCard tx={item} />}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            load();
                        }}
                        tintColor={colors.warning}
                        colors={[colors.warning]}
                    />
                }
                ListHeaderComponent={
                    <View>
                        {error && (
                            <ErrorMessage message={error} onRetry={load} />
                        )}
                        <LinearGradient
                            colors={["rgba(245,158,11,0.15)", "#070709"]}
                            style={styles.balanceCard}
                        >
                            <Text style={styles.balanceLabel}>
                                Current Balance
                            </Text>
                            <Text style={styles.balanceValue}>
                                {balance ?? "—"}
                            </Text>
                            <Text style={styles.coinUnit}>🪙 Coins</Text>
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statVal}>
                                        {totalEarned ?? "—"}
                                    </Text>
                                    <Text style={styles.statLabel}>Earned</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statVal}>
                                        {totalSpent ?? "—"}
                                    </Text>
                                    <Text style={styles.statLabel}>Spent</Text>
                                </View>
                            </View>
                        </LinearGradient>

                        <Text style={styles.sectionTitle}>
                            Transaction History
                        </Text>
                    </View>
                }
                ListEmptyComponent={
                    !error ? (
                        <EmptyState
                            emoji="🪙"
                            title="No transactions yet"
                            message="Complete interviews and solve problems to earn coins!"
                        />
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        backgroundColor: colors.bgCardAlt,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: { marginRight: spacing.md, padding: spacing.xs },
    backText: {
        color: "rgba(203,213,225,0.8)",
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightSemiBold,
    },
    headerTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightBold,
    },
    list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
    balanceCard: {
        alignItems: "center",
        paddingVertical: spacing.xl,
        marginTop: spacing.md,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.warning + "44",
        marginBottom: spacing.lg,
    },
    balanceLabel: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
    },
    balanceValue: {
        color: colors.warning,
        fontSize: 56,
        fontWeight: typography.fontWeightExtraBold,
        lineHeight: 64,
    },
    coinUnit: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeMD,
        marginBottom: spacing.md,
    },
    statsRow: { flexDirection: "row", alignItems: "center" },
    statItem: { alignItems: "center", paddingHorizontal: spacing.xl },
    statVal: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeXL,
        fontWeight: typography.fontWeightBold,
    },
    statLabel: {
        color: colors.textMuted,
        fontSize: typography.fontSizeXS,
        marginTop: 2,
    },
    statDivider: { width: 1, height: 32, backgroundColor: colors.border },
    sectionTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightBold,
        marginBottom: spacing.md,
    },
    txCard: { marginBottom: spacing.sm, padding: spacing.sm },
    txRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    txLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
    txIcon: { fontSize: 24, marginRight: spacing.md },
    txTextWrap: { flex: 1, marginRight: spacing.sm },
    txDesc: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightMedium,
        textTransform: "capitalize",
    },
    txDate: {
        color: colors.textMuted,
        fontSize: typography.fontSizeXS,
        marginTop: 2,
    },
    txAmount: {
        fontSize: typography.fontSizeMD,
        fontWeight: typography.fontWeightBold,
    },
    credit: { color: colors.success },
    debit: { color: colors.error },
});
