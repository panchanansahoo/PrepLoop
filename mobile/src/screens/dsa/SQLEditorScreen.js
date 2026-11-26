import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ScrollView,
} from "react-native";
import { WebView } from "react-native-webview";
import { Asset } from "expo-asset";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { Button } from "../../components/Button";
import { sqlApi } from "../../api/sqlApi";

export default function SQLEditorScreen({ route, navigation }) {
    const { problemId, problemTitle } = route.params || {};
    const insets = useSafeAreaInsets();
    
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [code, setCode] = useState("-- Write your SQL query here\nSELECT * FROM table_name;");
    const [submitting, setSubmitting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [loadError, setLoadError] = useState("");
    const [htmlContent, setHtmlContent] = useState("");
    const [activeTab, setActiveTab] = useState("description"); // 'description', 'schema', 'editor', 'result'
    
    const webViewRef = useRef(null);
    
    // Load local HTML asset
    useEffect(() => {
        const loadAsset = async () => {
            try {
                const asset = Asset.fromModule(require("../../../assets/editor.html"));
                await asset.downloadAsync();
                setHtmlContent(asset.localUri || asset.uri);
            } catch (err) {
                setLoadError("Could not open the query editor.");
            }
        };
        loadAsset();
    }, []);

    // Fetch problem details
    useEffect(() => {
        let active = true;
        const fetchProblem = async () => {
            if (!problemId) {
                setLoadError("SQL problem not found.");
                setLoading(false);
                return;
            }
            
            try {
                setLoading(true);
                setLoadError("");
                setTestResult(null);
                const data = await sqlApi.getProblem(problemId);
                if (!active) return;
                if (!data || !data.title) {
                    throw new Error("SQL problem not found");
                }
                setProblem(data);
                setCode(`-- ${data.title}\nSELECT `);
                navigation.setOptions({ title: data.title || problemTitle || "SQL Editor" });
            } catch {
                if (active) setLoadError("Could not load this SQL problem.");
            } finally {
                if (active) setLoading(false);
            }
        };
        
        fetchProblem();
        return () => { active = false; };
    }, [problemId]);
    
    const syncEditorState = useCallback(() => {
        if (!webViewRef.current) return;
        
        webViewRef.current.postMessage(JSON.stringify({
            type: "SET_LANGUAGE",
            payload: { language: "sql" } // Always SQL
        }));
        
        webViewRef.current.postMessage(JSON.stringify({
            type: "SET_CODE",
            payload: { code }
        }));
    }, [code]);
    
    const onMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            
            if (data.type === "READY") {
                syncEditorState();
            } else if (data.type === "CHANGE") {
                setCode(data.payload.code);
            } else if (data.type === "ERROR") {
                console.warn("Editor Error:", data.payload.message);
            }
        } catch (e) {
            console.error("Failed to parse WebView message", e);
        }
    };
    
    const handleSubmit = async () => {
        if (!code.trim()) {
            Alert.alert("Warning", "Please write a query before submitting.");
            return;
        }
        
        setSubmitting(true);
        setActiveTab("result");
        setTestResult(null);
        
        try {
            const result = await sqlApi.runQuery(code, problem?.schemaId);
            setTestResult(result);
        } catch (err) {
            setTestResult({
                success: false,
                status: "error",
                message: err.message || "Failed to execute query",
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loadError) {
        return <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>{loadError}</Text>
            <Button title="Back to SQL problems" onPress={() => navigation.goBack()} />
        </View>;
    }

    if (loading || !htmlContent) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading workspace...</Text>
            </View>
        );
    }

    const schema = problem.schema || [];

    return (
        <KeyboardAvoidingView 
            style={[styles.container, { paddingBottom: insets.bottom }]} 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            {/* Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBarScroll} contentContainerStyle={styles.tabBar}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === "description" && styles.activeTab]}
                    onPress={() => setActiveTab("description")}
                >
                    <Text style={[styles.tabText, activeTab === "description" && styles.activeTabText]}>Problem</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === "schema" && styles.activeTab]}
                    onPress={() => setActiveTab("schema")}
                >
                    <Text style={[styles.tabText, activeTab === "schema" && styles.activeTabText]}>Schema</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === "editor" && styles.activeTab]}
                    onPress={() => setActiveTab("editor")}
                >
                    <Text style={[styles.tabText, activeTab === "editor" && styles.activeTabText]}>Query</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === "result" && styles.activeTab]}
                    onPress={() => setActiveTab("result")}
                >
                    <Text style={[styles.tabText, activeTab === "result" && styles.activeTabText]}>Result</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Content Area */}
            <View style={styles.contentArea}>
                {/* Description Tab */}
                {activeTab === "description" && problem && (
                    <ScrollView style={styles.descriptionContainer}>
                        <View style={styles.difficultyBadge}>
                            <Text style={styles.difficultyText}>{problem.difficulty || "Medium"}</Text>
                        </View>
                        <Text style={styles.problemTitle}>{problem.title}</Text>
                        <Text style={styles.descriptionText}>{problem.description}</Text>
                        
                        {Array.isArray(problem.examples) && problem.examples.length > 0 && (
                            <>
                                <Text style={styles.sectionHeader}>Examples</Text>
                                {problem.examples.map((ex, i) => (
                                    <View key={i} style={styles.exampleBox}>
                                        <Text style={styles.exampleText}><Text style={styles.boldText}>Input:</Text> {ex.input}</Text>
                                        <Text style={styles.exampleText}><Text style={styles.boldText}>Output:</Text> {ex.output}</Text>
                                        {ex.explanation && <Text style={styles.exampleText}><Text style={styles.boldText}>Explanation:</Text> {ex.explanation}</Text>}
                                    </View>
                                ))}
                            </>
                        )}

                        {Array.isArray(problem.hints) && problem.hints.length > 0 && (
                            <>
                                <Text style={styles.sectionHeader}>Hints</Text>
                                {problem.hints.map((hint, i) => (
                                    <View key={i} style={styles.exampleBox}>
                                        <Text style={styles.exampleText}>{hint}</Text>
                                    </View>
                                ))}
                            </>
                        )}
                    </ScrollView>
                )}

                {/* Schema Tab */}
                {activeTab === "schema" && (
                    <ScrollView style={styles.schemaContainer}>
                        <Text style={styles.schemaHeader}>Database Schema</Text>
                        <Text style={styles.schemaSubtext}>Tables available for your query:</Text>
                        
                        {schema.length === 0 ? (
                            <Text style={styles.emptyText}>No schema tables available.</Text>
                        ) : schema.map((table, i) => (
                            <View key={i} style={styles.tableBox}>
                                <View style={styles.tableNameRow}>
                                    <Text style={styles.tableIcon}>🗄️</Text>
                                    <Text style={styles.tableName}>{table.tableName}</Text>
                                </View>
                                
                                <View style={styles.columnsList}>
                                    {table.columns.map((col, j) => (
                                        <View key={j} style={styles.columnRow}>
                                            <Text style={styles.colName}>
                                                {col.name} {col.isPrimaryKey && "🔑"}
                                            </Text>
                                            <Text style={styles.colType}>{col.type}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                )}

                {/* Editor Tab */}
                {activeTab === "editor" && (
                    <View style={styles.editorContainer}>
                        <View style={styles.editorToolbar}>
                            <Text style={styles.toolbarLabel}>Language: SQL</Text>
                        </View>
                        
                        <WebView
                            ref={webViewRef}
                            source={{ uri: htmlContent }}
                            style={styles.webview}
                            originWhitelist={["file://*", "https://unpkg.com"]}
                            allowFileAccess={false}
                            allowFileAccessFromFileURLs={false}
                            allowUniversalAccessFromFileURLs={false}
                            onMessage={onMessage}
                            bounces={false}
                            scrollEnabled={false}
                            showsHorizontalScrollIndicator={false}
                            showsVerticalScrollIndicator={false}
                            keyboardDisplayRequiresUserAction={false}
                            hideKeyboardAccessoryView={true}
                        />
                    </View>
                )}

                {/* Result Tab */}
                {activeTab === "result" && (
                    <ScrollView style={styles.resultContainer}>
                        {submitting ? (
                            <View style={styles.centerContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={styles.loadingText}>Executing query...</Text>
                            </View>
                        ) : !testResult ? (
                            <View style={styles.centerContainer}>
                                <Text style={styles.emptyText}>Run your query to see results here.</Text>
                            </View>
                        ) : (
                            <View>
                                <View style={[
                                    styles.statusBox, 
                                    testResult.success === true ? styles.statusAccepted : styles.statusFailed
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        testResult.success === true ? styles.statusTextAccepted : styles.statusTextFailed
                                    ]}>
                                        {testResult.success === true ? "Query completed" : "Query failed"}
                                    </Text>
                                </View>
                                
                                <Text style={styles.resultDetail}>Runtime: {testResult.executionTime ?? "—"} ms</Text>
                                
                                {testResult.success === true && testResult.columns?.length > 0 && (
                                    <Text style={styles.resultDetail}>{testResult.columns.join(" | ")}</Text>
                                )}
                                {testResult.success === true && Array.isArray(testResult.rows) && testResult.rows.length === 0 && (
                                    <Text style={styles.resultDetail}>(0 rows returned)</Text>
                                )}
                                {testResult.success === true && testResult.rows?.slice(0, 100).map((row, index) => (
                                    <Text key={index} style={styles.resultDetail}>
                                        {(Array.isArray(row) ? row : Object.values(row)).map(value => value ?? "NULL").join(" | ")}
                                    </Text>
                                ))}
                                {testResult.success === true && testResult.output && !Array.isArray(testResult.rows) && (
                                    <Text style={styles.resultDetail}>{testResult.output}</Text>
                                )}
                                {(testResult.error || testResult.message) && (
                                    <View style={styles.errorBox}>
                                        <Text style={styles.errorText}>{testResult.error || testResult.message}</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>

            {/* Bottom Action Bar */}
            <View style={styles.actionBar}>
                <Button 
                    title={activeTab === "editor" ? "Run Query" : "Write Query"}
                    variant="outline"
                    onPress={() => activeTab === "editor" ? handleSubmit() : setActiveTab("editor")}
                    style={{ flex: 1 }}
                    loading={submitting}
                    disabled={submitting}
                />

            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.bg,
    },
    loadingText: {
        color: colors.textSecondary,
        marginTop: spacing.md,
        fontSize: typography.fontSizeMD,
    },
    emptyText: {
        color: colors.textMuted,
        textAlign: "center",
        marginTop: spacing.xl,
    },
    
    /* Tabs */
    tabBarScroll: {
        flexGrow: 0,
        backgroundColor: colors.bgCard,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tabBar: {
        flexDirection: "row",
    },
    tab: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        alignItems: "center",
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
    },
    activeTab: {
        borderBottomColor: colors.primary,
    },
    tabText: {
        color: colors.textSecondary,
        fontWeight: typography.fontWeightSemiBold,
    },
    activeTabText: {
        color: colors.primary,
    },
    
    contentArea: {
        flex: 1,
    },
    
    /* Description */
    descriptionContainer: {
        flex: 1,
        padding: spacing.lg,
    },
    difficultyBadge: {
        alignSelf: "flex-start",
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        backgroundColor: "rgba(245, 158, 11, 0.15)", // Amber for Medium
        marginBottom: spacing.sm,
    },
    difficultyText: {
        color: "#f59e0b",
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightBold,
        textTransform: "uppercase",
    },
    problemTitle: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeXL,
        fontWeight: typography.fontWeightBold,
        marginBottom: spacing.md,
    },
    descriptionText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeMD,
        lineHeight: 24,
        marginBottom: spacing.xl,
    },
    sectionHeader: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightBold,
        marginBottom: spacing.md,
    },
    exampleBox: {
        backgroundColor: colors.bgCard,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.md,
    },
    exampleText: {
        color: colors.textSecondary,
        fontFamily: "SpaceMono-Regular",
        fontSize: typography.fontSizeSM,
        marginBottom: spacing.xs,
    },
    boldText: {
        color: colors.textPrimary,
        fontWeight: typography.fontWeightBold,
        fontFamily: "Inter-SemiBold",
    },
    
    /* Schema */
    schemaContainer: {
        flex: 1,
        padding: spacing.lg,
    },
    schemaHeader: {
        color: colors.textPrimary,
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightBold,
        marginBottom: spacing.xs,
    },
    schemaSubtext: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        marginBottom: spacing.lg,
    },
    tableBox: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.lg,
        overflow: "hidden",
    },
    tableNameRow: {
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.md,
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tableIcon: {
        fontSize: 16,
        marginRight: spacing.sm,
    },
    tableName: {
        color: colors.textPrimary,
        fontWeight: typography.fontWeightBold,
        fontSize: typography.fontSizeMD,
    },
    columnsList: {
        padding: spacing.md,
    },
    columnRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.05)",
    },
    colName: {
        color: colors.textSecondary,
        fontFamily: "SpaceMono-Regular",
        fontSize: typography.fontSizeSM,
    },
    colType: {
        color: "#818cf8",
        fontFamily: "SpaceMono-Regular",
        fontSize: typography.fontSizeSM,
    },

    /* Editor */
    editorContainer: {
        flex: 1,
    },
    editorToolbar: {
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.bgCard,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    toolbarLabel: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
        fontWeight: typography.fontWeightSemiBold,
    },
    webview: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    
    /* Result */
    resultContainer: {
        flex: 1,
        padding: spacing.lg,
    },
    statusBox: {
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.lg,
        alignItems: "center",
    },
    statusAccepted: {
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderWidth: 1,
        borderColor: "rgba(16, 185, 129, 0.3)",
    },
    statusFailed: {
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderWidth: 1,
        borderColor: "rgba(239, 68, 68, 0.3)",
    },
    statusText: {
        fontSize: typography.fontSizeLG,
        fontWeight: typography.fontWeightBold,
    },
    statusTextAccepted: {
        color: "#10b981",
    },
    statusTextFailed: {
        color: "#ef4444",
    },
    resultDetail: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeMD,
        marginBottom: spacing.sm,
    },
    errorBox: {
        marginTop: spacing.md,
        padding: spacing.md,
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderRadius: borderRadius.md,
        borderLeftWidth: 4,
        borderLeftColor: "#ef4444",
    },
    errorText: {
        color: "#fca5a5",
        fontFamily: "SpaceMono-Regular",
        fontSize: typography.fontSizeSM,
    },
    
    /* Action Bar */
    actionBar: {
        flexDirection: "row",
        padding: spacing.md,
        backgroundColor: colors.bgCard,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
});
