import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { StatusBar, LogBox, View, Text, StyleSheet } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "./src/context/AuthContext";
import { ThemeProvider } from "./src/context/ThemeContext";
import { CoinProvider } from "./src/context/CoinContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { notifications } from "./src/utils/notifications";
import { usePrepLoopFonts } from "./src/utils/fonts";

// Keep splash screen visible while we initialize
SplashScreen.preventAutoHideAsync().catch((error) => {
    console.warn("[Splash] preventAutoHideAsync failed", error);
});

// Suppress known harmless warnings from 3rd party libs
LogBox.ignoreLogs([
    "Non-serializable values were found in the navigation state",
    "VirtualizedLists should never be nested",
    "[Reanimated]",
    "source.uri should not be an empty string",
    "Require cycle:",
]);

// ── Global Error Boundary ───────────────────────────────────────
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("[ErrorBoundary]", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={ebStyles.container}>
                    <Text style={ebStyles.emoji}>⚠️</Text>
                    <Text style={ebStyles.title}>Something went wrong</Text>
                    <Text style={ebStyles.subtitle}>
                        {this.state.error?.message || "An unexpected error occurred"}
                    </Text>
                    <Text
                        style={ebStyles.retry}
                        onPress={() => this.setState({ hasError: false, error: null })}
                    >
                        Tap to Retry
                    </Text>
                </View>
            );
        }
        return this.props.children;
    }
}

const ebStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#070709",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
    },
    emoji: { fontSize: 48, marginBottom: 16 },
    title: {
        color: "#f8fafc",
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        color: "#a1a1aa",
        fontSize: 15,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 24,
    },
    retry: {
        color: "#818cf8",
        fontSize: 16,
        fontWeight: "600",
        padding: 12,
    },
});

// ── Main App Component ──────────────────────────────────────────
export default function App() {
    const fontsLoaded = usePrepLoopFonts();
    const [isAppReady, setIsAppReady] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const revealApp = async () => {
            try {
                await SplashScreen.hideAsync();
            } catch (error) {
                console.warn("[Splash] hideAsync failed", error);
            } finally {
                if (isMounted) {
                    setIsAppReady(true);
                }
            }
        };

        // Normal path: fonts ready quickly, then hide splash with smooth delay.
        if (fontsLoaded) {
            const smoothDelay = setTimeout(() => {
                void revealApp();
            }, 300);
            return () => {
                isMounted = false;
                clearTimeout(smoothDelay);
            };
        }

        // Safety path: never get permanently stuck on splash if app init stalls.
        const hardTimeout = setTimeout(() => {
            console.warn("[Splash] Startup delayed, forcing splash hide");
            void revealApp();
        }, 3500);

        return () => {
            isMounted = false;
            clearTimeout(hardTimeout);
        };
    }, [fontsLoaded]);

    useEffect(() => {
        // Register for push notifications (non-blocking)
        notifications.register().catch(() => {});

        // Listen for notification taps
        const cleanup = notifications.addResponseListener((response) => {
            const data = response.notification?.request?.content?.data;
            if (data?.type === "streak_reminder") {
                // Could navigate to dashboard — handled by deep linking later
                console.log("[Notification] Streak reminder tapped");
            }
        });

        return () => {
            cleanup();
        };
    }, []);

    // Keep splash visible until startup is complete
    if (!fontsLoaded || !isAppReady) {
        return null;
    }

    return (
        <ErrorBoundary>
            {/* GestureHandlerRootView — required by react-native-gesture-handler v2+ */}
            <GestureHandlerRootView style={{ flex: 1 }}>
                {/* SafeAreaProvider — required for useSafeAreaInsets() in any child */}
                <SafeAreaProvider>
                    <ThemeProvider>
                        <AuthProvider>
                            <CoinProvider>
                                <StatusBar
                                    barStyle="light-content"
                                    backgroundColor="#070709"
                                    translucent={false}
                                />
                                <AppNavigator />
                            </CoinProvider>
                        </AuthProvider>
                    </ThemeProvider>
                </SafeAreaProvider>
            </GestureHandlerRootView>
        </ErrorBoundary>
    );
}
