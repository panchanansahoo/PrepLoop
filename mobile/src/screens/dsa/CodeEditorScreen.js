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
import { dsaApi } from "../../api/dsaApi";

export default function CodeEditorScreen({ route, navigation }) {
    const { problemId, problemTitle } = route.params || {};
    const insets = useSafeAreaInsets();
    
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [language, setLanguage] = useState("javascript");
    const [code, setCode] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [htmlContent, setHtmlContent] = useState("");
    const [activeTab, setActiveTab] = useState("description"); // 'description', 'editor', 'result'
    
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
            }
        };
        loadAsset();
    }, []);

    // Fetch problem details
    useEffect(() => {
        const fetchProblem = async () => {
            if (!problemId) return;
            
            try {
                setLoading(true);
                const data = await dsaApi.getProblemDetails(problemId);
                setProblem(data);
                
                // Set default code template
                if (data.codeTemplates && data.codeTemplates[language]) {
                    setCode(data.codeTemplates[language]);
                }
                
                navigation.setOptions({ title: data.title || "Code Editor" });
            } catch (err) {
                Alert.alert("Error", "Failed to load problem details");
            } finally {
                setLoading(false);
            }
        };
        
        fetchProblem();
    }, [problemId]);
    
    // Send code to WebView when it initializes or language changes
    const syncEditorState = useCallback(() => {
        if (!webViewRef.current) return;
        
        webViewRef.current.postMessage(JSON.stringify({
            type: "SET_LANGUAGE",
            payload: { language }
        }));
        
        webViewRef.current.postMessage(JSON.stringify({
            type: "SET_CODE",
            payload: { code }
        }));
    }, [language, code]);
    
    // Handle messages from WebView
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
            const result = await dsaApi.submitSolution(problemId, {
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

    if (loading || !htmlContent) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading workspace...</Text>
            </View>
        );
    }

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
                        
                        <Text style={styles.sectionHeader}>Examples</Text>
                        {problem.examples?.map((ex, i) => (
                            <View key={i} style={styles.exampleBox}>
                                <Text style={styles.exampleText}><Text style={styles.boldText}>Input:</Text> {ex.input}</Text>
                                <Text style={styles.exampleText}><Text style={styles.boldText}>Output:</Text> {ex.output}</Text>
                                {ex.explanation && <Text style={styles.exampleText}><Text style={styles.boldText}>Explanation:</Text> {ex.explanation}</Text>}
                            </View>
                        ))}
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
                                            setLanguage(lang);
                                            // Reset code to template if available
                                            if (problem?.codeTemplates?.[lang]) {
                                                setCode(problem.codeTemplates[lang]);
                                                syncEditorState();
                                            }
                                        }}
                                    >
                                        <Text style={[styles.langBtnText, language === lang && styles.activeLangBtnText]}>
                                            {lang === "cpp" ? "C++" : lang.charAt(0).toUpperCase() + lang.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        
                        {/* Monaco WebView */}
                        <WebView
                            ref={webViewRef}
                            source={{ uri: htmlContent }}
                            style={styles.webview}
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
                                    testResult.status === "accepted" ? styles.statusAccepted : styles.statusFailed
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        testResult.status === "accepted" ? styles.statusTextAccepted : styles.statusTextFailed
                                    ]}>
                                        {testResult.status === "accepted" ? "Accepted!" : "Failed"}
                                    </Text>
                                </View>
                                
                                <Text style={styles.resultDetail}>Runtime: {testResult.runtime || "0"} ms</Text>
                                <Text style={styles.resultDetail}>Memory: {testResult.memory || "0"} MB</Text>
                                
                                {testResult.message && (
                                    <View style={styles.errorBox}>
                                        <Text style={styles.errorText}>{testResult.message}</Text>
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
