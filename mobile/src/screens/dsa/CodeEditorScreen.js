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
    TextInput,
} from "react-native";
import { WebView } from "react-native-webview";
import { Asset } from "expo-asset";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, typography, spacing, borderRadius } from "../../utils/theme";
import { Button } from "../../components/Button";
import { dsaApi } from "../../api/dsaApi";

function parseJsonIfString(value, fallback) {
    if (typeof value !== "string") return value ?? fallback;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

export function normalizeProblemPayload(data) {
    const resolved = data?.problem ? data.problem : data;
    if (!resolved || typeof resolved !== "object") {
        return null;
    }
    const rawTemplates = parseJsonIfString(resolved.codeTemplates ?? resolved.starter_code, {});
    const codeTemplates = rawTemplates && typeof rawTemplates === "object" && !Array.isArray(rawTemplates)
        ? rawTemplates
        : {};
    const rawExamples = parseJsonIfString(resolved.examples, []);
    const examples = Array.isArray(rawExamples) ? rawExamples : [];
    return {
        ...resolved,
        codeTemplates,
        examples,
    };
}

export function evaluateSubmissionResult(testResult) {
    if (!testResult || typeof testResult !== "object") {
        return { isAccepted: false, testsPassed: undefined, totalTests: undefined, message: "" };
    }
    const rawPassed = testResult.testsPassed ?? testResult.passed ?? testResult.submission?.test_cases_passed;
    const rawTotal = testResult.totalTests ?? testResult.total ?? testResult.submission?.total_test_cases;
    const testsPassed = rawPassed !== undefined && rawPassed !== null && Number.isFinite(Number(rawPassed))
        ? Number(rawPassed)
        : undefined;
    const totalTests = rawTotal !== undefined && rawTotal !== null && Number.isFinite(Number(rawTotal))
        ? Number(rawTotal)
        : undefined;
    const explicitStatus = testResult.status ?? testResult.submission?.status;

    let isAccepted;
    if (explicitStatus === "error" || explicitStatus === "wrong_answer" || testResult.success === false) {
        isAccepted = false;
    } else if (totalTests !== undefined && totalTests > 0) {
        isAccepted = testsPassed !== undefined && testsPassed >= totalTests;
    } else {
        isAccepted = explicitStatus === "accepted" || testResult.success === true;
    }

    return {
        isAccepted,
        testsPassed,
        totalTests,
        message: testResult.error || testResult.message || "",
    };
}

export default function CodeEditorScreen({ route, navigation }) {
    const { problemId, problemTitle } = route.params || {};
    const insets = useSafeAreaInsets();
    
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [language, setLanguage] = useState("javascript");
    const [code, setCode] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [htmlContent, setHtmlContent] = useState("");
    const [activeTab, setActiveTab] = useState("description"); // 'description', 'editor', 'result'
    const [editorStatus, setEditorStatus] = useState("loading"); // 'loading' | 'ready' | 'error'
    const [editorError, setEditorError] = useState("");
    const [editorReloadKey, setEditorReloadKey] = useState(0);

    const webViewRef = useRef(null);
    
    // Load local HTML asset
    useEffect(() => {
        const loadAsset = async () => {
            try {
                // In development, require resolves to a module ID
                // In production, we'd bundle this or use a remote URL
                const asset = Asset.fromModule(require("../../../assets/editor.html"));
                await asset.downloadAsync();
                
                // For simplicity in this demo, we'll fetch the actual text if it's a local URI,
                // or just rely on WebView loading the asset directly
                setHtmlContent(asset.localUri || asset.uri);
            } catch (err) {
                console.error("Failed to load editor HTML:", err);
                setLoadError("Could not open the code editor.");
            }
        };
        loadAsset();
    }, []);

    // Fetch problem details
    useEffect(() => {
        let active = true;
        const fetchProblem = async () => {
            if (!problemId) {
                setLoadError("Problem not found.");
                setLoading(false);
                return;
            }
            
            try {
                setLoading(true);
                setLoadError("");
                setTestResult(null);
                const data = await dsaApi.getProblemDetails(problemId);
                if (!active) return;
                const normalized = normalizeProblemPayload(data);
                if (!normalized) {
                    throw new Error("Problem details unavailable");
                }
                setProblem(normalized);
                
                // Set default code template
                setCode(normalized.codeTemplates[language] || "");
                
                navigation.setOptions({ title: normalized.title || problemTitle || "Code Editor" });
            } catch (err) {
                if (!active) return;
                setProblem(null);
                setLoadError("Failed to load problem details.");
                Alert.alert("Error", "Failed to load problem details");
            } finally {
                if (active) setLoading(false);
            }
        };
        
        fetchProblem();
        return () => { active = false; };
    }, [problemId]);
    
    // Send code and language to WebView explicitly
    const postEditorState = useCallback((targetLanguage, targetCode) => {
        if (!webViewRef.current) return;
        
        webViewRef.current.postMessage(JSON.stringify({
            type: "SET_LANGUAGE",
            payload: { language: targetLanguage }
        }));
        
        webViewRef.current.postMessage(JSON.stringify({
            type: "SET_CODE",
            payload: { code: targetCode }
        }));
    }, []);

    const syncEditorState = useCallback(() => {
        postEditorState(language, code);
    }, [postEditorState, language, code]);
    
    // Timeout guard if Monaco CDN fails silently
    useEffect(() => {
        if (activeTab !== "editor") {
            if (editorStatus === "ready") {
                setEditorStatus("loading");
            }
            return undefined;
        }
        if (editorStatus !== "loading") return undefined;

        const timer = setTimeout(() => {
            setEditorStatus("error");
            setEditorError("Editor took too long to load. Check your connection and retry.");
        }, 12000);
        return () => clearTimeout(timer);
    }, [activeTab, editorStatus, editorReloadKey]);

    const handleRetryEditor = () => {
        setEditorError("");
        setEditorStatus("loading");
        setEditorReloadKey((k) => k + 1);
    };

    // Handle messages from WebView
    const onMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            
            if (data.type === "READY") {
                setEditorStatus("ready");
                setEditorError("");
                syncEditorState();
            } else if (data.type === "CHANGE") {
                setCode(data.payload.code);
            } else if (data.type === "ERROR") {
                const msg = data.payload?.message || "Failed to load code editor.";
                console.warn("Editor Error:", msg);
                setEditorStatus("error");
                setEditorError(msg);
            }
        } catch (e) {
            console.error("Failed to parse WebView message", e);
        }
    };
    
    // Submit solution
    const handleSubmit = async () => {
        if (!code.trim()) {
            Alert.alert("Warning", "Please write some code before submitting.");
            return;
        }
        
        setSubmitting(true);
        setActiveTab("result");
        setTestResult(null);
        
        try {
            const result = await dsaApi.submitSolution(problem?.id || problemId, {
                code,
                language,
            });
            setTestResult(result);
        } catch (err) {
            setTestResult({
                status: "error",
                message: err.message || "Failed to execute code",
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loadError) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.loadingText}>{loadError}</Text>
                <Button title="Go Back" onPress={() => navigation.goBack()} style={{ marginTop: spacing.md }} />
            </View>
        );
    }

    if (loading || !htmlContent) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading workspace...</Text>
            </View>
        );
    }

    const resultSummary = evaluateSubmissionResult(testResult);

    return (
        <KeyboardAvoidingView 
            style={[styles.container, { paddingBottom: insets.bottom }]} 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            {/* Tabs */}
            <View style={styles.tabBar}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === "description" && styles.activeTab]}
                    onPress={() => setActiveTab("description")}
                >
                    <Text style={[styles.tabText, activeTab === "description" && styles.activeTabText]}>Problem</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === "editor" && styles.activeTab]}
                    onPress={() => setActiveTab("editor")}
                >
                    <Text style={[styles.tabText, activeTab === "editor" && styles.activeTabText]}>Code</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === "result" && styles.activeTab]}
                    onPress={() => setActiveTab("result")}
                >
                    <Text style={[styles.tabText, activeTab === "result" && styles.activeTabText]}>Result</Text>
                </TouchableOpacity>
            </View>

            {/* Content Area */}
            <View style={styles.contentArea}>
                {/* Description Tab */}
                {activeTab === "description" && problem && (
                    <ScrollView style={styles.descriptionContainer}>
                        <View style={styles.difficultyBadge}>
                            <Text style={styles.difficultyText}>{problem.difficulty}</Text>
                        </View>
                        <Text style={styles.problemTitle}>{problem.title}</Text>
                        <Text style={styles.descriptionText}>{problem.description}</Text>
                        
                        {problem.examples?.length > 0 && (
                            <>
                                <Text style={styles.sectionHeader}>Examples</Text>
                                {problem.examples.map((ex, i) => (
                                    <View key={i} style={styles.exampleBox}>
                                        <Text style={styles.exampleText}>
                                            <Text style={styles.boldText}>Input:</Text>{" "}
                                            {typeof ex.input === "string" ? ex.input : JSON.stringify(ex.input)}
                                        </Text>
                                        <Text style={styles.exampleText}>
                                            <Text style={styles.boldText}>Output:</Text>{" "}
                                            {typeof ex.output === "string" ? ex.output : JSON.stringify(ex.output)}
                                        </Text>
                                        {ex.explanation && <Text style={styles.exampleText}><Text style={styles.boldText}>Explanation:</Text> {ex.explanation}</Text>}
                                    </View>
                                ))}
                            </>
                        )}
                    </ScrollView>
                )}

                {/* Editor Tab */}
                {activeTab === "editor" && (
                    <View style={styles.editorContainer}>
                        {/* Language Selector */}
                        <View style={styles.editorToolbar}>
                            <Text style={styles.toolbarLabel}>Language:</Text>
                            <View style={styles.langSelector}>
                                {["javascript", "python", "java", "cpp"].map(lang => (
                                    <TouchableOpacity 
                                        key={lang}
                                        style={[styles.langBtn, language === lang && styles.activeLangBtn]}
                                        onPress={() => {
                                            const templateCode = problem?.codeTemplates?.[lang];
                                            const nextCode = typeof templateCode === "string" ? templateCode : code;
                                            setLanguage(lang);
                                            if (typeof templateCode === "string") {
                                                setCode(templateCode);
                                            }
                                            postEditorState(lang, nextCode);
                                        }}
                                    >
                                        <Text style={[styles.langBtnText, language === lang && styles.activeLangBtnText]}>
                                            {lang === "cpp" ? "C++" : lang.charAt(0).toUpperCase() + lang.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        
                        {/* Monaco WebView or Fallback on Error */}
                        {editorStatus === "error" ? (
                            <View style={styles.editorFallbackWrap}>
                                <View style={styles.editorErrorBanner}>
                                    <Text style={styles.editorErrorText}>
                                        {editorError || "Editor failed to load. You can retry or edit code below."}
                                    </Text>
                                    <TouchableOpacity style={styles.retryEditorBtn} onPress={handleRetryEditor}>
                                        <Text style={styles.retryEditorBtnText}>Retry</Text>
                                    </TouchableOpacity>
                                </View>
                                <TextInput
                                    style={styles.fallbackCodeInput}
                                    multiline
                                    value={code}
                                    onChangeText={setCode}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    textAlignVertical="top"
                                    placeholder="// Write your solution here..."
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>
                        ) : (
                            <WebView
                                key={editorReloadKey}
                                ref={webViewRef}
                                source={{ uri: htmlContent }}
                                style={styles.webview}
                                originWhitelist={["file://*", "https://unpkg.com"]}
                                allowFileAccess={false}
                                allowFileAccessFromFileURLs={false}
                                allowUniversalAccessFromFileURLs={false}
                                onMessage={onMessage}
                                onError={() => {
                                    setEditorStatus("error");
                                    setEditorError("Failed to load editor. Check your connection and tap Retry.");
                                }}
                                onHttpError={() => {
                                    setEditorStatus("error");
                                    setEditorError("Editor resource failed to load. Tap Retry.");
                                }}
                                bounces={false}
                                scrollEnabled={false}
                                showsHorizontalScrollIndicator={false}
                                showsVerticalScrollIndicator={false}
                                keyboardDisplayRequiresUserAction={false}
                                hideKeyboardAccessoryView={true}
                            />
                        )}
                    </View>
                )}

                {/* Result Tab */}
                {activeTab === "result" && (
                    <ScrollView style={styles.resultContainer}>
                        {submitting ? (
                            <View style={styles.centerContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={styles.loadingText}>Running tests against your code...</Text>
                            </View>
                        ) : !testResult ? (
                            <View style={styles.centerContainer}>
                                <Text style={styles.emptyText}>Submit your code to see results here.</Text>
                            </View>
                        ) : (
                            <View>
                                <View style={[
                                    styles.statusBox, 
                                    resultSummary.isAccepted ? styles.statusAccepted : styles.statusFailed
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        resultSummary.isAccepted ? styles.statusTextAccepted : styles.statusTextFailed
                                    ]}>
                                        {resultSummary.isAccepted ? "Accepted!" : "Failed"}
                                    </Text>
                                </View>
                                
                                {Number.isFinite(resultSummary.totalTests) && (
                                    <Text style={styles.resultDetail}>
                                        {resultSummary.testsPassed ?? 0}/{resultSummary.totalTests} tests passed
                                    </Text>
                                )}
                                
                                {!!resultSummary.message && (
                                    <View style={resultSummary.isAccepted ? styles.successBox : styles.errorBox}>
                                        <Text style={resultSummary.isAccepted ? styles.successText : styles.errorText}>
                                            {resultSummary.message}
                                        </Text>
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
                    title={activeTab === "editor" ? "Run Code" : "Write Code"}
                    variant="outline"
                    onPress={() => activeTab === "editor" ? handleSubmit() : setActiveTab("editor")}
                    style={{ flex: 1, marginRight: spacing.sm }}
                    disabled={submitting}
                />
                <Button 
                    title="Submit Solution"
                    variant="primary"
                    onPress={handleSubmit}
                    loading={submitting}
                    style={{ flex: 1, marginLeft: spacing.sm }}
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
    tabBar: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.bgCard,
    },
    tab: {
        flex: 1,
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
        backgroundColor: "rgba(52, 211, 153, 0.15)", // Greenish for Easy
        marginBottom: spacing.sm,
    },
    difficultyText: {
        color: "#34d399",
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
    
    /* Editor */
    editorContainer: {
        flex: 1,
    },
    editorToolbar: {
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.sm,
        backgroundColor: colors.bgCard,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    toolbarLabel: {
        color: colors.textSecondary,
        marginRight: spacing.sm,
        fontSize: typography.fontSizeSM,
    },
    langSelector: {
        flexDirection: "row",
        flex: 1,
    },
    langBtn: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
        marginRight: spacing.xs,
    },
    activeLangBtn: {
        backgroundColor: "rgba(99, 102, 241, 0.15)",
    },
    langBtnText: {
        color: colors.textSecondary,
        fontSize: typography.fontSizeSM,
    },
    activeLangBtnText: {
        color: colors.primary,
        fontWeight: typography.fontWeightBold,
    },
    webview: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    editorFallbackWrap: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    editorErrorBanner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: "rgba(239, 68, 68, 0.12)",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(239, 68, 68, 0.35)",
    },
    editorErrorText: {
        flex: 1,
        color: "#fca5a5",
        fontSize: typography.fontSizeXS,
    },
    retryEditorBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: borderRadius.sm,
    },
    retryEditorBtnText: {
        color: "#fff",
        fontSize: typography.fontSizeXS,
        fontWeight: typography.fontWeightBold,
    },
    fallbackCodeInput: {
        flex: 1,
        padding: spacing.md,
        color: colors.textPrimary,
        fontFamily: "SpaceMono-Regular",
        fontSize: 13,
        lineHeight: 20,
        backgroundColor: "#0F0F1A",
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
    successBox: {
        marginTop: spacing.md,
        padding: spacing.md,
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderRadius: borderRadius.md,
        borderLeftWidth: 4,
        borderLeftColor: "#10b981",
    },
    successText: {
        color: "#6ee7b7",
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
